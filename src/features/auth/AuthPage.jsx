import { useState } from 'react';
import {
  registerHost,
  requestPasswordReset,
  signInHost,
} from './authService.js';

const messages = {
  'auth/email-already-in-use': 'Este e-mail já possui uma conta.',
  'auth/invalid-credential': 'E-mail ou senha não conferem.',
  'auth/invalid-email': 'Informe um e-mail válido.',
  'auth/weak-password': 'A senha precisa ter pelo menos seis caracteres.',
};

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setStatus('');
    setBusy(true);

    try {
      if (mode === 'register') await registerHost(email, password);
      if (mode === 'login') await signInHost(email, password);
      if (mode === 'reset') {
        await requestPasswordReset(email);
        setStatus('Se a conta existir, enviaremos um link de redefinição.');
      }
    } catch (cause) {
      setError(messages[cause.code] ?? 'Não foi possível concluir a solicitação. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  const title = mode === 'register'
    ? 'Crie sua conta de anfitrião'
    : mode === 'reset'
      ? 'Redefina sua senha'
      : 'Entre para organizar sua festa';

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="auth-title">
        <p className="eyebrow">RSVP DE FESTA</p>
        <h1 id="auth-title">{title}</h1>
        <p className="auth-intro">Convites, respostas e lista de presença em um só lugar.</p>
        <form onSubmit={submit}>
          <label htmlFor="host-email">E-mail</label>
          <input
            autoComplete="email"
            id="host-email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
          {mode !== 'reset' && (
            <>
              <label htmlFor="host-password">Senha</label>
              <input
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                id="host-password"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          {status && <p className="form-status" role="status">{status}</p>}
          <button className="primary-button" disabled={busy} type="submit">
            {busy ? 'Aguarde...' : mode === 'register' ? 'Criar minha conta' : mode === 'reset' ? 'Enviar link de redefinição' : 'Entrar'}
          </button>
        </form>
        <div className="auth-actions">
          {mode === 'login' && (
            <>
              <button className="text-button" onClick={() => setMode('register')} type="button">Criar conta</button>
              <button className="text-button" onClick={() => setMode('reset')} type="button">Esqueci minha senha</button>
            </>
          )}
          {mode === 'register' && (
            <button className="text-button" onClick={() => setMode('login')} type="button">Já tenho conta</button>
          )}
          {mode === 'reset' && (
            <button className="text-button" onClick={() => setMode('login')} type="button">Voltar para entrar</button>
          )}
        </div>
      </section>
    </main>
  );
}