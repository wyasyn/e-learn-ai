import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCloudinaryFilename(url: string): string {
  try {
    // Remove any query parameters or fragments
    const cleanUrl = url.split("?")[0].split("#")[0];

    // Split by forward slashes to get path segments
    const pathSegments = cleanUrl.split("/");

    // Get the last segment which should contain the filename
    const lastSegment = pathSegments[pathSegments.length - 1];

    if (!lastSegment) {
      return "Unknown file";
    }

    // Check if there's a timestamp prefix (pattern: numbers followed by underscore)
    const timestampMatch = lastSegment.match(/^\d+_(.+)$/);

    let filename;
    if (timestampMatch) {
      // Remove timestamp prefix
      filename = timestampMatch[1];
    } else {
      filename = lastSegment;
    }

    // Decode URL encoding (replace %20 with spaces, etc.)
    filename = decodeURIComponent(filename);

    return filename;
  } catch (error) {
    console.error("Error extracting filename:", error);
    return "Unknown file";
  }
}
