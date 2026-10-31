function AuthForm({ mode, onModeChange, onSubmit, busy, error }) {
  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    await onSubmit({
      email: formData.get('email'),
      password: formData.get('password')
    });
    form.reset();
  }

  const isRegistering = mode === 'register';

  return (
    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="auth-tabs" role="group" aria-label="Account action">
        <button
          type="button"
          className={isRegistering ? '' : 'active'}
          aria-pressed={!isRegistering}
          onClick={() => onModeChange('login')}
          disabled={busy}
        >
          Log in
        </button>
        <button
          type="button"
          className={isRegistering ? 'active' : ''}
          aria-pressed={isRegistering}
          onClick={() => onModeChange('register')}
          disabled={busy}
        >
          Create account
        </button>
      </div>

      <h2 id="auth-title">{isRegistering ? 'Create your account' : 'Welcome back'}</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="auth-email">Email</label>
        <input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          disabled={busy}
        />
        <label htmlFor="auth-password">Password</label>
        <input
          id="auth-password"
          name="password"
          type="password"
          autoComplete={isRegistering ? 'new-password' : 'current-password'}
          minLength={isRegistering ? 8 : undefined}
          maxLength={128}
          required
          disabled={busy}
        />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? 'Please wait…' : isRegistering ? 'Create account' : 'Log in'}
        </button>
      </form>
    </section>
  );
}

export default AuthForm;