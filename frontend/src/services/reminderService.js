const API = "http://localhost:5000/api";

export async function getReminders() {
  const res = await fetch(`${API}/reminders`);
  return res.json();
}

export async function createReminder(payload) {
  await fetch(`${API}/reminders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export default { getReminders, createReminder };
