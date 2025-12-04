# How to Get Supabase Service Role Key

## Important: Service Role Key vs Anon Key

- **Anon Key** (Public): Used for client-side operations, respects Row Level Security (RLS)
- **Service Role Key** (Secret): Used for server-side operations, bypasses RLS - **This is what you need!**

## Step-by-Step Instructions

### 1. Go to Supabase Dashboard
- Visit [Supabase Dashboard](https://supabase.com/dashboard)
- Select your project: `rzrroghnzintpxspwauf` (or your project name)

### 2. Navigate to API Settings
1. Click on **Settings** (gear icon) in the left sidebar
2. Click on **API** in the settings menu

### 3. Find the Service Role Key
- Scroll down to the **Project API keys** section
- You'll see two keys:
  - **anon** `public` - This is the public key (NOT what you need)
  - **service_role** `secret` - This is the service role key (WHAT YOU NEED)

### 4. Copy the Service Role Key
- Click the **eye icon** or **reveal** button next to `service_role` key
- Click **Copy** to copy the key
- **⚠️ WARNING**: This key has full access to your database. Never expose it in client-side code!

### 5. Add to Environment Variables
Add to your `.env.local` file:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important Notes:**
- The service_role key will be different from the anon key
- It should have `"role":"service_role"` when decoded (not `"role":"anon"`)
- Never commit this key to version control
- Restart your development server after adding it

### 6. Verify the Key
The service_role key should:
- Be much longer than the anon key
- Start with `eyJ...` (like the anon key, but different)
- When decoded at jwt.io, show `"role":"service_role"` (not `"role":"anon"`)

## Current Issue

You're currently using the **anon key** as a fallback, which won't work for server-side operations. You need to:

1. Get the actual **service_role** key from Supabase Dashboard
2. Add it to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`
3. Remove any fallback to the anon key
4. Restart your dev server

## Security Reminder

- ✅ Use `service_role` key in server-side API routes only
- ✅ Use `anon` key in client-side code
- ❌ Never expose `service_role` key in client-side code
- ❌ Never commit `service_role` key to git





