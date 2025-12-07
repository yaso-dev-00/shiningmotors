# Fix Firebase Admin SDK Credentials Error

## Error Message
```
Error fetching access token: invalid_grant (Invalid grant: account not found)
```

This error occurs when Firebase Admin SDK credentials are invalid, revoked, or missing.

## Solution

### Step 1: Generate New Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `shining-motors-d75ce`
3. Go to **Project Settings** (gear icon) → **Service Accounts** tab
4. Click **"Generate new private key"**
5. Click **"Generate key"** in the confirmation dialog
6. A JSON file will be downloaded (e.g., `shining-motors-d75ce-firebase-adminsdk-xxxxx.json`)

### Step 2: Extract Values from JSON

Open the downloaded JSON file. You'll see something like:

```json
{
  "type": "service_account",
  "project_id": "shining-motors-d75ce",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@shining-motors-d75ce.iam.gserviceaccount.com",
  ...
}
```

Extract these three values:
- **FIREBASE_PROJECT_ID**: `project_id` field
- **FIREBASE_PRIVATE_KEY**: `private_key` field (keep the `\n` characters as-is)
- **FIREBASE_CLIENT_EMAIL**: `client_email` field

### Step 3: Update Vercel Environment Variables

#### Option A: Using Vercel CLI

```powershell
# Update FIREBASE_PROJECT_ID
echo "shining-motors-d75ce" | vercel env add FIREBASE_PROJECT_ID production --force
echo "shining-motors-d75ce" | vercel env add FIREBASE_PROJECT_ID preview --force
echo "shining-motors-d75ce" | vercel env add FIREBASE_PROJECT_ID development --force

# Update FIREBASE_PRIVATE_KEY (copy the entire private_key value from JSON, including \n)
# IMPORTANT: Keep the \n characters in the private key
$privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
echo $privateKey | vercel env add FIREBASE_PRIVATE_KEY production --force
echo $privateKey | vercel env add FIREBASE_PRIVATE_KEY preview --force
echo $privateKey | vercel env add FIREBASE_PRIVATE_KEY development --force

# Update FIREBASE_CLIENT_EMAIL
$clientEmail = "firebase-adminsdk-xxxxx@shining-motors-d75ce.iam.gserviceaccount.com"
echo $clientEmail | vercel env add FIREBASE_CLIENT_EMAIL production --force
echo $clientEmail | vercel env add FIREBASE_CLIENT_EMAIL preview --force
echo $clientEmail | vercel env add FIREBASE_CLIENT_EMAIL development --force
```

#### Option B: Using Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. For each variable, click **Edit** or **Add**:
   - **FIREBASE_PROJECT_ID**: `shining-motors-d75ce`
   - **FIREBASE_PRIVATE_KEY**: Copy the entire `private_key` value from JSON (including `\n` characters)
   - **FIREBASE_CLIENT_EMAIL**: Copy the `client_email` value from JSON
4. Select all environments (Production, Preview, Development)
5. Click **Save**

### Step 4: Important Notes

⚠️ **CRITICAL**: When setting `FIREBASE_PRIVATE_KEY`:
- The private key must include `\n` characters for newlines
- In Vercel, you can paste it as-is (the `\n` will be preserved)
- Do NOT manually replace `\n` with actual newlines
- The key should look like: `-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n`

### Step 5: Redeploy

After updating environment variables, redeploy your application:

```powershell
vercel deploy --prod
```

Or trigger a redeploy from the Vercel dashboard.

### Step 6: Verify

After redeployment, test push notifications again. The error should be resolved.

## Troubleshooting

### Still Getting Errors?

1. **Check if the service account key was revoked:**
   - Go to: https://console.firebase.google.com/project/shining-motors-d75ce/iam-admin/serviceaccounts/project
   - Verify the key ID from your JSON file exists
   - If not, generate a new key

2. **Verify environment variables are set correctly:**
   ```powershell
   vercel env ls | Select-String "FIREBASE"
   ```

3. **Check private key format:**
   - Should start with `-----BEGIN PRIVATE KEY-----`
   - Should end with `-----END PRIVATE KEY-----`
   - Should contain `\n` characters (not actual newlines)

4. **Check client email format:**
   - Should be: `firebase-adminsdk-xxxxx@shining-motors-d75ce.iam.gserviceaccount.com`
   - Should match the email in your downloaded JSON file

## Security Note

⚠️ **Never commit the service account JSON file or private key to version control!**

Always use environment variables for sensitive credentials.


