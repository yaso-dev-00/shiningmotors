import { NextRequest, NextResponse } from "next/server";
import ffmpegStatic from "ffmpeg-static";
import { spawn, execSync } from "child_process";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import os from "os";
import supabase from "@/integrations/supabase/client";

export const runtime = "nodejs";

// Get ffmpeg path with proper validation - works in all environments
function getFfmpegPath(): string {
  const isWindows = os.platform() === "win32";
  const isLinux = os.platform() === "linux";
  const isDarwin = os.platform() === "darwin";
  
  // Check ffmpeg-static first (if it exists and the file is present)
  // ffmpeg-static can be a string path or null/undefined
  if (ffmpegStatic && typeof ffmpegStatic === "string") {
    let ffmpegPath = ffmpegStatic;
    
    // Try the direct path first
    try {
      if (fs.existsSync(ffmpegPath)) {
        console.log("[crop] Using ffmpeg-static (direct path exists):", ffmpegPath);
        return ffmpegPath;
      }
    } catch (err) {
      // File system check might fail in some environments, continue
      console.log("[crop] Could not verify direct path, continuing search");
    }
    
    // On Windows, try with .exe extension
    if (isWindows && !ffmpegPath.endsWith(".exe")) {
      const exePath = ffmpegPath + ".exe";
      try {
        if (fs.existsSync(exePath)) {
          console.log("[crop] Using ffmpeg-static (with .exe extension):", exePath);
          return exePath;
        }
      } catch {
        // Continue
      }
    }
    
    // Try to resolve the actual binary location for all environments
    try {
      // Method 1: Try to resolve the package and find binary
      let packageDir: string | null = null;
      try {
        const packagePath = require.resolve("ffmpeg-static/package.json");
        packageDir = path.dirname(packagePath);
        console.log("[crop] Found ffmpeg-static package at:", packageDir);
      } catch {
        // If that fails, try to extract from the path we have
        const match = ffmpegStatic.match(/(.*node_modules[\/\\]ffmpeg-static)/);
        if (match) {
          packageDir = match[1];
        }
        // Also try to find it relative to current working directory
        if (!packageDir) {
          const possiblePaths = [
            path.join(process.cwd(), "node_modules", "ffmpeg-static"),
            path.resolve("node_modules", "ffmpeg-static"),
          ];
          for (const testPath of possiblePaths) {
            try {
              if (fs.existsSync(testPath)) {
                packageDir = testPath;
                break;
              }
            } catch {
              // Continue
            }
          }
        }
      }
      
      // Method 2: Build comprehensive list of paths to try for all platforms
      const pathsToTry: string[] = [
        // Original path
        ffmpegStatic,
      ];
      
      // Platform-specific extensions
      if (isWindows) {
        pathsToTry.push(ffmpegStatic + ".exe");
      }
      
      // Remove /ROOT/ prefix (Vercel/serverless environments)
      const withoutRoot = ffmpegStatic.replace(/^\/ROOT\//, "");
      if (withoutRoot !== ffmpegStatic) {
        pathsToTry.push(withoutRoot);
        if (isWindows) {
          pathsToTry.push(withoutRoot + ".exe");
        }
      }
      
      // Resolved from package directory
      if (packageDir) {
        // Common locations
        pathsToTry.push(
          path.join(packageDir, "ffmpeg"),
          path.join(packageDir, "bin", "ffmpeg")
        );
        
        if (isWindows) {
          pathsToTry.push(
            path.join(packageDir, "ffmpeg.exe"),
            path.join(packageDir, "bin", "ffmpeg.exe")
          );
        }
        
        // Platform-specific directories (ffmpeg-static structure)
        if (isWindows) {
          pathsToTry.push(
            path.join(packageDir, "platform", "win32", "x64", "ffmpeg.exe"),
            path.join(packageDir, "platform", "win32", "ia32", "ffmpeg.exe"),
            path.join(packageDir, "platform", "win32", "arm64", "ffmpeg.exe")
          );
        } else if (isLinux) {
          pathsToTry.push(
            path.join(packageDir, "platform", "linux", "x64", "ffmpeg"),
            path.join(packageDir, "platform", "linux", "ia32", "ffmpeg"),
            path.join(packageDir, "platform", "linux", "arm64", "ffmpeg"),
            path.join(packageDir, "platform", "linux", "armv7", "ffmpeg")
          );
        } else if (isDarwin) {
          pathsToTry.push(
            path.join(packageDir, "platform", "darwin", "x64", "ffmpeg"),
            path.join(packageDir, "platform", "darwin", "arm64", "ffmpeg")
          );
        }
      }
      
      // Try resolving relative to current working directory
      pathsToTry.push(
        path.resolve(process.cwd(), withoutRoot),
        path.resolve(withoutRoot)
      );
      if (isWindows) {
        pathsToTry.push(
          path.resolve(process.cwd(), withoutRoot + ".exe"),
          path.resolve(withoutRoot + ".exe")
        );
      }
      
      // Try absolute resolution
      pathsToTry.push(path.resolve(ffmpegStatic));
      if (isWindows) {
        pathsToTry.push(path.resolve(ffmpegStatic) + ".exe");
      }
      
      // Remove duplicates
      const uniquePaths = [...new Set(pathsToTry)];
      
      for (const testPath of uniquePaths) {
        try {
          if (fs.existsSync(testPath)) {
            console.log("[crop] Found ffmpeg at resolved path:", testPath);
            return testPath;
          }
        } catch (err) {
          // Continue to next path
        }
      }
      
      // If none found but we have a package directory, try the most likely paths
      if (packageDir) {
        // Check what files are actually in the package directory
        try {
          const packageFiles = fs.readdirSync(packageDir);
          console.log("[crop] Files in ffmpeg-static package:", packageFiles);
          
          // Look for ffmpeg binary in the directory
          for (const file of packageFiles) {
            if (file === "ffmpeg" || file === "ffmpeg.exe" || file.startsWith("ffmpeg")) {
              const binaryPath = path.join(packageDir, file);
              if (fs.existsSync(binaryPath)) {
                console.log("[crop] Found ffmpeg binary in package:", binaryPath);
                return binaryPath;
              }
            }
          }
          
          // Check subdirectories
          for (const file of packageFiles) {
            const filePath = path.join(packageDir, file);
            try {
              const stat = fs.statSync(filePath);
              if (stat.isDirectory()) {
                const subFiles = fs.readdirSync(filePath);
                for (const subFile of subFiles) {
                  if (subFile === "ffmpeg" || subFile === "ffmpeg.exe") {
                    const binaryPath = path.join(filePath, subFile);
                    if (fs.existsSync(binaryPath)) {
                      console.log("[crop] Found ffmpeg binary in subdirectory:", binaryPath);
                      return binaryPath;
                    }
                  }
                }
              }
            } catch {
              // Skip if we can't read the directory
            }
          }
        } catch (err) {
          console.log("[crop] Could not read package directory:", err);
        }
        
        // Try the most likely path anyway
        const likelyPath = path.join(packageDir, "ffmpeg");
        console.log("[crop] Using likely path (unverified):", likelyPath);
        return likelyPath;
      }
      
      // Last resort: use original path (might work if it's a special file system)
      console.log("[crop] Using original path (unverified):", ffmpegStatic);
      return ffmpegStatic;
    } catch (err) {
      console.log("[crop] Error resolving path, using original:", ffmpegStatic, err);
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
    const videoUrl = formData.get("videoUrl"); // New: Supabase storage URL
    const cropX = Number(formData.get("cropX") ?? 0);
    const cropY = Number(formData.get("cropY") ?? 0);
    const cropWidth = Number(formData.get("cropWidth") ?? 0);
    const cropHeight = Number(formData.get("cropHeight") ?? 0);
    const userId = String(formData.get("userId") ?? "");

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

    // Handle video input: either from FormData (small files) or from Supabase URL (large files)
    if (videoUrl && typeof videoUrl === "string") {
      // Download video from Supabase storage URL (for large files)
      console.log("[crop] Downloading video from Supabase:", videoUrl);
      try {
        const response = await fetch(videoUrl);
        if (!response.ok) {
          throw new Error(`Failed to download video: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        await fs.promises.writeFile(inputPath, Buffer.from(arrayBuffer));
        console.log("[crop] Video downloaded successfully");
      } catch (err) {
        console.error("[crop] Error downloading video:", err);
        return NextResponse.json(
          { error: `Failed to download video: ${err instanceof Error ? err.message : "Unknown error"}` },
          { status: 500 }
        );
      }
    } else if (video instanceof Blob) {
      // For small files, use direct upload (backward compatibility)
      const arrayBuffer = await video.arrayBuffer();
      const fileSizeMB = arrayBuffer.byteLength / (1024 * 1024);
      
      // Warn if file is large (Vercel limit is ~4.5MB)
      if (fileSizeMB > 4) {
        console.warn(`[crop] Large video file detected (${fileSizeMB.toFixed(2)}MB). Consider using videoUrl parameter for better reliability.`);
      }
      
      await fs.promises.writeFile(inputPath, Buffer.from(arrayBuffer));
    } else {
      return NextResponse.json(
        { error: "Either video file or videoUrl is required" },
        { status: 400 }
      );
    }

    // Get and validate ffmpeg path
    const ffmpegPath = getFfmpegPath();
    
    // Log the path being used for debugging
    console.log("[crop] Initial ffmpeg path from getFfmpegPath():", ffmpegPath);
    console.log("[crop] ffmpeg-static value:", ffmpegStatic);
    console.log("[crop] Platform:", os.platform());
    console.log("[crop] Current working directory:", process.cwd());
    
    // On Windows, we need to ensure the path is correct
    // ffmpeg-static might return a path without .exe extension
    const isWindows = os.platform() === "win32";
    let finalFfmpegPath = ffmpegPath;
    
    // On Windows, if path doesn't end with .exe and file doesn't exist, try with .exe
    if (isWindows && !ffmpegPath.endsWith(".exe") && ffmpegPath !== "ffmpeg") {
      const exePath = ffmpegPath + ".exe";
      try {
        if (fs.existsSync(exePath)) {
          finalFfmpegPath = exePath;
          console.log("[crop] Using .exe extension:", finalFfmpegPath);
        }
      } catch {
        // Continue with original path
      }
    }
    
    // On Vercel, file existence checks might fail due to serverless environment
    // We'll try to use the path anyway and let spawn handle the error
    // Only validate if we're not using the fallback "ffmpeg" command
    if (finalFfmpegPath !== "ffmpeg") {
      try {
        if (fs.existsSync(finalFfmpegPath)) {
          // Make sure the binary is executable (important on Unix systems like Vercel)
          try {
            if (!isWindows) {
              fs.chmodSync(finalFfmpegPath, 0o755);
            }
          } catch (chmodErr) {
            // Ignore chmod errors - file might already be executable or on Windows
            console.log("[crop] Could not set execute permissions (this is OK on Windows or if already executable)");
          }
        } else {
          console.warn(`[crop] Warning: ffmpeg path not found at ${finalFfmpegPath}, searching alternatives...`);
          // Try to find it in node_modules for all platforms
          try {
            const nodeModulesPath = path.join(process.cwd(), "node_modules", "ffmpeg-static");
            const possiblePaths: string[] = [];
            
            // Platform-specific paths
            if (isWindows) {
              possiblePaths.push(
                path.join(nodeModulesPath, "ffmpeg.exe"),
                path.join(nodeModulesPath, "bin", "ffmpeg.exe"),
                path.join(nodeModulesPath, "platform", "win32", "x64", "ffmpeg.exe"),
                path.join(nodeModulesPath, "platform", "win32", "ia32", "ffmpeg.exe"),
                path.join(nodeModulesPath, "platform", "win32", "arm64", "ffmpeg.exe")
              );
            } else if (os.platform() === "linux") {
              possiblePaths.push(
                path.join(nodeModulesPath, "ffmpeg"),
                path.join(nodeModulesPath, "bin", "ffmpeg"),
                path.join(nodeModulesPath, "platform", "linux", "x64", "ffmpeg"),
                path.join(nodeModulesPath, "platform", "linux", "arm64", "ffmpeg"),
                path.join(nodeModulesPath, "platform", "linux", "armv7", "ffmpeg")
              );
            } else if (os.platform() === "darwin") {
              possiblePaths.push(
                path.join(nodeModulesPath, "ffmpeg"),
                path.join(nodeModulesPath, "bin", "ffmpeg"),
                path.join(nodeModulesPath, "platform", "darwin", "x64", "ffmpeg"),
                path.join(nodeModulesPath, "platform", "darwin", "arm64", "ffmpeg")
              );
            }
            
            // Also try generic paths
            possiblePaths.push(
              path.join(nodeModulesPath, "ffmpeg"),
              path.join(nodeModulesPath, "bin", "ffmpeg")
            );
            
            for (const testPath of possiblePaths) {
              try {
                if (fs.existsSync(testPath)) {
                  finalFfmpegPath = testPath;
                  console.log("[crop] Found ffmpeg in node_modules:", finalFfmpegPath);
                  // Set execute permissions for Unix systems
                  if (!isWindows) {
                    try {
                      fs.chmodSync(finalFfmpegPath, 0o755);
                    } catch {
                      // Ignore chmod errors
                    }
                  }
                  break;
                }
              } catch {
                // Continue searching
              }
            }
          } catch (err) {
            console.warn("[crop] Could not search node_modules:", err);
          }
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
      // Also use shell: true if the path contains spaces (common on Windows)
      const spawnOptions = (finalFfmpegPath === "ffmpeg" || finalFfmpegPath.includes(" ")) && isWindows 
        ? { shell: true } 
        : {};
      
      console.log("[crop] Executing:", finalFfmpegPath, args.join(" "));
      const proc = spawn(finalFfmpegPath, args, spawnOptions);
      
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


