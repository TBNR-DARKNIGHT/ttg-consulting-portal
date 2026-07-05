import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfDocumentViewerProps {
  file: string;
  title: string;
}

export function PdfDocumentViewer({ file, title }: PdfDocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => setContainerWidth(element.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-[75dvh] min-h-[28rem] overflow-y-auto overscroll-contain bg-muted/30 p-2 sm:p-4"
      style={{ WebkitOverflowScrolling: 'touch' }}
      aria-label={`${title} PDF viewer`}
    >
      <Document
        file={file}
        loading={<p className="p-4 text-sm text-muted-foreground">Loading document…</p>}
        error={<p className="p-4 text-sm text-destructive">The PDF could not be displayed.</p>}
        onLoadSuccess={({ numPages }) => setPageCount(numPages)}
      >
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          {Array.from({ length: pageCount }, (_, index) => (
            <Page
              key={`page-${index + 1}`}
              pageNumber={index + 1}
              width={containerWidth > 0 ? Math.min(containerWidth - 16, 960) : undefined}
              renderAnnotationLayer
              renderTextLayer
              className="overflow-hidden rounded-sm bg-white shadow-sm"
              loading={
                <div className="flex h-64 items-center justify-center bg-white text-sm text-muted-foreground">
                  Loading page {index + 1}…
                </div>
              }
            />
          ))}
        </div>
      </Document>
    </div>
  );
}
