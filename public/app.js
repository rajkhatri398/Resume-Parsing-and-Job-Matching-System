const resultOutput = document.getElementById("resultOutput");
const listOutput = document.getElementById("listOutput");

function show(target, data) {
  target.textContent = JSON.stringify(data, null, 2);
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
    const id = data.id;
    const resumeInput = document.getElementById("resumeId");
    if (resumeInput && !resumeInput.value) resumeInput.value = id;
  }
  if (data?.jobId || data?.id) {
    const jdField = document.getElementById("jdId");
    if (jdField && !jdField.value) jdField.value = data.jobId || data.id;
  }
}

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
  } catch (err) {
    show(resultOutput, { error: err.message });
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
  } catch (err) {
    show(resultOutput, { error: err.message });
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
  } catch (err) {
    show(resultOutput, { error: err.message });
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
  } catch (err) {
    show(resultOutput, { error: err.message });
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
  } catch (err) {
    show(resultOutput, { error: err.message });
  }
});

document.getElementById("refreshResumes").addEventListener("click", async () => {
  try {
    const data = await api("/api/resumes?limit=20");
    show(listOutput, { type: "resumes", ...data });
  } catch (err) {
    show(listOutput, { error: err.message });
  }
});

document.getElementById("refreshJds").addEventListener("click", async () => {
  try {
    const data = await api("/api/jds?limit=20");
    show(listOutput, { type: "job_descriptions", ...data });
  } catch (err) {
    show(listOutput, { error: err.message });
  }
});
