# tiny.to — Ultra-Minimalist URL Shortener

An industry-ready, ultra-minimalist, edge-fast, and privacy-friendly URL shortening platform. Built with **Next.js**, **GSAP**, and **Upstash Redis**.

## Features

- **Dynamic Typography Hero**: Interactive typing animation based on the GSAP engine cycling through key taglines.
- **Ultra-Fast Redirections**: Middleware-driven edge redirections.
- **Link Analytics**: Tracks redirection telemetry such as country, browser, OS, and referrers.
- **Interactive Graphs**: Live SVG click trend visualization inside the secure Dashboard.
- **Account Settings**: Manage mailing options for weekly reports and profile attributes.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Upstash Redis (KV store)
- **Animations**: GSAP (GreenSock Animation Platform)
- **Icons**: Lucide React
- **Styles**: Vanilla CSS & CSS Modules

---

## Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.x or newer)
- **npm** (v9.x or newer)
- An active **Upstash Redis** database instance.

---

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd tiny-to
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Duplicate the `.env.example` file and rename it to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and configure the following variables:
   
   ```env
   # Upstash Redis Configuration
   UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token_here
   
   # Domain prefixed to shortened links
   NEXT_PUBLIC_SHORT_DOMAIN=localhost:3000
   
   # Clerk Configuration
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   ```

---

## Development and Deployment Commands

### Development Server
To launch the application in development mode with hot-reloading:
```bash
npm run dev
```

### Production Build
To create an optimized production bundle:
```bash
npm run build
```

### Start Production Server
To start the server using the compiled production bundle:
```bash
npm run start
```
The application will default to running on `http://localhost:3000` (or the configured port).
