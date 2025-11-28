# Installing FFmpeg on Windows for Local Development

## Option 1: Using Pre-built Binary (Recommended)

### Step 1: Download FFmpeg
1. Go to https://www.gyan.dev/ffmpeg/builds/
2. Click on **"ffmpeg-release-essentials.zip"** (or the latest version)
3. Download the zip file

### Step 2: Extract FFmpeg
1. Extract the zip file to a location like:
   - `C:\ffmpeg\` (recommended)
   - Or `C:\Program Files\ffmpeg\`

### Step 3: Add to System PATH
1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Go to the **"Advanced"** tab
3. Click **"Environment Variables"**
4. Under **"System variables"**, find and select **"Path"**, then click **"Edit"**
5. Click **"New"** and add the path to the `bin` folder:
   - Example: `C:\ffmpeg\bin`
6. Click **"OK"** on all dialogs

### Step 4: Verify Installation
1. Open a **new** Command Prompt or PowerShell (important: must be new to pick up PATH changes)
2. Run: `ffmpeg -version`
3. You should see ffmpeg version information

### Step 5: Restart Your Development Server
- Close your current `npm run dev` terminal
- Open a new terminal and run `npm run dev` again

---

## Option 2: Using FFMPEG_PATH Environment Variable (Alternative)

If you don't want to add ffmpeg to system PATH, you can set it per-project:

### Step 1: Download and Extract FFmpeg
- Same as Option 1, Steps 1-2

### Step 2: Create/Update `.env.local`
1. In your project root (`F:\shining-motors-next\`), create or edit `.env.local`
2. Add this line (adjust path to your actual ffmpeg.exe location):
   ```
   FFMPEG_PATH=C:\ffmpeg\bin\ffmpeg.exe
   ```

### Step 3: Restart Development Server
- Stop `npm run dev`
- Start it again: `npm run dev`

---

## Option 3: Using Chocolatey (Package Manager)

If you have Chocolatey installed:

```powershell
choco install ffmpeg
```

Then restart your terminal and development server.

---

## Option 4: Using Scoop (Package Manager)

If you have Scoop installed:

```powershell
scoop install ffmpeg
```

Then restart your terminal and development server.

---

## Troubleshooting

### "ffmpeg is not recognized"
- Make sure you restarted your terminal/IDE after adding to PATH
- Verify the path is correct: `where ffmpeg` in Command Prompt
- Check that you added the `bin` folder, not the root ffmpeg folder

### Still getting errors after installation
- Try Option 2 (FFMPEG_PATH) instead of system PATH
- Make sure the path in `.env.local` points directly to `ffmpeg.exe`
- Restart your IDE/editor completely

### Testing FFmpeg
Run this command to test:
```bash
ffmpeg -version
```

You should see version information. If not, check your PATH or FFMPEG_PATH setting.

