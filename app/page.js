'use client';

import { useState, useEffect } from 'react';
import { 
  Link2, Copy, Check, ExternalLink, AlertTriangle, ArrowRight, Trash2,
  Lock, User, Shield, BarChart3, LogOut, CheckCircle2, CreditCard, RefreshCw 
} from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  // Core shorten states
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [envWarning, setEnvWarning] = useState(false);

  // User & Auth states
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' or 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authEmailAnalytics, setAuthEmailAnalytics] = useState(true);
  const [googleAuthModalOpen, setGoogleAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Checkout states
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Analytics states
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsCode, setAnalyticsCode] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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
    fetchUserSession();
    checkEnvStatus();
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

      const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN || 'tiny-to.vercel.app';
      const shortUrl = `${shortDomain}/${data.shortCode}`;

      setUrl('');
      setAlias('');
      setResult(shortUrl);

      // Refresh list if logged in
      if (user) {
        fetchUserSession();
      }
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

  // Auth actions
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const url = `/api/auth/${authTab}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: authEmail, 
          password: authPassword,
          name: authTab === 'signup' ? authName : undefined,
          phone: authTab === 'signup' ? authPhone : undefined,
          emailAnalyticsEnabled: authTab === 'signup' ? authEmailAnalytics : undefined
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setUser(data.user);
      setAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      setAuthPhone('');
      fetchUserSession();
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async (email, name) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          provider: 'google',
          emailAnalyticsEnabled: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google Authentication failed');
      }

      setUser(data.user);
      setGoogleAuthModalOpen(false);
      setAuthModalOpen(false);
      fetchUserSession();
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUpdateSettings = async (updates) => {
    try {
      const res = await fetch('/api/auth/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
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

  // Simulated upgrade payment
  const handleUpgrade = async (e) => {
    e.preventDefault();
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      setCheckoutSuccess(true);
      setUser(data.user);
      setTimeout(() => {
        setCheckoutOpen(false);
        setCheckoutSuccess(false);
        // Refresh analytics if currently open
        if (analyticsOpen) {
          viewAnalytics(analyticsCode);
        }
      }, 1500);
    } catch (err) {
      alert(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // View Analytics
  const viewAnalytics = async (code) => {
    setAnalyticsCode(code);
    setAnalyticsOpen(true);
    setAnalyticsLoading(true);
    setAnalyticsData(null);

    try {
      const res = await fetch(`/api/analytics/${code}`);
      const data = await res.json();
      if (res.ok) {
        setAnalyticsData(data);
      } else {
        console.error('Failed to load analytics:', data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Compute SVG chart point paths & stats
  const renderAnalyticsDashboard = () => {
    if (!analyticsData || !analyticsData.isPremium) return null;

    const logs = analyticsData.analytics || [];
    
    // Group clicks by past 7 days
    const days = 7;
    const clicksByDate = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      clicksByDate[dateStr] = 0;
    }

    logs.forEach(log => {
      const dateStr = new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (clicksByDate[dateStr] !== undefined) {
        clicksByDate[dateStr]++;
      }
    });

    const chartData = Object.entries(clicksByDate).map(([date, count]) => ({ date, count }));
    const maxCount = Math.max(...chartData.map(d => d.count), 5);

    // SVG coordinate layout
    const width = 450;
    const height = 150;
    const paddingLeft = 30;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 20;

    const points = chartData.map((d, idx) => {
      const x = paddingLeft + (idx / (chartData.length - 1)) * (width - paddingLeft - paddingRight);
      const y = height - paddingBottom - ((d.count / maxCount) * (height - paddingTop - paddingBottom));
      return { x, y, date: d.date, count: d.count };
    });

    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = points.length ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z` : '';

    // Device breakdown
    const devices = { Desktop: 0, Mobile: 0, Tablet: 0 };
    const referrers = {};
    const countries = {};

    logs.forEach(log => {
      if (devices[log.device] !== undefined) devices[log.device]++;
      referrers[log.referer] = (referrers[log.referer] || 0) + 1;
      countries[log.country] = (countries[log.country] || 0) + 1;
    });

    const totalLogs = logs.length || 1;

    const topReferrers = Object.entries(referrers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const topCountries = Object.entries(countries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return (
      <div>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statVal}>{analyticsData.clicks}</div>
            <div className={styles.statLabel}>Total Clicks</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal}>
              {Object.keys(countries).length}
            </div>
            <div className={styles.statLabel}>Countries</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal}>
              {Math.round((devices.Mobile / totalLogs) * 100)}%
            </div>
            <div className={styles.statLabel}>Mobile Traffic</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal}>
              {topReferrers[0] ? topReferrers[0][0] : 'Direct'}
            </div>
            <div className={styles.statLabel}>Top Referrer</div>
          </div>
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Click Trend (Last 7 Days)</h3>
            <div style={{ position: 'relative', width: '100%' }}>
              <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.14 145)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="oklch(0.78 0.14 145)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid Lines */}
                <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1={paddingLeft} y1={(height - paddingBottom + paddingTop) / 2} x2={width - paddingRight} y2={(height - paddingBottom + paddingTop) / 2} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="var(--border)" strokeWidth="1" />
                
                {/* Area under the line */}
                {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}
                
                {/* Main line */}
                {linePath && <path d={linePath} fill="none" stroke="oklch(0.78 0.14 145)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                
                {/* Dots and Labels */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    <circle cx={p.x} cy={p.y} r="3.5" fill="var(--bg)" stroke="oklch(0.78 0.14 145)" strokeWidth="1.5" />
                    <text x={p.x} y={height - 5} fontSize="8" fill="var(--text-muted)" textAnchor="middle">{p.date}</text>
                    <text x={p.x} y={p.y - 8} fontSize="9" fontWeight="500" fill="var(--text)" textAnchor="middle">{p.count}</text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Device Distribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', height: '100%' }}>
              {[
                { name: 'Desktop', val: devices.Desktop, color: 'oklch(0.78 0.14 145)' },
                { name: 'Mobile', val: devices.Mobile, color: 'oklch(0.78 0.14 145)' },
                { name: 'Tablet', val: devices.Tablet, color: 'oklch(0.65 0.01 240)' }
              ].map((d, i) => {
                const pct = Math.round((d.val / totalLogs) * 100) || 0;
                return (
                  <div key={i} className={styles.progressItem}>
                    <div className={styles.progressHeader}>
                      <span className={styles.progressName}>{d.name}</span>
                      <span className={styles.progressValue}>{pct}% ({d.val})</span>
                    </div>
                    <div className={styles.progressBarTrack}>
                      <div className={styles.progressBarFill} style={{ width: `${pct}%`, backgroundColor: d.color }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.telemetryGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Top Referrers</h3>
            <div className={styles.progressList}>
              {topReferrers.length > 0 ? topReferrers.map(([ref, count], idx) => {
                const pct = Math.round((count / totalLogs) * 100);
                return (
                  <div key={idx} className={styles.progressItem}>
                    <div className={styles.progressHeader}>
                      <span className={styles.progressName}>{ref}</span>
                      <span className={styles.progressValue}>{pct}% ({count})</span>
                    </div>
                    <div className={styles.progressBarTrack}>
                      <div className={styles.progressBarFill} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No referrer data available</div>
              )}
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Top Countries</h3>
            <div className={styles.progressList}>
              {topCountries.length > 0 ? topCountries.map(([code, count], idx) => {
                const pct = Math.round((count / totalLogs) * 100);
                return (
                  <div key={idx} className={styles.progressItem}>
                    <div className={styles.progressHeader}>
                      <span className={styles.progressName}>{code}</span>
                      <span className={styles.progressValue}>{pct}% ({count})</span>
                    </div>
                    <div className={styles.progressBarTrack}>
                      <div className={styles.progressBarFill} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No country data available</div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className={styles.logsTitle}>Recent Redirections Log</h3>
          <div className={styles.logList}>
            <div className={`${styles.logRow} ${styles.logHeader}`}>
              <div>Timestamp</div>
              <div>Device</div>
              <div>Referrer</div>
              <div>Country</div>
            </div>
            {logs.length > 0 ? logs.map((log, idx) => (
              <div key={idx} className={styles.logRow}>
                <div className={styles.logTime} title={new Date(log.timestamp).toLocaleString()}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className={styles.logDevice}>{log.browser} / {log.os}</div>
                <div className={styles.logReferer} title={log.referer}>{log.referer}</div>
                <div className={styles.logCountry}>{log.country}</div>
              </div>
            )) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No clicks registered yet.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {envWarning && (
        <div className={styles.warningBanner}>
          <AlertTriangle size={16} />
          <span>
            <strong>Database configuration missing:</strong> Please copy <code>.env.example</code> to <code>.env.local</code> and fill in your Upstash Redis credentials to activate the shortener backend.
          </span>
        </div>
      )}

      <nav className={styles.nav}>
        <a href="/" className={styles.navBrand}>tiny<span className={styles.navBrandSpan}>-</span>to</a>
        <div className={styles.navUserSection}>
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={styles.userEmail}>{user.email}</span>
                {user.isPremium ? (
                  <span className={styles.premiumBadge}>Premium</span>
                ) : (
                  <button 
                    onClick={() => setCheckoutOpen(true)}
                    className={styles.upgradeBadgeBtn}
                  >
                    Go Premium
                  </button>
                )}
              </div>
              <button onClick={handleSignOut} className={styles.signOutBtn}>
                <LogOut size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Sign Out
              </button>
            </>
          ) : (
            <button onClick={() => { setAuthTab('login'); setAuthModalOpen(true); }} className={styles.navBtn}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      <header className={styles.header}>
        <h1 className={styles.logo}>tiny<span className={styles.logoDot}>-</span>to</h1>
        <p className={styles.tagline}>Ultra-minimalist, privacy-friendly, edge-fast URL shortening.</p>
      </header>

      <div className={styles.mainContent}>
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
            <button type="submit" className={styles.button} disabled={loading || !url}>
              {loading ? 'Shortening...' : 'Shorten'}
              <ArrowRight size={16} className={styles.buttonIcon} />
            </button>
          </div>

          <div className={styles.optionsRow}>
            <div className={styles.aliasInputWrapper}>
              <span className={styles.aliasPrefix}>
                {(typeof window !== 'undefined' ? window.location.host : 'tiny-to.vercel.app') + '/'}
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
            {!user && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                💡 <button type="button" onClick={() => { setAuthTab('signup'); setAuthModalOpen(true); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Sign up</button> to track clicks and secure your custom links.
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
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        <div className={styles.historySection}>
          <h2 className={styles.historyTitle}>{user ? 'Your Links' : 'Recent Links (Sign in to save)'}</h2>
          {links.length > 0 ? (
            <div className={styles.historyList}>
              {links.map((item, idx) => {
                const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN || 'tiny-to.vercel.app';
                const shortUrl = `${shortDomain}/${item.shortCode}`;
                const localUrl = typeof window !== 'undefined' ? `${window.location.origin}/${item.shortCode}` : shortUrl;

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
                          onClick={() => viewAnalytics(item.shortCode)}
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
              <span>{user ? 'You haven\'t shortened any links yet.' : 'Links you shorten while logged in will show here.'}</span>
            </div>
          )}
        </div>
        
        {user && (
          <div className={styles.settingsSection}>
            <h3 className={styles.settingsTitle}>
              <User size={18} className={styles.logoDot} />
              Account & Mailing Settings
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Full Name</label>
                  <input
                    type="text"
                    value={user.name || ''}
                    onChange={(e) => handleUpdateSettings({ name: e.target.value })}
                    className={styles.formInput}
                    placeholder="Enter your name"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Phone Number</label>
                  <input
                    type="tel"
                    value={user.phone || ''}
                    onChange={(e) => handleUpdateSettings({ phone: e.target.value })}
                    className={styles.formInput}
                    placeholder="Enter your phone"
                  />
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={!!user.emailAnalyticsEnabled}
                    onChange={(e) => handleUpdateSettings({ emailAnalyticsEnabled: e.target.checked })}
                    className={styles.checkboxInput}
                  />
                  <span>
                    <strong>Email weekly reports:</strong> Send a summary of click analytics to <strong>{user.email}</strong> every Monday.
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <span>Free. Open Source. With Premium Link Analytics.</span>
      </footer>

      {/* Authentication Modal */}
      {authModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setAuthModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{authTab === 'login' ? 'Sign In' : 'Create Account'}</h2>
              <button className={styles.modalCloseBtn} onClick={() => setAuthModalOpen(false)}>✕</button>
            </div>
            <div className={styles.tabHeader}>
              <button 
                className={`${styles.tabBtn} ${authTab === 'login' ? styles.activeTab : ''}`}
                onClick={() => setAuthTab('login')}
              >
                Sign In
              </button>
              <button 
                className={`${styles.tabBtn} ${authTab === 'signup' ? styles.activeTab : ''}`}
                onClick={() => setAuthTab('signup')}
              >
                Sign Up
              </button>
            </div>
            <div className={styles.modalBody}>
              <button 
                type="button" 
                onClick={() => setGoogleAuthModalOpen(true)}
                className={styles.googleBtn}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '8px' }}>
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.707c-.18-.54-.282-1.119-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.173 0 7.548 0 9s.347 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.32 0 2.505.454 3.44 1.347l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className={styles.divider}>or</div>

              <form onSubmit={handleAuthSubmit} className={styles.authForm}>
                {authTab === 'signup' && (
                  <>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Full Name</label>
                      <input 
                        type="text" 
                        value={authName} 
                        onChange={(e) => setAuthName(e.target.value)}
                        required
                        className={styles.formInput}
                        placeholder="Alex Johnson"
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Phone Number</label>
                      <input 
                        type="tel" 
                        value={authPhone} 
                        onChange={(e) => setAuthPhone(e.target.value)}
                        className={styles.formInput}
                        placeholder="+1 (555) 019-2834"
                      />
                    </div>
                  </>
                )}

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Email Address</label>
                  <input 
                    type="email" 
                    value={authEmail} 
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    className={styles.formInput}
                    placeholder="name@example.com"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Password</label>
                  <input 
                    type="password" 
                    value={authPassword} 
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    className={styles.formInput}
                    placeholder="••••••••"
                  />
                </div>

                {authTab === 'signup' && (
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={authEmailAnalytics}
                      onChange={(e) => setAuthEmailAnalytics(e.target.checked)}
                      className={styles.checkboxInput}
                    />
                    <span>Send me weekly analytics reports via email</span>
                  </label>
                )}

                {authError && <div className={styles.errorMessage} style={{ margin: 0 }}>{authError}</div>}
                
                <button type="submit" className={styles.submitBtn} disabled={authLoading}>
                  {authLoading ? 'Please wait...' : authTab === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Upgrade / Checkout Modal */}
      {checkoutOpen && (
        <div className={styles.modalOverlay} onClick={() => setCheckoutOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={20} className={styles.logoDot} />
                Upgrade to Premium
              </h2>
              <button className={styles.modalCloseBtn} onClick={() => setCheckoutOpen(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {checkoutSuccess ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', textAlign: 'center', gap: '1rem' }}>
                  <CheckCircle2 size={64} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 500 }}>Payment Successful!</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Welcome to Premium! Unlocking your Analytics dashboard now...</p>
                </div>
              ) : (
                <form onSubmit={handleUpgrade} className={styles.creditCardForm}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Get detailed click analytics, geo breakdown, device, and referrer insights for all your shortened links.
                  </p>
                  
                  <div className={styles.checkoutDetails}>
                    <div className={styles.checkoutRow}>
                      <span className={styles.checkoutLabel}>Premium Tier Plan</span>
                      <span className={styles.checkoutVal}>Lifetime Access</span>
                    </div>
                    <div className={`${styles.checkoutRow} ${styles.checkoutTotal}`}>
                      <span>Total Due</span>
                      <span>$5.00 USD</span>
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Card Details</label>
                    <div className={styles.cardInputWrapper}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <CreditCard size={18} className={styles.cardBrandIcon} />
                        <input 
                          type="text" 
                          value={cardNumber} 
                          onChange={(e) => setCardNumber(e.target.value)}
                          required
                          className={styles.input}
                          style={{ fontSize: '0.95rem', padding: 0 }}
                        />
                      </div>
                      <div className={styles.cardRow}>
                        <input 
                          type="text" 
                          value={cardExpiry} 
                          onChange={(e) => setCardExpiry(e.target.value)}
                          required
                          placeholder="MM/YY"
                          className={styles.input}
                          style={{ fontSize: '0.9rem', padding: 0 }}
                        />
                        <input 
                          type="password" 
                          value={cardCvv} 
                          onChange={(e) => setCardCvv(e.target.value)}
                          required
                          placeholder="CVV"
                          className={styles.input}
                          style={{ fontSize: '0.9rem', padding: 0 }}
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className={styles.submitBtn} disabled={checkoutLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {checkoutLoading ? (
                      <>
                        <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Processing payment...
                      </>
                    ) : (
                      'Pay $5.00'
                    )}
                  </button>

                  <div className={styles.paymentSecurityInfo}>
                    <span>🔒 Secured by Stripe Mock Checkout</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Dashboard Modal */}
      {analyticsOpen && (
        <div className={styles.modalOverlay} onClick={() => setAnalyticsOpen(false)}>
          <div className={`${styles.modal} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Link Analytics</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  /{analyticsCode}
                </span>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setAnalyticsOpen(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {analyticsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '1rem' }}>
                  <RefreshCw size={32} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--accent)' }} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Retrieving redirection telemetry...</span>
                </div>
              ) : analyticsData && !analyticsData.isPremium ? (
                <div className={styles.lockedContainer}>
                  <div className={styles.blurContent}>
                    <div className={styles.statsGrid}>
                      <div className={styles.statCard}>
                        <div className={styles.statVal}>42</div>
                        <div className={styles.statLabel}>Total Clicks</div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statVal}>8</div>
                        <div className={styles.statLabel}>Countries</div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statVal}>65%</div>
                        <div className={styles.statLabel}>Mobile Traffic</div>
                      </div>
                    </div>
                    <div style={{ height: '150px', background: 'var(--border)', borderRadius: '8px', marginBottom: '1rem' }}></div>
                  </div>

                  <div className={styles.lockOverlay}>
                    <div className={styles.lockIconContainer}>
                      <Lock size={28} />
                    </div>
                    <h3 className={styles.lockTitle}>Unlock Link Tracking & Analytics</h3>
                    <p className={styles.lockDesc}>
                      Upgrade to Premium to get real-time click tracking, device analytics, referrers, and country stats.
                    </p>
                    <button 
                      onClick={() => setCheckoutOpen(true)}
                      className={styles.unlockBtn}
                    >
                      Go Premium ($5.00)
                    </button>
                  </div>
                </div>
              ) : (
                renderAnalyticsDashboard()
              )}
            </div>
          </div>
        </div>
      )}
      {/* Google Mock OAuth Modal */}
      {googleAuthModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setGoogleAuthModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader} style={{ justifyContent: 'center', position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', marginTop: '1rem' }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 500, margin: 0 }}>Choose an account</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to continue to Briefly</span>
              </div>
              <button 
                className={styles.modalCloseBtn} 
                onClick={() => setGoogleAuthModalOpen(false)}
                style={{ position: 'absolute', right: '1.25rem', top: '1.25rem' }}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody} style={{ padding: '1rem 0' }}>
              <div 
                className={styles.googleUserCard}
                onClick={() => handleGoogleSignIn('alex.johnson@gmail.com', 'Alex Johnson')}
                style={{ margin: '0 1.5rem 0.75rem 1.5rem' }}
              >
                <div className={styles.googleAvatar}>AJ</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Alex Johnson</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>alex.johnson@gmail.com</span>
                </div>
              </div>
              <div 
                className={styles.googleUserCard}
                onClick={() => handleGoogleSignIn('sarah.data@gmail.com', 'Sarah Chen')}
                style={{ margin: '0 1.5rem 1rem 1.5rem' }}
              >
                <div className={styles.googleAvatar} style={{ backgroundColor: '#e91e63' }}>SC</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Sarah Chen</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>sarah.data@gmail.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
