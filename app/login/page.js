'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import styles from '../page.module.css';
import LightRays from '../components/LightRays';

export default function Login() {
  const router = useRouter();

  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (res.ok && data.authenticated) {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} style={{ position: 'relative', minHeight: '100vh', backgroundColor: '#000000' }}>
      <LightRays
        raysOrigin="top-center"
        raysColor="#22c55e"
        raysSpeed={0.6}
        lightSpread={0.5}
        rayLength={1.2}
        followMouse={true}
        mouseInfluence={0.06}
        noiseAmount={0.04}
        distortion={0.02}
        fadeDistance={1.0}
        saturation={0.5}
      />
      <div className={styles.modal} style={{ border: 'none', boxShadow: 'none' }}>
        <button
          className={styles.modalCloseBtn}
          onClick={() => router.push('/')}
          aria-label="Back to home"
        >
          ✕
        </button>
        <div className={styles.modalHeader}>
          <h1 className={styles.modalTitle}>Welcome back.</h1>
          <p className={styles.modalSubtitle}>Clinical efficiency for your digital presence.</p>
        </div>

        <button
          type="button"
          onClick={() => window.location.href = '/api/auth/google'}
          className={styles.googleBtn}
        >
          <span className={styles.socialIconBox}>
            <svg width="14" height="14" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#FFFFFF" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#FFFFFF" />
              <path d="M3.964 10.707c-.18-.54-.282-1.119-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.173 0 7.548 0 9s.347 2.827.957 4.039l3.007-2.332z" fill="#FFFFFF" />
              <path d="M9 3.58c1.32 0 2.505.454 3.44 1.347l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#FFFFFF" />
            </svg>
          </span>
          Continue with Google
        </button>

        <div className={styles.divider}>OR EMAIL</div>

        <form onSubmit={handleLogin} className={styles.authForm}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Email Address</label>
            <div className={styles.inputFieldWrapper}>
              <Mail className={styles.fieldIcon} size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.formInput}
                placeholder="dev@tiny.to"
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.fieldHeaderRow}>
              <label className={styles.fieldLabel}>Password</label>
              <button
                type="button"
                onClick={() => alert('Password recovery is not supported in this demo.')}
                className={styles.fieldAction}
              >
                Forgot?
              </button>
            </div>
            <div className={styles.inputFieldWrapper}>
              <Lock className={styles.fieldIcon} size={16} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.formInput}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeIconBtn}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Please wait...' : 'Log In'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className={styles.toggleAuthMode}>
          New to the platform?{' '}
          <span className={styles.toggleAuthLink} onClick={() => router.push('/signup')}>
            Create an account
          </span>
        </div>

        <div className={styles.badgePill}>
          <span style={{ fontSize: '12px', fontWeight: '600' }}>🔒 Clinical security verified</span>
        </div>
      </div>
    </div>
  );
}
