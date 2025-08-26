# SentiX.AI Authentication Setup Guide

## Overview
This guide explains how to set up authentication for SentiX.AI using Supabase, including user signup/login and sentiment report storage.

## Prerequisites
1. Supabase account and project
2. Node.js and npm installed
3. Environment variables configured

## Installation Steps

### 1. Install Dependencies
```bash
cd client
npm install @supabase/supabase-js
```

### 2. Environment Configuration
Ensure your `.env` file in the client directory contains:
```
VITE_SUPABASE_URL="https://hydvitlhyjxwtjtenccm.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5ZHZpdGxoeWp4d3RqdGVuY2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDM4NTIsImV4cCI6MjA3MTc3OTg1Mn0.in2U9pXw91FqkXitXYoPoMynTKAZv0_EufUoo57m5bo"
```

### 3. Database Setup
Execute the SQL script in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the contents of `supabase-setup.sql`

This will create:
- `sentiment_reports` table with proper structure
- Row Level Security (RLS) policies
- Automatic timestamp updates

### 4. Authentication Configuration
In your Supabase dashboard:
1. Go to Authentication > Settings
2. Enable email confirmations if desired
3. Configure email templates (optional)

## Features Implemented

### Authentication Components
- **AuthModal**: Login/Signup modal with email verification
- **AuthContext**: React context for authentication state management
- **ProtectedRoute**: Route protection for authenticated users

### User Interface Changes
- **Landing Page**: 
  - Login/Signup buttons when not authenticated
  - Profile icon when authenticated
- **Service Page**:
  - Profile button in top-right corner (authenticated users only)
  - Route protection - redirects to landing page if not authenticated

### Profile Management
- **ProfileSidebar**: 
  - User profile information
  - Reports history with delete functionality
  - Logout button

### Report Storage
- Automatic saving of sentiment reports to Supabase
- User-specific report storage with RLS
- Report metadata including sentiment data and timestamps

## Usage Flow

1. **New User**:
   - Visit landing page
   - Click "Sign Up" 
   - Enter email/password
   - Verify email (if enabled)
   - Access service page

2. **Existing User**:
   - Click "Login"
   - Enter credentials
   - Access service page

3. **Generate Reports**:
   - Select company/topic on service page
   - Generate sentiment analysis
   - Reports automatically saved to profile
   - Download PDF and view in profile sidebar

4. **Profile Management**:
   - Click profile icon to view sidebar
   - See all generated reports
   - Delete unwanted reports
   - Logout when done

## Security Features
- Row Level Security (RLS) ensures users only see their own data
- Email verification for new accounts
- Secure session management
- Protected routes for authenticated content

## Troubleshooting

### Common Issues
1. **Supabase connection errors**: Check environment variables
2. **Database errors**: Ensure SQL script was executed properly
3. **Authentication failures**: Verify Supabase project settings
4. **Missing dependencies**: Run `npm install @supabase/supabase-js`

### Development
```bash
# Start development server
npm run dev

# Check for TypeScript errors
npx tsc --noEmit
```

## File Structure
```
client/src/
├── components/
│   ├── auth/
│   │   ├── AuthModal.tsx
│   │   └── ProtectedRoute.tsx
│   └── ProfileSidebar.tsx
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   └── supabase.ts
└── pages/
    ├── Index.tsx (updated with auth)
    └── Service.tsx (updated with auth)
```
