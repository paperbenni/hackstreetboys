import { exec } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Extract text from a PDF buffer using markitdown CLI tool
 * @param buffer The PDF file as a Buffer
 * @returns The extracted markdown content
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Create a temporary file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `pdf-${Date.now()}.pdf`);
    
    // Write the buffer to the temporary file
    fs.writeFileSync(tempFilePath, buffer);
    
    try {
      // Run the markitdown CLI tool
      const { stdout, stderr } = await execAsync(`markitdown "${tempFilePath}"`);
      
      if (stderr) {
        console.warn('markitdown stderr:', stderr);
      }
      
      // Return the markdown output
      return stdout || '';
    } finally {
      // Clean up the temporary file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}