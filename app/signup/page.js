'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import styles from '../page.module.css';
import LightRays from '../components/LightRays';
import GoogleIcon from '../components/GoogleIcon';

export default function Signup() {
  const router = useRouter();

  // Signup states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailAnalytics, setEmailAnalytics] = useState(false);

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

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: name || undefined,
          emailAnalyticsEnabled: emailAnalytics
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
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
        <div className={styles.modalHeader}>
          <h1 className={styles.modalTitle}>Join platform.</h1>
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

        <form onSubmit={handleSignup} className={styles.authForm}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Display Name*</label>
            <div className={styles.inputFieldWrapper}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={styles.formInput}
                style={{ paddingLeft: '14px' }}
                placeholder="Your Name"
              />
            </div>
          </div>

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
            <label className={styles.fieldLabel}>Password</label>
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
            {loading ? 'Please wait...' : 'Create Account'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className={styles.toggleAuthMode}>
          Already have an account?{' '}
          <span className={styles.toggleAuthLink} onClick={() => router.push('/login')}>
            Log In
          </span>
        </div>

        <div className={styles.badgePill}>
          <span style={{ fontSize: '12px', fontWeight: '600' }}>🔒 Clinical security verified</span>
        </div>
      </div>
    </div>
  );
}
