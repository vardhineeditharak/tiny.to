'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import styles from '../page.module.css';
import LightRays from '../components/LightRays';
import GoogleIcon from '../components/GoogleIcon';

export default function Login() {
  const router = useRouter();

  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Recovery views: 'login' | 'forgot' | 'reset'
  const [view, setView] = useState('login');
  const [recoveryToken, setRecoveryToken] = useState('');

  // Check session & URL recovery tokens
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tok = params.get('token');
    if (tok) {
      setRecoveryToken(tok);
      setView('reset');
    }

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

  const handleRequestRecovery = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request recovery.');
      }

      setSuccessMessage('If this email is registered, recovery instructions have been sent.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', token: recoveryToken, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setSuccessMessage('Password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.replace('/login');
        setView('login');
        setPassword('');
        setConfirmPassword('');
        setSuccessMessage('');
      }, 2500);
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
        lightSpread={1.2}
        rayLength={2.5}
        followMouse={true}
        mouseInfluence={0.06}
        noiseAmount={0.04}
        distortion={0.02}
        fadeDistance={2.2}
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
        {view === 'login' && (
          <>
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
                <GoogleIcon />
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
                    onClick={() => setView('forgot')}
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
              {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

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
          </>
        )}

        {view === 'forgot' && (
          <>
            <div className={styles.modalHeader}>
              <h1 className={styles.modalTitle}>Recover.</h1>
              <p className={styles.modalSubtitle}>Enter your registered email to request a reset link.</p>
            </div>

            <form onSubmit={handleRequestRecovery} className={styles.authForm}>
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

              {error && <div className={styles.errorMessage}>{error}</div>}
              {successMessage && <div className={styles.successMessage} style={{ color: 'var(--primary)', fontSize: '13px' }}>{successMessage}</div>}



              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Sending...' : 'Send Recovery Email'}
                <ArrowRight size={16} />
              </button>
            </form>

            <div className={styles.toggleAuthMode}>
              Remembered your password?{' '}
              <span className={styles.toggleAuthLink} onClick={() => { setView('login'); setError(''); setSuccessMessage(''); }}>
                Log In
              </span>
            </div>
          </>
        )}

        {view === 'reset' && (
          <>
            <div className={styles.modalHeader}>
              <h1 className={styles.modalTitle}>Reset.</h1>
              <p className={styles.modalSubtitle}>Choose a new secure password for your account.</p>
            </div>

            <form onSubmit={handleResetPassword} className={styles.authForm}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>New Password</label>
                <div className={styles.inputFieldWrapper}>
                  <Lock className={styles.fieldIcon} size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={styles.formInput}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Confirm New Password</label>
                <div className={styles.inputFieldWrapper}>
                  <Lock className={styles.fieldIcon} size={16} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={styles.formInput}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && <div className={styles.errorMessage}>{error}</div>}
              {successMessage && <div className={styles.successMessage} style={{ color: 'var(--primary)', fontSize: '13px' }}>{successMessage}</div>}

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Saving...' : 'Save New Password'}
                <ArrowRight size={16} />
              </button>
            </form>

            <div className={styles.toggleAuthMode}>
              Need to go back?{' '}
              <span className={styles.toggleAuthLink} onClick={() => { setView('login'); router.replace('/login'); setError(''); setSuccessMessage(''); }}>
                Cancel
              </span>
            </div>
          </>
        )}

        <div className={styles.badgePill}>
          <span style={{ fontSize: '12px', fontWeight: '600' }}>🔒 Clinical security verified</span>
        </div>
      </div>
    </div>
  );
}
