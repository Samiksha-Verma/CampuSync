// Turns an axios error into a specific, user-facing message instead of a generic
// fallback - distinguishes "the backend rejected this" from "the backend was
// unreachable," which otherwise look identical to the user but mean very different
// things (fix your input vs. the server is down).
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response) {
    const serverMessage = err.response.data?.message;
    if (serverMessage) return serverMessage;
    return `The server returned an unexpected error (status ${err.response.status}). Please try again.`;
  }
  if (err?.code === 'ECONNABORTED') {
    return 'The request timed out. The server may be slow or unreachable - please try again.';
  }
  if (err?.request) {
    return 'Could not reach the server. It may be down or unreachable - please try again in a moment.';
  }
  return err?.message || fallback;
}
