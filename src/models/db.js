const fs = require("fs");
const path = require("path");

const isVercel = process.env.VERCEL === "1" || !!process.env.VERCEL;
const defaultDbPath = isVercel ? "/tmp/data/database.db" : "./data/database.db";
const dbPath = process.env.DB_PATH || defaultDbPath;
const DATA_DIR = path.resolve(path.dirname(dbPath));

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function collectionPath(name) {
  ensureDir();
  return path.join(DATA_DIR, `${name}.json`);
}

function readCollection(name) {
  const file = collectionPath(name);
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return {};
  }
}

function writeCollection(name, data) {
  fs.writeFileSync(collectionPath(name), JSON.stringify(data, null, 2), "utf-8");
}

const Store = {
  insert(collection, id, doc) {
    const data = readCollection(collection);
    if (data[id]) throw new Error(`Duplicate id: ${id}`);
    data[id] = { ...doc, _id: id };
    writeCollection(collection, data);
    return data[id];
  },

  upsert(collection, id, doc) {
    const data = readCollection(collection);
    data[id] = { ...doc, _id: id };
    writeCollection(collection, data);
    return data[id];
  },

  findById(collection, id) {
    const data = readCollection(collection);
    return data[id] || null;
  },

  findOne(collection, predicate) {
    const data = readCollection(collection);
    return Object.values(data).find(predicate) || null;
  },

  findAll(
    collection,
    predicate,
    { limit = 200, offset = 0, sortBy = "_createdAt", desc = true } = {}
  ) {
    const data = readCollection(collection);
    let items = Object.values(data);
    if (predicate) items = items.filter(predicate);
    items.sort((a, b) => {
      const av = a[sortBy] || "";
      const bv = b[sortBy] || "";
      return desc ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
    });
    return items.slice(offset, offset + limit);
  },

  remove(collection, id) {
    const data = readCollection(collection);
    if (!data[id]) return false;
    delete data[id];
    writeCollection(collection, data);
    return true;
  },

  removeWhere(collection, predicate) {
    const data = readCollection(collection);
    let count = 0;
    for (const [k, v] of Object.entries(data)) {
      if (predicate(v)) { delete data[k]; count++; }
    }
    if (count > 0) writeCollection(collection, data);
    return count;
  },
};

function initDB() {
  ensureDir();
}

module.exports = { Store, initDB };
