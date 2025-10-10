/**
 * Centralized PDF Service
 * Handles PDF generation with automatic Firebase image conversion
 * Based on NCR Audit App architecture
 */

import pdfMake from 'pdfmake/build/pdfmake';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

export class PDFService {
  private fontsLoaded = false;

  constructor() {
    this.loadFonts();
  }

  /**
   * Load pdfMake fonts
   */
  private async loadFonts(): Promise<void> {
    if (this.fontsLoaded) return;

    try {
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');

      // Handle different export structures
      if (pdfFontsModule.pdfMake && pdfFontsModule.pdfMake.vfs) {
        pdfMake.vfs = pdfFontsModule.pdfMake.vfs;
      } else if (pdfFontsModule.default?.vfs) {
        pdfMake.vfs = pdfFontsModule.default.vfs;
      } else if (pdfFontsModule.vfs) {
        pdfMake.vfs = pdfFontsModule.vfs;
      } else {
        // Last resort: use entire module
        pdfMake.vfs = pdfFontsModule;
      }

      this.fontsLoaded = true;
      console.log('📚 pdfMake fonts loaded successfully');
    } catch (error) {
      console.error('❌ Error loading pdfMake fonts:', error);
      throw error;
    }
  }

  /**
   * Convert any image URL (including Firebase Storage) to base64 data URL
   * Works with Firebase URLs, HTTP URLs, or existing data URLs
   */
  private async convertImageToDataUrl(url: string): Promise<string> {
    try {
      // Validate URL first
      if (!url || url.trim() === '') {
        throw new Error('Empty or invalid URL provided');
      }

      // If it's already a data URL, return as is
      if (url.startsWith('data:')) {
        return url;
      }

      console.log('🖼️ Converting image to base64');
      console.log('   Full URL:', url);
      console.log('   URL length:', url.length);
      console.log('   Starts with https:', url.startsWith('https'));

      // Use API proxy route to avoid CORS issues
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
      console.log('   Using proxy:', proxyUrl);

      // Fetch the image via proxy (avoids CORS issues)
      const response = await fetch(proxyUrl);
      console.log('   Fetch response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;

          // Ensure proper data URL format
          if (base64data.startsWith('data:')) {
            console.log('✅ Image converted successfully');
            resolve(base64data);
          } else {
            // Construct proper data URL with mime type
            const mimeType = blob.type || 'image/png';
            const base64 = base64data.split(',')[1] || base64data;
            console.log('✅ Image converted successfully');
            resolve(`data:${mimeType};base64,${base64}`);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ Error converting image to data URL:', error);
      throw error;
    }
  }

  /**
   * Recursively process all images in a pdfMake document definition
   * Converts Firebase Storage URLs and HTTP URLs to base64 data URLs
   */
  private async processImages(content: any, parent?: any, key?: string | number): Promise<void> {
    if (!content) return;

    // Handle arrays
    if (Array.isArray(content)) {
      // Process in reverse to safely remove items
      for (let i = content.length - 1; i >= 0; i--) {
        await this.processImages(content[i], content, i);
      }
      return;
    }

    // Handle objects
    if (typeof content === 'object') {
      // Process direct image property
      if (content.image && typeof content.image === 'string') {
        // Skip empty strings
        if (content.image.trim() === '') {
          console.warn('⚠️ Empty image URL found, removing from document');
          delete content.image;
          return;
        }

        try {
          // Skip if already a data URL
          if (!content.image.startsWith('data:')) {
            content.image = await this.convertImageToDataUrl(content.image);
          }
        } catch (error) {
          console.error('⚠️ Failed to convert image, removing from document:', error);
          console.error('   Image URL was:', content.image);
          // Remove entire object from parent array if image conversion fails
          if (Array.isArray(parent) && typeof key === 'number') {
            parent.splice(key, 1);
          } else {
            // If not in array, just delete the image property
            delete content.image;
          }
          return; // Skip further processing of this object
        }
      }

      // Recursively process nested structures
      if (Array.isArray(content.content)) {
        await this.processImages(content.content);
      }
      if (Array.isArray(content.stack)) {
        await this.processImages(content.stack);
      }
      if (Array.isArray(content.columns)) {
        await this.processImages(content.columns);
      }
      if (content.table?.body) {
        await this.processImages(content.table.body);
      }
    }
  }

  /**
   * Generate a PDF with automatic image conversion
   * @param docDefinition - pdfMake document definition
   * @returns pdfMake PDF object with download/open methods
   */
  async generatePdf(docDefinition: TDocumentDefinitions) {
    try {
      // Ensure fonts are loaded
      await this.loadFonts();

      // Process all images in the document
      if (docDefinition.content) {
        console.log('🔄 Processing images in PDF document...');
        await this.processImages(docDefinition.content);
        console.log('✅ Images processed successfully');
      }

      // Generate PDF
      return pdfMake.createPdf(docDefinition);
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Generate and download a PDF
   * @param docDefinition - pdfMake document definition
   * @param filename - Output filename (without .pdf extension)
   */
  async downloadPdf(docDefinition: TDocumentDefinitions, filename: string): Promise<void> {
    try {
      const pdf = await this.generatePdf(docDefinition);
      pdf.download(`${filename}.pdf`);
      console.log('✅ PDF downloaded:', filename);
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      throw error;
    }
  }

  /**
   * Generate and open PDF in new window
   * @param docDefinition - pdfMake document definition
   */
  async openPdf(docDefinition: TDocumentDefinitions): Promise<void> {
    try {
      const pdf = await this.generatePdf(docDefinition);
      pdf.open();
      console.log('✅ PDF opened in new window');
    } catch (error) {
      console.error('❌ Error opening PDF:', error);
      throw error;
    }
  }

  /**
   * Generate PDF as blob
   * @param docDefinition - pdfMake document definition
   * @returns Promise<Blob>
   */
  async getPdfBlob(docDefinition: TDocumentDefinitions): Promise<Blob> {
    try {
      const pdf = await this.generatePdf(docDefinition);
      return new Promise((resolve, reject) => {
        pdf.getBlob((blob) => {
          resolve(blob);
        });
      });
    } catch (error) {
      console.error('❌ Error getting PDF blob:', error);
      throw error;
    }
  }

  /**
   * Generate PDF as base64 string
   * @param docDefinition - pdfMake document definition
   * @returns Promise<string>
   */
  async getPdfBase64(docDefinition: TDocumentDefinitions): Promise<string> {
    try {
      const pdf = await this.generatePdf(docDefinition);
      return new Promise((resolve, reject) => {
        pdf.getBase64((base64) => {
          resolve(base64);
        });
      });
    } catch (error) {
      console.error('❌ Error getting PDF base64:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const pdfService = new PDFService();
