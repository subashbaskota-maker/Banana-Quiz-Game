async function readResponse(response) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    // Use the status code when the server does not return JSON.
  }

  if (!response.ok) {
    throw new Error(body?.error || `Request failed with status ${response.status}.`);
  }
  return body;
}

export async function register(email, password) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  });
  return readResponse(response);
}

export async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  });
  return readResponse(response);
}

export async function getCurrentUser() {
  const response = await fetch('/api/auth/me', { credentials: 'include' });
  if (response.status === 401) {
    return null;
  }
  return readResponse(response).then((body) => body.user);
}

export async function logout() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  return readResponse(response);
}