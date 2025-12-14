# Gemini 2.5 TTS Studio - Setup Guide

## Authentication with Supabase

This application now requires Google authentication via Supabase. Each user configures their own Gemini API key.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Gemini API Key**: Get yours from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned (~2 minutes)

### 2. Enable Google Authentication

1. In your Supabase dashboard, navigate to **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. You have two options:

   **Option A: Use Supabase's OAuth (Easiest for Development)**
   - Simply toggle "Enable Sign in with Google"
   - Supabase provides default credentials for testing
   - ⚠️ **Note**: This only works for development

   **Option B: Use Your Own Google OAuth Credentials (Required for Production)**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - **Add authorized redirect URIs**:
     - Development: `https://<your-project-ref>.supabase.co/auth/v1/callback`
     - Production: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - **Add authorized JavaScript origins**:
     - Development: `http://localhost:3000`
     - Production: `https://your-production-domain.com` (e.g., `https://gimini-tts.vercel.app`)
   - Copy Client ID and Client Secret to Supabase

   > **Important**: The redirect URI must ALWAYS point to your Supabase URL, not your app URL. Supabase handles the OAuth flow and then redirects back to your app.

### 3. Set Up Database

1. In Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the contents of `supabase/migrations/create_user_settings.sql`
4. Run the query to create the `user_settings` table with Row Level Security

### 4. Configure Environment Variables

1. In your Supabase dashboard, go to **Project Settings** → **API**
2. Copy your **Project URL** and **anon/public** key
3. Create a `.env.local` file in the project root:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Install Dependencies & Run

```bash
npm install
npm run dev
```

The app will open at `http://localhost:3000`

## First Time Usage

1. **Sign In**: Click "Sign in with Google" on the landing page
2. **Configure API Key**:
   - After signing in, you'll see a warning banner
   - Click the settings icon (gear) or "Go to Settings"
   - Enter your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Click "Save API Key"
3. **Start Using**: Return to the main page and start generating speech!

## Security Notes

- Your API key is **encrypted** before being stored in Supabase
- Row Level Security ensures you can only access your own data
- The encryption key is client-side (see `contexts/AuthContext.tsx`)
- For production, consider implementing a backend proxy to hide API keys entirely

## Troubleshooting

### "Property 'env' does not exist on type 'ImportMeta'"
- This is fixed by `vite-env.d.ts` - make sure it exists
- Restart your TypeScript server in your IDE

### Google Sign-in Fails
- Verify Google provider is enabled in Supabase
- Check that redirect URIs are configured correctly
- Make sure you're using `https://` for redirect URIs (not `http://`)

### API Key Not Saving
- Check browser console for errors
- Verify the SQL migration ran successfully
- Ensure Row Level Security policies are in place

### Speech Generation Fails
- Ensure you've entered a valid Gemini API key
- Check that your API key has credits/quota available
- Verify the model you selected supports audio generation

## Development

- **Authentication**: Uses Supabase Auth with Google OAuth
- **Database**: PostgreSQL via Supabase with Row Level Security
- **State Management**: React hooks + Context API  
- **Routing**: React Router v6
- **Encryption**: CryptoJS (AES) for API key storage

## Support

For issues or questions:
- Check the [Supabase Documentation](https://supabase.com/docs)
- Review the [Gemini API Documentation](https://ai.google.dev/api)
