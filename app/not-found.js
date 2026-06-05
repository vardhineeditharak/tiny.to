import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Link not found</h1>
      <p style={textStyle}>The link you are trying to reach might have expired or never existed.</p>
      <Link href="/" style={linkStyle}>
        Go to tiny-to
      </Link>
    </div>
  );
}

const containerStyle = {
  backgroundColor: 'oklch(0.08 0.01 240)',
  color: 'oklch(0.97 0.005 240)',
  fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  margin: 0,
  textAlign: 'center',
  padding: '1.5rem',
};

const titleStyle = {
  fontSize: 'clamp(2rem, 5vw, 3rem)',
  fontWeight: '300',
  letterSpacing: '-0.04em',
  marginBottom: '0.5rem',
};

const textStyle = {
  color: 'oklch(0.60 0.01 240)',
  fontSize: '1rem',
  marginBottom: '2rem',
  fontWeight: '300',
};

const linkStyle = {
  color: 'oklch(0.78 0.14 145)',
  textDecoration: 'none',
  border: '1px solid oklch(0.18 0.01 240)',
  padding: '0.6rem 1.2rem',
  borderRadius: '6px',
  backgroundColor: 'oklch(0.12 0.01 240)',
  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
};
