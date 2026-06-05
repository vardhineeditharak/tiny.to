import './global.css';

export const metadata = {
  title: 'tiny.to — Ultra-Minimalist URL Shortener',
  description: 'A clean, privacy-respecting, and edge-fast URL shortener with zero distraction.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
