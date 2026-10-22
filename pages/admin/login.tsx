import Head from 'next/head';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Gagal masuk. Periksa email dan kata sandi.');
      return;
    }
    router.push('/admin/dashboard');
  }

  return (
    <div className="login-wrap">
      <Head>
        <title>Masuk Admin — KB Bhineka Tunggal Ika</title>
      </Head>
      <form className="login-card" onSubmit={handleSubmit}>
        <img src="/img/logo-sekolah.svg" alt="" className="login-logo" />
        <h1>Masuk Admin</h1>
        <p className="login-sub">KB Bhineka Tunggal Ika</p>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
        />

        <label htmlFor="password">Kata sandi</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>
    </div>
  );
}