const API = "http://localhost:5000/api";

export async function shareNote(id, payload) {
  await fetch(`${API}/shares/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export default { shareNote };
