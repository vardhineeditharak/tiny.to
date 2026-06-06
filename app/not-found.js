'use client';

import Link from 'next/link';
import LightRays from './components/LightRays';

export default function NotFound() {
  return (
    <div style={containerStyle}>
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
      <h1 style={titleStyle}>404<span style={dotStyle}>.</span></h1>
      <p style={subtitleStyle}>Link not found</p>
      <p style={textStyle}>The URL code is invalid or has expired.</p>
      <Link href="/" style={linkStyle}>
        Back to Home
      </Link>
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  textAlign: 'center',
  padding: '24px',
  position: 'relative',
};

const titleStyle = {
  fontSize: '72px',
  fontWeight: '700',
  letterSpacing: '-0.04em',
  marginBottom: '8px',
  color: '#ffffff',
  fontFamily: "var(--font-sans)",
};

const dotStyle = {
  color: '#22c55e',
};

const subtitleStyle = {
  fontSize: '20px',
  fontWeight: '600',
  letterSpacing: '-0.02em',
  color: '#ffffff',
  marginBottom: '4px',
  fontFamily: "var(--font-sans)",
};

const textStyle = {
  color: '#8e8e8f',
  fontSize: '15px',
  marginBottom: '32px',
  fontWeight: '400',
  fontFamily: "var(--font-sans)",
};

const linkStyle = {
  color: '#ffffff',
  textDecoration: 'none',
  border: '1px solid #1a1a1a',
  padding: '12px 24px',
  borderRadius: '8px',
  backgroundColor: '#0e0e0e',
  fontSize: '14px',
  fontWeight: '600',
  fontFamily: "var(--font-sans)",
  transition: 'border-color 0.2s ease, background-color 0.2s ease',
  cursor: 'pointer',
};
