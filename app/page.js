'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Link2, Copy, Check, ExternalLink, AlertTriangle, ArrowRight,
  BarChart3, LogOut, Clock, Home as HomeIcon, Zap, Shield, Activity, Mail, PenTool, HelpCircle
} from 'lucide-react';
import styles from './page.module.css';
import TextType from './components/TextType';
import LightRays from './components/LightRays';

export default function Home() {
  const router = useRouter();
  const featuresRef = useRef(null);
  const topRef = useRef(null);

  // Core shorten states
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [envWarning, setEnvWarning] = useState(false);
  const [mounted, setMounted] = useState(false);

  // User & Auth states
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);

  // Load user profile & links
  const fetchUserSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setUser(data.user);
        setLinks(data.links || []);
      } else {
        setUser(null);
        setLinks([]);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchUserSession();
    checkEnvStatus();

    // Check for error params in query string
    const searchParams = new URLSearchParams(window.location.search);
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setError(oauthError);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkEnvStatus = async () => {
    try {
      const res = await fetch('/api/shorten', { method: 'GET' });
      if (res.status === 503) {
        setEnvWarning(true);
      }
    } catch (err) {
      // Ignore
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setResult('');
    setCopied(false);

    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, alias: alias || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN || (mounted ? window.location.host : 'tiny.to');
      const shortUrl = `${shortDomain}/${data.shortCode}`;

      setUrl('');
      setAlias('');
      setResult(shortUrl);

      // Refresh list
      fetchUserSession();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      const textToCopy = text.startsWith('http') ? text : `https://${text}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setLinks([]);
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  return (
    <div ref={topRef} className={styles.container} style={{ position: 'relative' }}>
      <LightRays
        raysOrigin="top-center"
        raysColor="#22c55e"
        raysSpeed={0.8}
        lightSpread={0.6}
        rayLength={1.4}
        followMouse={true}
        mouseInfluence={0.08}
        noiseAmount={0.05}
        distortion={0.02}
        fadeDistance={1.2}
        saturation={0.7}
      />
      {envWarning && (
        <div className={styles.warningBanner}>
          <AlertTriangle size={16} />
          <span>
            <strong>Database configuration missing:</strong> Upstash Redis credentials are required. Fill in your <code>.env.local</code> file to run the shortening service.
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className={styles.nav}>
        <a href="/" className={styles.navBrand}>
          <img src="/logo.svg" alt="tiny.to Logo" className={styles.navLogo} />
          tiny<span className={styles.navBrandDot}>.</span>to
        </a>
        <div className={styles.navLinks}>
          <a className={styles.navLink} onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}>Features</a>
          {user ? (
            <>
              <button onClick={() => router.push('/dashboard')} className={styles.signInBtn}>
                Dashboard
              </button>
              <button onClick={handleSignOut} className={styles.signOutBtn} aria-label="Sign out">
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <button onClick={() => router.push('/login')} className={styles.signInBtn}>
              Log In
            </button>
          )}
        </div>
      </nav>

      {/* Main hero & inputs */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <TextType
            text={["tiny.to", "shorten links", "track clicks"]}
            typingSpeed={75}
            pauseDuration={[4000, 1500, 1500]}
            showCursor={true}
            cursorCharacter="|"
            cursorClassName={styles.logoDot}
            className={styles.logo}
            as="h1"
          />
          <p className={styles.tagline}>Ultra-minimalist, privacy-friendly, edge-fast URL shortening.</p>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrapper}>
            <Link2 className={styles.inputIcon} size={18} />
            <input
              type="url"
              placeholder="Paste your long link here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className={styles.input}
              disabled={loading}
              autoComplete="off"
              aria-label="URL to shorten"
            />
            <button type="submit" className={styles.button} disabled={loading || !url} aria-label="Shorten URL">
              <ArrowRight size={16} />
            </button>
          </div>

          <div className={styles.optionsRow}>
            <div className={styles.aliasInputWrapper}>
              <span className={styles.aliasPrefix}>
                {(mounted ? window.location.host : 'tiny.to') + '/'}
              </span>
              <input
                type="text"
                placeholder="custom-alias"
                value={alias}
                onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                className={styles.aliasInput}
                disabled={loading}
                maxLength={30}
              />
            </div>
            {!user ? (
              <span className={styles.infoNote}>
                💡 <button type="button" onClick={() => router.push('/signup')} className={styles.infoLink}>Sign-up</button> to track clicks and secure your links.
              </span>
            ) : (
              <span className={styles.infoNote}>
                Logged in as <strong>{user.email}</strong>.
              </span>
            )}
          </div>
        </form>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {result && (
          <div className={styles.resultCard}>
            <div className={styles.resultLabel}>Shortened Link</div>
            <div className={styles.resultRow}>
              <span className={styles.resultUrl}>{result}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(result)}
                className={`${styles.copyButton} ${copied ? styles.copySuccess : ''}`}
                aria-label="Copy link"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        {/* History Section */}
        <div className={styles.historySection}>
          <div className={styles.historyHeader}>
            <h2 className={styles.historyTitle}>
              {user ? 'Your Links' : 'Recent Links (Sign in to save)'}
            </h2>
            <div className={styles.historyDivider}></div>
          </div>

          {links.length > 0 ? (
            <div className={styles.historyList}>
              {links.map((item, idx) => {
                const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN || (mounted ? window.location.host : 'tiny.to');
                const shortUrl = `${shortDomain}/${item.shortCode}`;
                const localUrl = mounted ? `${window.location.origin}/${item.shortCode}` : shortUrl;

                return (
                  <div key={idx} className={styles.historyItem}>
                    <div className={styles.historyUrls}>
                      <div className={styles.historyShort}>
                        <span>{shortUrl}</span>
                        <span className={styles.clicksLabel}>{item.clicks} clicks</span>
                      </div>
                      <span className={styles.historyOriginal} title={item.original}>{item.original}</span>
                    </div>
                    <div className={styles.historyActions}>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(shortUrl)}
                        className={styles.miniCopy}
                        aria-label="Copy short link"
                      >
                        <Copy size={14} />
                      </button>
                      <a
                        href={localUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.miniLink}
                        aria-label="Open short link"
                      >
                        <ExternalLink size={14} />
                      </a>
                      {user && (
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard?code=${item.shortCode}`)}
                          className={styles.miniAnalytics}
                        >
                          <BarChart3 size={14} />
                          <span>Stats</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyHistory}>
              <Clock size={32} className={styles.emptyIcon} />
              <span className={styles.emptyText}>
                {user ? "You haven't shortened any links yet." : "Links you shorten while logged in will show here."}
              </span>
            </div>
          )}
        </div>

        {/* Features Section */}
        <section ref={featuresRef} className={styles.featuresSection}>
          <div className={styles.featuresHeader}>
            <span className={styles.featuresSubtitle}>Platform Features</span>
            <h2 className={styles.featuresTitle}>Built for speed, built for privacy.</h2>
          </div>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Zap size={20} />
              </div>
              <div className={styles.featureInfo}>
                <h3 className={styles.featureName}>Edge-Fast Redirections</h3>
                <p className={styles.featureDesc}>Powered by Next.js middleware and Upstash Redis for global sub-millisecond redirect performance.</p>
              </div>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Activity size={20} />
              </div>
              <div className={styles.featureInfo}>
                <h3 className={styles.featureName}>Detailed Click Telemetry</h3>
                <p className={styles.featureDesc}>Get instant insights on where your traffic comes from, including country, browser, OS, and referrers.</p>
              </div>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <PenTool size={20} />
              </div>
              <div className={styles.featureInfo}>
                <h3 className={styles.featureName}>Custom Slugs & Aliases</h3>
                <p className={styles.featureDesc}>Create readable, search-friendly link aliases. Secure custom branding for every redirect.</p>
              </div>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Shield size={20} />
              </div>
              <div className={styles.featureInfo}>
                <h3 className={styles.featureName}>Privacy-First Design</h3>
                <p className={styles.featureDesc}>Strict adherence to data privacy with hashed IP addresses. GDPR-compliant visitor analytics.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>Free. Open Source. With Link Analytics.</span>
      </footer>

    </div>
  );
}
