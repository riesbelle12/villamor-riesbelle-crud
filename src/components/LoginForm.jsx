import { useState } from 'react'

export default function LoginForm({ login, setLogin, onSubmit, error, isSubmitting }) {
  const [showPassword, setShowPassword] = useState(false)

  const updateField = (field, value) => {
    setLogin({ ...login, [field]: value })
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="eyebrow">Dahlia collection</p>
        <div className="flower" aria-hidden="true">✿</div>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to tend your product collection.</p>
        {error && <p className="alert">{error}</p>}
        <form onSubmit={onSubmit}>
          <label>
            Username
            <input
              required
              value={login.username}
              onChange={(event) => updateField('username', event.target.value)}
            />
          </label>
          <label>
            Password
            <span className="password-field">
              <input
                id="login-password"
                required
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={login.password}
                onChange={(event) => updateField('password', event.target.value)}
              />
              <button
                className="password-toggle"
                type="button"
                aria-controls="login-password"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
          </label>
          <button className="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}