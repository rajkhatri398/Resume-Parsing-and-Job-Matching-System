const resultOutput = document.getElementById("resultOutput");
const listOutput = document.getElementById("listOutput");
const toastContainer = document.getElementById("toastContainer");
const currentResumeIdEl = document.getElementById("currentResumeId");

const RESUME_ID_KEY = "currentResumeId";

function show(target, data) {
  target.textContent = JSON.stringify(data, null, 2);
}

function setCurrentResumeId(id) {
  const cleaned = (id || "").trim();
  if (!cleaned) return;
  localStorage.setItem(RESUME_ID_KEY, cleaned);
  if (currentResumeIdEl) currentResumeIdEl.textContent = cleaned;
  const resumeInput = document.getElementById("resumeId");
  if (resumeInput) resumeInput.value = cleaned;
}

function loadCurrentResumeId() {
  const stored = localStorage.getItem(RESUME_ID_KEY);
  if (stored) {
    if (currentResumeIdEl) currentResumeIdEl.textContent = stored;
    const resumeInput = document.getElementById("resumeId");
    if (resumeInput && !resumeInput.value) resumeInput.value = stored;
  }
}

function notify(type, title, message, timeout = 3000) {
  if (!toastContainer) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-title">${title}</div><div class="toast-msg">${message}</div>`;
  toastContainer.prepend(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.2s ease";
    setTimeout(() => toast.remove(), 220);
  }, timeout);
}

async function api(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

function setLatestIdsFromResult(data) {
  if (data?.id) {
    setCurrentResumeId(data.id);
  }
  if (data?.jobId || data?.id) {
    const jdField = document.getElementById("jdId");
    if (jdField && !jdField.value) jdField.value = data.jobId || data.id;
  }
}

loadCurrentResumeId();

document.getElementById("resumeId").addEventListener("input", (e) => {
  const value = e.target.value.trim();
  if (!value) return;
  setCurrentResumeId(value);
});

document.getElementById("resumeTextForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const text = document.getElementById("resumeText").value.trim();
    const payload = { text, fileName: "resume_from_ui.txt" };
    const data = await api("/api/resumes/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLatestIdsFromResult(data);
    show(resultOutput, data);
    notify("success", "Resume Saved", `Resume parsed successfully. ID: ${data.id || "generated"}`);
  } catch (err) {
    show(resultOutput, { error: err.message });
    notify("error", "Resume Save Failed", err.message);
  }
});

document.getElementById("resumeUploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const fileInput = document.getElementById("resumeFile");
    if (!fileInput.files.length) throw new Error("Please select a resume file.");
    const form = new FormData();
    form.append("resume", fileInput.files[0]);

    const response = await fetch("/api/resumes/upload", { method: "POST", body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Upload failed.");

    setLatestIdsFromResult(data);
    show(resultOutput, data);
    notify("success", "Resume Uploaded", `File uploaded and parsed. ID: ${data.id || "generated"}`);
  } catch (err) {
    show(resultOutput, { error: err.message });
    notify("error", "Upload Failed", err.message);
  }
});

document.getElementById("jdForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const text = document.getElementById("jdText").value.trim();
    const role = document.getElementById("jdRole").value.trim();
    const company = document.getElementById("jdCompany").value.trim();
    const jobId = document.getElementById("jdJobId").value.trim();

    const payload = { text, role, company, jobId };
    const data = await api("/api/jds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLatestIdsFromResult(data);
    show(resultOutput, data);
    notify("success", "JD Saved", `Job description stored. Job ID: ${data.jobId || data.id || "generated"}`);
  } catch (err) {
    show(resultOutput, { error: err.message });
    notify("error", "JD Save Failed", err.message);
  }
});

document.getElementById("matchForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const resumeId = document.getElementById("resumeId").value.trim();
    if (!resumeId) throw new Error("Resume ID is required.");
    const data = await api(`/api/match/resume/${encodeURIComponent(resumeId)}/all`, {
      method: "POST",
    });
    show(resultOutput, data);
    const count = Array.isArray(data.matchingJobs) ? data.matchingJobs.length : 0;
    notify("success", "Matching Complete", `Matched against ${count} job description(s).`);
  } catch (err) {
    show(resultOutput, { error: err.message });
    notify("error", "Matching Failed", err.message);
  }
});

document.getElementById("matchOneBtn").addEventListener("click", async () => {
  try {
    const resumeId = document.getElementById("resumeId").value.trim();
    const jdId = document.getElementById("jdId").value.trim();
    if (!resumeId) throw new Error("Resume ID is required.");
    if (!jdId) throw new Error("JD ID or Job ID is required for one-to-one match.");

    const data = await api(
      `/api/match/resume/${encodeURIComponent(resumeId)}/jd/${encodeURIComponent(jdId)}`,
      { method: "POST" }
    );
    show(resultOutput, data);
    notify("success", "Single Match Complete", "Resume matched against selected job description.");
  } catch (err) {
    show(resultOutput, { error: err.message });
    notify("error", "Single Match Failed", err.message);
  }
});

document.getElementById("refreshResumes").addEventListener("click", async () => {
  try {
    const data = await api("/api/resumes?limit=20");
    show(listOutput, { type: "resumes", ...data });
    notify("info", "Resumes Loaded", `Fetched ${data.count || 0} resume record(s).`, 2200);
  } catch (err) {
    show(listOutput, { error: err.message });
    notify("error", "Load Failed", err.message);
  }
});

document.getElementById("refreshJds").addEventListener("click", async () => {
  try {
    const data = await api("/api/jds?limit=20");
    show(listOutput, { type: "job_descriptions", ...data });
    notify("info", "JDs Loaded", `Fetched ${data.count || 0} job description record(s).`, 2200);
  } catch (err) {
    show(listOutput, { error: err.message });
    notify("error", "Load Failed", err.message);
  }
});
