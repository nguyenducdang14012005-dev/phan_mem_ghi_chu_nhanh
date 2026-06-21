const API = "http://localhost:5000/api";

export async function getLabels() {
  const res = await fetch(`${API}/labels`);
  return res.json();
}

export async function createLabel(payload) {
  await fetch(`${API}/labels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteLabel(id) {
  await fetch(`${API}/labels/${id}`, { method: "DELETE" });
}

export async function attachLabel(note_id, label_id) {
  await fetch(`${API}/labels/attach`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note_id, label_id }),
  });
}

export async function detachLabel(note_id, label_id) {
  await fetch(`${API}/labels/detach`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note_id, label_id }),
  });
}

export default {
  getLabels,
  createLabel,
  deleteLabel,
  attachLabel,
  detachLabel,
};
