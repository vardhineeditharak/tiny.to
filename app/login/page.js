'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn } from '@clerk/nextjs';
import { Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import styles from '../page.module.css';
import LightRays from '../components/LightRays';
import GoogleIcon from '../components/GoogleIcon';

export default function Login() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // views: 'login' | 'forgot' | 'reset'
  const [view, setView] = useState('login');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/dashboard');
      } else {
        console.log(result);
        setError('Login is incomplete. Please check your credentials.');
      }
    } catch (err) {
      setError(err.errors ? err.errors[0].message : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isLoaded) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRequestRecovery = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setView('reset');
      setSuccessMessage('If this email is registered, recovery instructions have been sent.');
    } catch (err) {
      setError(err.errors ? err.errors[0].message : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setSuccessMessage('Password has been reset successfully! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError('Verification is incomplete.');
      }
    } catch (err) {
      setError(err.errors ? err.errors[0].message : err.message);
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
              onClick={handleGoogleLogin}
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
              <p className={styles.modalSubtitle}>Choose a new secure password and enter the code sent to your email.</p>
            </div>

            <form onSubmit={handleResetPassword} className={styles.authForm}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Verification Code</label>
                <div className={styles.inputFieldWrapper}>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className={styles.formInput}
                    style={{ paddingLeft: '14px' }}
                    placeholder="123456"
                  />
                </div>
              </div>

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

              {error && <div className={styles.errorMessage}>{error}</div>}
              {successMessage && <div className={styles.successMessage} style={{ color: 'var(--primary)', fontSize: '13px' }}>{successMessage}</div>}

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Saving...' : 'Save New Password'}
                <ArrowRight size={16} />
              </button>
            </form>

            <div className={styles.toggleAuthMode}>
              Need to go back?{' '}
              <span className={styles.toggleAuthLink} onClick={() => { setView('login'); setError(''); setSuccessMessage(''); }}>
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
