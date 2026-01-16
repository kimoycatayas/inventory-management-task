// Shared utility for atomic JSON file operations
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * Reads a JSON file and returns parsed data
 * @param {string} filePath - Relative path from process.cwd()
 * @returns {Promise<any>} Parsed JSON data
 */
export async function readJson(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  try {
    const data = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty array for data files
      if (filePath.includes('data/')) {
        return [];
      }
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Writes JSON data to a file atomically using temp file + rename
 * @param {string} filePath - Relative path from process.cwd()
 * @param {any} data - Data to write (will be JSON.stringify'd)
 * @returns {Promise<void>}
 */
export async function writeJsonAtomic(filePath, data) {
  const fullPath = path.join(process.cwd(), filePath);
  const tempPath = `${fullPath}.tmp.${generateId()}`;
  
  try {
    // Ensure directory exists
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write to temp file
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    
    // Atomic rename (works on most Unix-like systems and Windows)
    await fs.rename(tempPath, fullPath);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempPath);
    } catch (unlinkError) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Generates a unique ID (UUID v4 if available, fallback to timestamp-based)
 * @returns {string} Unique identifier
 */
export function generateId() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older Node.js versions (shouldn't be needed for Next.js 15+)
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}