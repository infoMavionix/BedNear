import fs from "fs";
import path from "path";

const configuredDirectory = process.env.BEDNEAR_PRIVATE_UPLOAD_DIR;

export const PRIVATE_UPLOAD_DIR = configuredDirectory
  ? path.resolve(configuredDirectory)
  : path.resolve(process.cwd(), "private-uploads");

export function ensurePrivateUploadDirectory(): void {
  if (!fs.existsSync(PRIVATE_UPLOAD_DIR)) {
    fs.mkdirSync(PRIVATE_UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Resolve a storage key safely.
 * Prevents path traversal outside the private upload directory.
 */
export function getStoredFilePath(storageKey: string): string {
  if (
    !storageKey ||
    path.basename(storageKey) !== storageKey ||
    storageKey.includes("..")
  ) {
    throw new Error("Invalid storage key.");
  }

  const resolvedPath = path.resolve(PRIVATE_UPLOAD_DIR, storageKey);

  if (path.dirname(resolvedPath) !== PRIVATE_UPLOAD_DIR) {
    throw new Error("Invalid storage path.");
  }

  return resolvedPath;
}

export function deleteStoredFile(storageKey: string): void {
  const filePath = getStoredFilePath(storageKey);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}