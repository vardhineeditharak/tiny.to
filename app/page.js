'use client';

import { useState, useEffect } from 'react';
import { Link2, Copy, Check, ExternalLink, AlertTriangle, ArrowRight } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [envWarning, setEnvWarning] = useState(false);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('shortener_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }

    // Check if env vars are present (we can fetch a dummy status or check env via a small call)
    // For simplicity, if the API returns a 503 or warning, we set warning
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
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN || 'tiny.to';
      const shortUrl = `${shortDomain}/${data.shortCode}`;
      const localShortUrl = `${window.location.origin}/${data.shortCode}`;

      // Save to local history
      const newEntry = {
        original: url,
        shortCode: data.shortCode,
        shortUrl,
        localUrl: localShortUrl,
        date: new Date().toLocaleDateString(),
      };
      const updatedHistory = [newEntry, ...history.filter(item => item.original !== url)].slice(0, 5);
      setHistory(updatedHistory);
      localStorage.setItem('shortener_history', JSON.stringify(updatedHistory));
      setUrl('');
      setResult(shortUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      // Prepend https:// to copy complete link
      const textToCopy = text.startsWith('http') ? text : `https://${text}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
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

      <header className={styles.header}>
        <h1 className={styles.logo}>tiny<span className={styles.logoDot}>.</span>to</h1>
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
          <h2 className={styles.historyTitle}>Recent Links</h2>
          {history.length > 0 ? (
            <div className={styles.historyList}>
              {history.map((item, idx) => (
                <div key={idx} className={styles.historyItem}>
                  <div className={styles.historyUrls}>
                    <span className={styles.historyShort}>{item.shortUrl}</span>
                    <span className={styles.historyOriginal} title={item.original}>{item.original}</span>
                  </div>
                  <div className={styles.historyActions}>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.shortUrl)}
                      className={styles.miniCopy}
                      aria-label="Copy short link"
                    >
                      <Copy size={14} />
                    </button>
                    <a
                      href={item.localUrl || item.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.miniLink}
                      aria-label="Open short link"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyHistory}>
              <span>Your shortened links will appear here.</span>
            </div>
          )}
        </div>
      </div>

      <footer className={styles.footer}>
        <span>Free. Open Source. No tracking.</span>
      </footer>
    </div>
  );
}
