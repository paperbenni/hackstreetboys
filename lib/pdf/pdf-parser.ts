import pdfParse from 'pdf-parse/lib/pdf-parse';

/**
 * Extract text from a PDF buffer
 * @param buffer The PDF file as a Buffer
 * @returns The extracted text content
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Configure options to skip unnecessary processing
    const options = {
      // Skip rendering of images
      renderImages: false,
      // Max pages to process
      max: 0, // 0 means all pages
    };

    // Process the PDF
    const data = await pdfParse(buffer, options);
    
    // Return the extracted text
    return data.text || '';
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}