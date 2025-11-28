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
  if (typeof ffmpegStatic === "string" && fs.existsSync(ffmpegStatic)) {
    console.log("[crop] Using ffmpeg-static:", ffmpegStatic);
    return ffmpegStatic;
  }
  
  // Check environment variable
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    console.log("[crop] Using FFMPEG_PATH:", process.env.FFMPEG_PATH);
    return process.env.FFMPEG_PATH;
  }
  
  // Try to find ffmpeg in system PATH (Windows: where, Unix: which)
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
    
    // If it's not "ffmpeg" (system PATH), verify the file exists
    if (ffmpegPath !== "ffmpeg" && !fs.existsSync(ffmpegPath)) {
      throw new Error(
        `ffmpeg binary not found at: ${ffmpegPath}. Please install ffmpeg or set FFMPEG_PATH environment variable.`
      );
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


