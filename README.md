# GlobeTrotter - Travel Planning Application
Live Video link ==> https://www.youtube.com/watch?v=Z6XR_HXK9Wg
A comprehensive travel planning application built with Next.js, MongoDB, and NextAuth.js.

## Features

- **Authentication System**: Complete auth flow with NextAuth.js
  - Email/password registration and login
  - Google OAuth integration
  - Forgot password with email reset
  - Secure session management

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: NextAuth.js with JWT sessions
- **Styling**: Tailwind CSS with custom design system
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud)
- Google OAuth credentials (optional)
- Email server credentials (optional, for password reset)

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Required
MONGODB_URI=mongodb://localhost:27017/globetrotter
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Optional - for Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional - for email functionality
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Add the client ID and secret to your `.env.local`

### Email Configuration (Optional)

For Gmail:
1. Enable 2-factor authentication
2. Generate an app password
3. Use the app password as EMAIL_SERVER_PASSWORD

## Authentication Flow Testing

### Test Accounts
Create test accounts using the registration form or use Google OAuth.

### Flows to Test:
1. **Registration**: Create account with email/password
2. **Login**: Sign in with credentials or Google
3. **Forgot Password**: Request password reset email
4. **Reset Password**: Use reset link to set new password
5. **Session Management**: Verify sessions persist and logout works

## Project Structure

```
/app
  /api/auth/           # Authentication API routes
  /auth/               # Auth pages (login, register, etc.)
  /dashboard/          # Protected dashboard area
  layout.jsx           # Root layout with providers
  page.jsx             # Home page

/components
  /ui/                 # Reusable UI components
  /layout/             # Layout components
  /providers/          # Context providers

/lib
  mongodb.js           # Database connection
  auth.js              # NextAuth configuration

/models
  User.js              # User model with Mongoose
```

## Development Notes

- All code is in JSX format (no TypeScript)
- Uses Next.js App Router with both server and client components
- MongoDB integration with Mongoose ODM
- Secure password hashing with bcryptjs
- Rate limiting and security best practices implemented
- Responsive design with Tailwind CSS

## Next Steps

This completes the **Authentication Feature (Feature 1)**. 

Ready for the next feature implementation:
- **Dashboard/Home Screen (Feature 2)**
- **Create Trip Screen (Feature 3)**
- **My Trips (Trip List) Screen (Feature 4)**
- And so on...

## Deployment

The application is ready for Vercel deployment:
```bash
npm run build
```

Make sure to configure environment variables in your Vercel dashboard.
