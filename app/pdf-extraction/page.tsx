import PDFExtractor from '@/components/pdf-extractor';

export default function PDFExtractionPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Document Intelligence</h1>
        <PDFExtractor />
      </div>
    </div>
  );
}