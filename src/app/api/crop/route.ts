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
  // Check ffmpeg-static first (if it exists and the file is present)
  // ffmpeg-static can be a string path or null/undefined
  if (ffmpegStatic && typeof ffmpegStatic === "string") {
    // On Vercel, the file might exist but fs.existsSync might fail due to permissions
    // Try to use it anyway if it's a valid string path
    try {
      if (fs.existsSync(ffmpegStatic)) {
        console.log("[crop] Using ffmpeg-static:", ffmpegStatic);
        return ffmpegStatic;
      } else {
        // Even if existsSync fails, try using it (Vercel might have different file system behavior)
        console.log("[crop] ffmpeg-static path exists check failed, but using path anyway:", ffmpegStatic);
        return ffmpegStatic;
      }
    } catch (err) {
      console.log("[crop] Error checking ffmpeg-static, using path anyway:", ffmpegStatic);
      return ffmpegStatic;
    }
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
    
    // On Vercel, file existence checks might fail due to serverless environment
    // We'll try to use the path anyway and let spawn handle the error
    // Only validate if we're not using the fallback "ffmpeg" command
    if (ffmpegPath !== "ffmpeg") {
      try {
        if (fs.existsSync(ffmpegPath)) {
          // Make sure the binary is executable (important on Unix systems like Vercel)
          try {
            fs.chmodSync(ffmpegPath, 0o755);
          } catch (chmodErr) {
            // Ignore chmod errors - file might already be executable or on Windows
            console.log("[crop] Could not set execute permissions (this is OK on Windows or if already executable)");
          }
        } else {
          console.warn(`[crop] Warning: ffmpeg path not found at ${ffmpegPath}, but attempting to use it anyway (Vercel serverless behavior)`);
        }
      } catch (err) {
        console.warn(`[crop] Warning: Could not verify ffmpeg path existence, but attempting to use it anyway:`, err);
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
      // On Windows, use shell: true if using "ffmpeg" command, otherwise use direct path
      const spawnOptions = ffmpegPath === "ffmpeg" && isWindows 
        ? { shell: true } 
        : {};
      
      console.log("[crop] Executing:", ffmpegPath, args.join(" "));
      const proc = spawn(ffmpegPath, args, spawnOptions);
      
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


