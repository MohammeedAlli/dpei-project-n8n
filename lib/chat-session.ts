// "New chat" = forget the stored session id; askAssistant() creates a fresh one on the next message,
// so the n8n Simple Memory starts from scratch.
export function resetAssistantSession() {
  try {
    window.localStorage.removeItem('souk-chat-session');
  } catch {
    /* ignore */
  }
}
