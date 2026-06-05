'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Link2, Copy, Check, ExternalLink, AlertTriangle, ArrowRight, Trash2,
  User, Shield, BarChart3, LogOut, RefreshCw, ChevronRight, Home, Settings
} from 'lucide-react';
import styles from './page.module.css';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  // Auth & Session state
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected link analytics state
  const [selectedCode, setSelectedCode] = useState(initialCode);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  // Settings states
  const [showSettings, setShowSettings] = useState(false);

  const fetchUserSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setUser(data.user);
        setLinks(data.links || []);
        
        // Auto-select first link if no code in URL
        if (!initialCode && data.links && data.links.length > 0) {
          setSelectedCode(data.links[0].shortCode);
        }
      } else {
        router.push('/?showLogin=true');
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSession();
  }, []);

  // Fetch analytics when selectedCode changes
  useEffect(() => {
    if (selectedCode) {
      fetchAnalytics(selectedCode);
      // Update query param without reloading
      const url = new URL(window.location);
      url.searchParams.set('code', selectedCode);
      window.history.replaceState({}, '', url);
    } else {
      setAnalyticsData(null);
    }
  }, [selectedCode]);

  const fetchAnalytics = async (code) => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/analytics/${code}`);
      const data = await res.json();
      if (res.ok) {
        setAnalyticsData(data);
      } else {
        console.error('Failed to fetch analytics:', data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err) {
      console.error('Failed to sign out:', err);
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

  const copyToClipboard = async (code, text) => {
    try {
      const textToCopy = text.startsWith('http') ? text : `https://${text}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Render SVG Click graph
  const renderClickTrendGraph = () => {
    if (!analyticsData || !analyticsData.analytics) return null;
    const logs = analyticsData.analytics;

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

    const width = 500;
    const height = 180;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 25;

    const points = chartData.map((d, idx) => {
      const x = paddingLeft + (idx / (chartData.length - 1)) * (width - paddingLeft - paddingRight);
      const y = height - paddingBottom - ((d.count / maxCount) * (height - paddingTop - paddingBottom));
      return { x, y, date: d.date, count: d.count };
    });

    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = points.length ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z` : '';

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="dashGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.14 145)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="oklch(0.78 0.14 145)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
        <line x1={paddingLeft} y1={(height - paddingBottom + paddingTop) / 2} x2={width - paddingRight} y2={(height - paddingBottom + paddingTop) / 2} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="var(--border)" strokeWidth="1" />
        
        {areaPath && <path d={areaPath} fill="url(#dashGradient)" />}
        {linePath && <path d={linePath} fill="none" stroke="oklch(0.78 0.14 145)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="4" fill="var(--bg)" stroke="oklch(0.78 0.14 145)" strokeWidth="2" />
            <text x={p.x} y={height - 8} fontSize="9" fill="var(--text-muted)" textAnchor="middle">{p.date}</text>
            <text x={p.x} y={p.y - 10} fontSize="10" fontWeight="600" fill="var(--text)" textAnchor="middle">{p.count}</text>
          </g>
        ))}
      </svg>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <RefreshCw size={36} className={styles.spin} />
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  // Group metrics for Selected Link
  const logs = analyticsData?.analytics || [];
  const devices = { Desktop: 0, Mobile: 0, Tablet: 0 };
  const referrers = {};
  const countries = {};

  logs.forEach(log => {
    if (devices[log.device] !== undefined) devices[log.device]++;
    referrers[log.referer] = (referrers[log.referer] || 0) + 1;
    countries[log.country] = (countries[log.country] || 0) + 1;
  });

  const totalClicks = logs.length || 1;
  const topReferrers = Object.entries(referrers).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const topCountries = Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className={styles.container}>
      <header className={styles.nav}>
        <a href="/" className={styles.navBrand}>tiny<span className={styles.navBrandSpan}>-</span>to</a>
        <div className={styles.navActions}>
          <button onClick={() => router.push('/')} className={styles.iconBtn}>
            <Home size={16} /> Home
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className={`${styles.iconBtn} ${showSettings ? styles.activeBtn : ''}`}>
            <Settings size={16} /> Account
          </button>
          <button onClick={handleSignOut} className={styles.signOutBtn}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      {showSettings && user && (
        <div className={styles.settingsSection}>
          <h3 className={styles.settingsTitle}>
            <User size={18} className={styles.logoDot} />
            Mailing Settings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
      )}

      <div className={styles.dashboardLayout}>
        {/* Sidebar: Links list */}
        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Your Links ({links.length})</h2>
          {links.length > 0 ? (
            <div className={styles.linksList}>
              {links.map((item) => {
                const isSelected = item.shortCode === selectedCode;
                const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN || 'tiny-to.vercel.app';
                const shortUrl = `${shortDomain}/${item.shortCode}`;

                return (
                  <div 
                    key={item.shortCode} 
                    onClick={() => setSelectedCode(item.shortCode)}
                    className={`${styles.linkCard} ${isSelected ? styles.selectedLinkCard : ''}`}
                  >
                    <div style={{ minWidth: 0, flexGrow: 1 }}>
                      <div className={styles.linkHeader}>
                        <span className={styles.shortLinkName}>/{item.shortCode}</span>
                        <span className={styles.clickBadge}>{item.clicks} clicks</span>
                      </div>
                      <p className={styles.originalLinkUrl} title={item.original}>{item.original}</p>
                    </div>
                    <ChevronRight size={16} className={styles.chevronIcon} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptySidebar}>
              <p>No links created yet.</p>
              <button onClick={() => router.push('/')} className={styles.createLinkBtn}>
                Create one now
              </button>
            </div>
          )}
        </aside>

        {/* Main Panel: Analytics details */}
        <main className={styles.mainPanel}>
          {selectedCode && analyticsData ? (
            <div className={styles.analyticsWrapper}>
              <div className={styles.analyticsHeader}>
                <div>
                  <h1 className={styles.analyticsTitle}>Analytics for /{selectedCode}</h1>
                  <a 
                    href={typeof window !== 'undefined' ? `${window.location.origin}/${selectedCode}` : '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.shortLinkUrlText}
                  >
                    {process.env.NEXT_PUBLIC_SHORT_DOMAIN || 'tiny-to.vercel.app'}/{selectedCode}
                    <ExternalLink size={12} style={{ marginLeft: '4px' }} />
                  </a>
                </div>
                <button 
                  onClick={() => copyToClipboard(selectedCode, `${process.env.NEXT_PUBLIC_SHORT_DOMAIN || 'tiny-to.vercel.app'}/${selectedCode}`)}
                  className={`${styles.copyBtn} ${copiedCode === selectedCode ? styles.copySuccess : ''}`}
                >
                  {copiedCode === selectedCode ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCode === selectedCode ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>

              {analyticsLoading ? (
                <div className={styles.analyticsLoadingContainer}>
                  <RefreshCw size={28} className={styles.spin} />
                  <p>Loading analytics telemetry...</p>
                </div>
              ) : (
                <>
                  {/* KPI Stats cards */}
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <span className={styles.statVal}>{analyticsData.clicks}</span>
                      <span className={styles.statLabel}>Total Redirects</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statVal}>{Object.keys(countries).length}</span>
                      <span className={styles.statLabel}>Total Countries</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statVal}>{Math.round((devices.Mobile / totalClicks) * 100) || 0}%</span>
                      <span className={styles.statLabel}>Mobile Traffic</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statVal}>{topReferrers[0] ? topReferrers[0][0] : 'Direct'}</span>
                      <span className={styles.statLabel}>Top Referrer</span>
                    </div>
                  </div>

                  <div className={styles.chartsGrid}>
                    {/* SVG Line Graph */}
                    <div className={styles.chartCard}>
                      <h3 className={styles.chartTitle}>Redirect Trend (Last 7 Days)</h3>
                      <div className={styles.svgContainer}>
                        {renderClickTrendGraph()}
                      </div>
                    </div>

                    {/* Devices Breakdown */}
                    <div className={styles.chartCard}>
                      <h3 className={styles.chartTitle}>Device Profile</h3>
                      <div className={styles.progressContainer}>
                        {[
                          { name: 'Desktop', val: devices.Desktop, color: 'oklch(0.78 0.14 145)' },
                          { name: 'Mobile', val: devices.Mobile, color: 'oklch(0.78 0.14 145)' },
                          { name: 'Tablet', val: devices.Tablet, color: 'oklch(0.65 0.01 240)' }
                        ].map((d, idx) => {
                          const pct = Math.round((d.val / totalClicks) * 100) || 0;
                          return (
                            <div key={idx} className={styles.progressItem}>
                              <div className={styles.progressHeader}>
                                <span>{d.name}</span>
                                <strong>{pct}% ({d.val})</strong>
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

                  {/* Countries & Referrers Grid */}
                  <div className={styles.telemetryGrid}>
                    <div className={styles.chartCard}>
                      <h3 className={styles.chartTitle}>Top Referrers</h3>
                      <div className={styles.progressList}>
                        {topReferrers.length > 0 ? topReferrers.map(([ref, count], idx) => {
                          const pct = Math.round((count / totalClicks) * 100) || 0;
                          return (
                            <div key={idx} className={styles.progressItem}>
                              <div className={styles.progressHeader}>
                                <span>{ref}</span>
                                <strong>{pct}% ({count})</strong>
                              </div>
                              <div className={styles.progressBarTrack}>
                                <div className={styles.progressBarFill} style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          );
                        }) : (
                          <div className={styles.emptyDataText}>No referrers logged.</div>
                        )}
                      </div>
                    </div>

                    <div className={styles.chartCard}>
                      <h3 className={styles.chartTitle}>Top Geographies</h3>
                      <div className={styles.progressList}>
                        {topCountries.length > 0 ? topCountries.map(([code, count], idx) => {
                          const pct = Math.round((count / totalClicks) * 100) || 0;
                          return (
                            <div key={idx} className={styles.progressItem}>
                              <div className={styles.progressHeader}>
                                <span>{code}</span>
                                <strong>{pct}% ({count})</strong>
                              </div>
                              <div className={styles.progressBarTrack}>
                                <div className={styles.progressBarFill} style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          );
                        }) : (
                          <div className={styles.emptyDataText}>No geography data logged.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Raw Clicks List */}
                  <div>
                    <h3 className={styles.logsTitle}>Recent Events Log</h3>
                    <div className={styles.logList}>
                      <div className={`${styles.logRow} ${styles.logHeader}`}>
                        <div>Timestamp</div>
                        <div>User Agent / System</div>
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
                        <div className={styles.emptyDataText} style={{ padding: '2rem', textAlign: 'center' }}>
                          No click redirects logged yet.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={styles.emptyPanel}>
              <BarChart3 size={48} className={styles.emptyPanelIcon} />
              <h3>Select a Link</h3>
              <p>Choose a link from the sidebar to display its click statistics and redirection telemetry.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className={styles.loadingScreen}>
        <RefreshCw size={36} className={styles.spin} />
        <p>Loading Dashboard...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
