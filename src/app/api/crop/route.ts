import { NextRequest, NextResponse } from "next/server";
import ffmpegStatic from "ffmpeg-static";
import { spawn, execSync } from "child_process";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import os from "os";
import supabase from "@/integrations/supabase/client";

export const runtime = "nodejs";

// Get ffmpeg path with proper validation
function getFfmpegPath(): string {
  // Priority 1: Use ffmpeg-static if available
  if (ffmpegStatic && typeof ffmpegStatic === "string") {
    // Normalize the path (handle both forward and backslashes, remove ROOT prefix)
    let normalizedPath = ffmpegStatic
      .replace(/^[\/\\]ROOT[\/\\]/, "") // Remove /ROOT/ or \ROOT\ prefix
      .replace(/\\/g, path.sep) // Normalize backslashes to platform-specific separator
      .replace(/\//g, path.sep); // Normalize forward slashes to platform-specific separator
    
    // Try the normalized path first
    if (fs.existsSync(normalizedPath)) {
      console.log("[crop] Using ffmpeg-static (normalized):", normalizedPath);
      return normalizedPath;
    }
    
    // Try the original path
    if (fs.existsSync(ffmpegStatic)) {
      console.log("[crop] Using ffmpeg-static (original):", ffmpegStatic);
      return ffmpegStatic;
    }
    
    // Try to resolve from package directory (most reliable method)
    try {
      const packagePath = require.resolve("ffmpeg-static/package.json");
      const packageDir = path.dirname(packagePath);
      
      // Try different possible binary names
      const possibleNames = ["ffmpeg", "ffmpeg.exe"];
      for (const name of possibleNames) {
        const binaryPath = path.join(packageDir, name);
        if (fs.existsSync(binaryPath)) {
          console.log("[crop] Using ffmpeg from package directory:", binaryPath);
          return binaryPath;
        }
      }
      
      // If not in root, check common subdirectories
      const subdirs = ["bin", "dist", "build"];
      for (const subdir of subdirs) {
        for (const name of possibleNames) {
          const binaryPath = path.join(packageDir, subdir, name);
          if (fs.existsSync(binaryPath)) {
            console.log("[crop] Using ffmpeg from package subdirectory:", binaryPath);
            return binaryPath;
          }
        }
      }
      
      console.log("[crop] Package directory found but binary not located:", packageDir);
    } catch (err) {
      console.log("[crop] Could not resolve package directory:", err);
    }
    
    // Try resolving relative to current working directory
    try {
      const cwdPath = path.resolve(process.cwd(), normalizedPath);
      if (fs.existsSync(cwdPath)) {
        console.log("[crop] Using ffmpeg (resolved from cwd):", cwdPath);
        return cwdPath;
      }
    } catch (err) {
      // Ignore
    }
    
    // Last resort: use normalized path (might work if fs.existsSync is unreliable)
    console.log("[crop] Using normalized path (unverified):", normalizedPath);
    return normalizedPath;
  }
  
  // Check environment variable
  if (process.env.FFMPEG_PATH) {
    try {
      if (fs.existsSync(process.env.FFMPEG_PATH)) {
        console.log("[crop] Using FFMPEG_PATH:", process.env.FFMPEG_PATH);
        return process.env.FFMPEG_PATH;
      } else {
        // Try using it anyway
        console.log("[crop] FFMPEG_PATH exists check failed, but using path anyway:", process.env.FFMPEG_PATH);
        return process.env.FFMPEG_PATH;
      }
    } catch (err) {
      console.log("[crop] Error checking FFMPEG_PATH, using path anyway:", process.env.FFMPEG_PATH);
      return process.env.FFMPEG_PATH;
    }
  }
  
  // Try to find ffmpeg in system PATH (Windows: where, Unix: which)
  // This won't work on Vercel but might work locally
  try {
    const isWindows = os.platform() === "win32";
    const command = isWindows ? "where ffmpeg" : "which ffmpeg";
    const ffmpegPath = execSync(command, { encoding: "utf-8" }).trim().split("\n")[0];
    if (ffmpegPath && fs.existsSync(ffmpegPath)) {
      console.log("[crop] Found ffmpeg in PATH:", ffmpegPath);
      return ffmpegPath;
    }
  } catch (err) {
    // ffmpeg not found in PATH, will fall back to "ffmpeg"
    console.log("[crop] ffmpeg not found in PATH, using 'ffmpeg' command");
  }
  
  // Fallback to system ffmpeg (must be in PATH)
  // This should not happen if ffmpeg-static is properly installed
  console.warn("[crop] Falling back to 'ffmpeg' command - this may fail if not in PATH");
  return "ffmpeg";
}

export async function POST(req: NextRequest) {
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `input-${uuidv4()}.mp4`);
  const outputPath = path.join(tempDir, `cropped-${Date.now()}.mp4`);

  try {
    const formData = await req.formData();
    const video = formData.get("video");
    const cropX = Number(formData.get("cropX") ?? 0);
    const cropY = Number(formData.get("cropY") ?? 0);
    const cropWidth = Number(formData.get("cropWidth") ?? 0);
    const cropHeight = Number(formData.get("cropHeight") ?? 0);
    const userId = String(formData.get("userId") ?? "");

    if (!(video instanceof Blob)) {
      return NextResponse.json(
        { error: "Video file is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!cropWidth || !cropHeight) {
      return NextResponse.json(
        { error: "Invalid crop dimensions" },
        { status: 400 }
      );
    }

    // Write uploaded video to a temporary file
    const arrayBuffer = await video.arrayBuffer();
    await fs.promises.writeFile(inputPath, Buffer.from(arrayBuffer));

    // Get and validate ffmpeg path
    const ffmpegPath = getFfmpegPath();
    
    // Log the path being used for debugging
    console.log("[crop] Final ffmpeg path:", ffmpegPath);
    console.log("[crop] ffmpeg-static value:", ffmpegStatic);
    console.log("[crop] NODE_ENV:", process.env.NODE_ENV);
    
    // Validate and correct the path if needed
    let actualFfmpegPath = ffmpegPath;
    
    if (ffmpegPath !== "ffmpeg") {
      const pathExists = fs.existsSync(ffmpegPath);
      console.log("[crop] Path exists check:", pathExists, "for path:", ffmpegPath);
      
      if (!pathExists) {
        // Try to find the actual binary location using require.resolve
        try {
          const packagePath = require.resolve("ffmpeg-static/package.json");
          const packageDir = path.dirname(packagePath);
          const isWindows = os.platform() === "win32";
          const binaryName = isWindows ? "ffmpeg.exe" : "ffmpeg";
          const resolvedPath = path.join(packageDir, binaryName);
          
          if (fs.existsSync(resolvedPath)) {
            console.log("[crop] Found ffmpeg using require.resolve, using:", resolvedPath);
            actualFfmpegPath = resolvedPath;
          } else {
            console.warn("[crop] require.resolve found package but binary not at expected location:", resolvedPath);
          }
        } catch (err) {
          console.log("[crop] Could not resolve package:", err);
        }
        
        // In development, throw error if we still can't find it
        if (process.env.NODE_ENV === "development" && !fs.existsSync(actualFfmpegPath)) {
          console.error("[crop] ffmpeg binary not found. Attempted paths:");
          console.error("  - Original from ffmpeg-static:", ffmpegStatic);
          console.error("  - Resolved path:", ffmpegPath);
          console.error("  - Final path:", actualFfmpegPath);
          throw new Error(
            `ffmpeg binary not found. ` +
            `ffmpeg-static returned: ${ffmpegStatic}, ` +
            `resolved to: ${ffmpegPath}. ` +
            `Please ensure ffmpeg-static is properly installed or set FFMPEG_PATH environment variable.`
          );
        } else if (!fs.existsSync(actualFfmpegPath)) {
          console.warn(`[crop] Warning: Path not found but attempting anyway (production mode):`, actualFfmpegPath);
        }
      }
      
      // Make sure the binary is executable (important on Unix systems like Vercel)
      if (fs.existsSync(actualFfmpegPath)) {
        try {
          fs.chmodSync(actualFfmpegPath, 0o755);
          console.log("[crop] Set execute permissions on ffmpeg binary");
        } catch (chmodErr) {
          // Ignore chmod errors - file might already be executable or on Windows
          console.log("[crop] Could not set execute permissions (this is OK on Windows or if already executable)");
        }
      }
    }

    // Run ffmpeg crop via CLI
    await new Promise<void>((resolve, reject) => {
      const args = [
        "-y",
        "-i",
        inputPath,
        "-vf",
        `crop=${cropWidth}:${cropHeight}:${cropX}:${cropY}`,
        "-c:a",
        "copy",
        outputPath,
      ];

      const isWindows = os.platform() === "win32";
      // Spawn options: use shell only if it's a command name (not a full path) on Windows
      // For full paths, spawn directly without shell
      const spawnOptions: { shell?: boolean } = {};
      if (ffmpegPath === "ffmpeg" && isWindows) {
        spawnOptions.shell = true;
      }
      
      console.log("[crop] Executing:", actualFfmpegPath, args.join(" "));
      console.log("[crop] Spawn options:", spawnOptions);
      const proc = spawn(actualFfmpegPath, args, spawnOptions);
      
      let stderr = "";

      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("error", (err) => {
        const isDev = process.env.NODE_ENV === "development";
        const installGuide = isDev
          ? "\n\nTo fix this locally:\n1. Install ffmpeg: https://www.gyan.dev/ffmpeg/builds/\n2. Add ffmpeg to your system PATH, OR\n3. Set FFMPEG_PATH environment variable in .env.local pointing to your ffmpeg.exe\n\nNote: This will work automatically on Vercel (production) where ffmpeg-static is bundled."
          : "";
        reject(
          new Error(
            `Failed to spawn ffmpeg: ${err.message}. Make sure ffmpeg is installed and accessible.${installGuide}`
          )
        );
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(
              `ffmpeg exited with code ${code}. ${stderr ? `Error: ${stderr}` : ""}`
            )
          );
        }
      });
    });

    // Read cropped file and upload to Supabase storage
    const fileBuffer = await fs.promises.readFile(outputPath);
    const fileName = `cropped-${uuidv4()}.mp4`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from("posts")
      .upload(filePath, fileBuffer, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from("posts").getPublicUrl(filePath);

    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error("Error cropping video:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Video cropping failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    // Clean up temp files
    try {
      if (fs.existsSync(inputPath)) {
        await fs.promises.unlink(inputPath);
      }
    } catch {
      // ignore
    }
    try {
      if (fs.existsSync(outputPath)) {
        await fs.promises.unlink(outputPath);
      }
    } catch {
      // ignore
    }
  }
}


