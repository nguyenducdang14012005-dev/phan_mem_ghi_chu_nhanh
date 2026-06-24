import { API, apiFetch } from "./apiClient.js";

export async function getReminders() {
  return apiFetch(`${API}/reminders`);
}

export async function createReminder(payload) {
  return apiFetch(`${API}/reminders`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export default { getReminders, createReminder };
