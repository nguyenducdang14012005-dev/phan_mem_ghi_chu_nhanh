const API = "http://localhost:5000/api";

export async function searchNotes({ view, keyword, label_id }) {
  let url = `${API}/notes/search?`;
  if (view === "archive") url += "status=Archived";
  else if (view === "trash") url += "status=Deleted";
  else if (view === "reminders") url += "status=Active";
  else url += "status=Active";
  if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
  if (label_id) url += `&label_id=${label_id}`;
  const res = await fetch(url);
  const data = await res.json();
  const notes = Array.isArray(data) ? data : [];
  const notesWithLabels = await Promise.all(
    notes.map(async (note) => {
      try {
        const labelRes = await fetch(`${API}/notes/${note.note_id}/labels`);
        const labels = await labelRes.json();
        return { ...note, labels };
      } catch (e) {
        return { ...note, labels: [] };
      }
    }),
  );
  return notesWithLabels;
}

export async function createNote(payload) {
  await fetch(`${API}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function togglePin(id) {
  await fetch(`${API}/notes/${id}/pin`, { method: "PUT" });
}

export async function changeStatus(id, status) {
  await fetch(`${API}/notes/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export default { searchNotes, createNote, togglePin, changeStatus };
