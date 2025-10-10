import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFExportOptions {
  filename: string;
  element: HTMLElement;
  quality?: 'low' | 'medium' | 'high';
  scale?: number;
  logoUrl?: string;
}

export async function exportToPDF({
  filename,
  element,
  quality = 'medium',
  scale,
  logoUrl
}: PDFExportOptions): Promise<void> {
  // Quality settings
  const qualitySettings = {
    low: { scale: 1, imageQuality: 0.5, imageType: 'JPEG' as const },
    medium: { scale: 1.5, imageQuality: 0.7, imageType: 'JPEG' as const },
    high: { scale: 2, imageQuality: 0.95, imageType: 'PNG' as const }
  };

  const settings = qualitySettings[quality];
  const finalScale = scale || settings.scale;

  // Clone element to avoid modifying original
  const clonedElement = element.cloneNode(true) as HTMLElement;

  // Create temp container off-screen
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = element.offsetWidth + 'px';
  container.appendChild(clonedElement);
  document.body.appendChild(container);

  try {
    // Convert Firebase Storage logos to base64 for html2canvas
    if (logoUrl) {
      const logoImgs = clonedElement.querySelectorAll('img');

      for (const img of Array.from(logoImgs)) {
        if (img.src && img.src.includes('firebasestorage')) {
          try {
            // Fetch the image and convert to base64
            const response = await fetch(img.src);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });

            // Replace src with base64
            img.src = base64;
          } catch (error) {
            console.warn('Failed to convert logo to base64:', error);
            // Continue without logo
          }
        }
      }
    }

    // Create canvas (no need for useCORS since we converted to base64)
    const canvas = await html2canvas(clonedElement, {
      scale: finalScale,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: clonedElement.scrollWidth,
      windowHeight: clonedElement.scrollHeight,
      allowTaint: false
    });

    // Initialize PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Calculate dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Convert canvas to image
    const imgData = canvas.toDataURL(
      settings.imageType === 'JPEG' ? 'image/jpeg' : 'image/png',
      settings.imageQuality
    );

    // Add image to PDF with pagination
    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(
      imgData,
      settings.imageType,
      0,
      position,
      imgWidth,
      imgHeight,
      undefined,
      'FAST'
    );
    heightLeft -= pageHeight;

    // Additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(
        imgData,
        settings.imageType,
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );
      heightLeft -= pageHeight;
    }

    // Save PDF
    pdf.save(filename);
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}
