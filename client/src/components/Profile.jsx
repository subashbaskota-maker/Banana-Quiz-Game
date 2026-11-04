import { useEffect, useState } from 'react';
import { updateUsername } from '../api/authApi.js';

function Profile({ user, onUserUpdate, onLogout, logoutBusy, logoutError, onClose }) {
  const [username, setUsername] = useState(user.username);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [now, setNow] = useState(Date.now());
  const changeAvailableAt = user.usernameChangeAvailableAt
    ? new Date(user.usernameChangeAvailableAt)
    : null;
  const changeLocked = changeAvailableAt && changeAvailableAt.getTime() > now;

  useEffect(() => {
    setUsername(user.username);
  }, [user.username]);

  useEffect(() => {
    if (!changeAvailableAt) {
      return undefined;
    }

    const timeoutId = setTimeout(
      () => setNow(Date.now()),
      Math.max(0, changeAvailableAt.getTime() - Date.now() + 1)
    );
    return () => clearTimeout(timeoutId);
  }, [user.usernameChangeAvailableAt]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await updateUsername(username);
      onUserUpdate(response.user);
      setUsername(response.user.username);
      setMessage('Username updated.');
    } catch (err) {
      setError(err.message || 'Could not update your username.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="profile-view" aria-labelledby="profile-title">
      <header className="profile-heading">
        <div>
          <p className="eyebrow">YOUR ACCOUNT</p>
          <h2 id="profile-title">Player profile</h2>
        </div>
        <button className="text-button" type="button" onClick={onClose}>
          ← Back to game
        </button>
      </header>

      <p className="profile-email">Signed in as <strong>{user.email}</strong></p>

      <form className="profile-form" onSubmit={handleSubmit}>
        <label htmlFor="profile-username">Username</label>
        <input
          id="profile-username"
          name="username"
          type="text"
          autoComplete="username"
          minLength={3}
          maxLength={20}
          pattern="[A-Za-z0-9_]+"
          title="Use 3–20 letters, numbers, or underscores."
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
          disabled={saving || Boolean(changeLocked)}
        />
        <p className="profile-hint">
          Use 3–20 letters, numbers, or underscores. Usernames can be changed once every 24 hours.
          {changeLocked && ` You can change yours again ${changeAvailableAt.toLocaleString()}.`}
        </p>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {logoutError && <p className="auth-error" role="alert">{logoutError}</p>}
        {message && <p className="profile-success" role="status">{message}</p>}
        <button className="primary-button" type="submit" disabled={saving || Boolean(changeLocked)}>
          {saving ? 'Saving…' : 'Save username'}
        </button>
      </form>

      <div className="profile-logout">
        <div>
          <h3>Sign out</h3>
          <p>Log out of your Banana Quiz account on this device.</p>
        </div>
        <button className="text-button" type="button" onClick={onLogout} disabled={logoutBusy}>
          {logoutBusy ? 'Please wait…' : 'Log out'}
        </button>
      </div>
    </section>
  );
}

export default Profile;
