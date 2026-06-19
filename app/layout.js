import { ClerkProvider } from '@clerk/nextjs';
import './global.css';

export const metadata = {
  title: 'tiny.to — Ultra-Minimalist URL Shortener',
  description: 'A clean, privacy-respecting, and edge-fast URL shortener with zero distraction.',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
