import { useEffect, useRef, useState, type RefObject } from 'react';
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

function LazyPdfPage({
  pageNumber,
  width,
  scrollRoot,
}: {
  pageNumber: number;
  width?: number;
  scrollRoot: RefObject<HTMLDivElement | null>;
}) {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(pageNumber <= 2);

  useEffect(() => {
    if (visible || !placeholderRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { root: scrollRoot.current, rootMargin: '800px 0px' },
    );
    observer.observe(placeholderRef.current);
    return () => observer.disconnect();
  }, [scrollRoot, visible]);

  if (!visible) {
    return (
      <div
        ref={placeholderRef}
        className="flex aspect-[0.707] w-full max-w-[960px] items-center justify-center bg-white text-sm text-muted-foreground shadow-sm"
      >
        Page {pageNumber}
      </div>
    );
  }

  return (
    <Page
      pageNumber={pageNumber}
      width={width}
      renderAnnotationLayer
      renderTextLayer
      className="overflow-hidden rounded-sm bg-white shadow-sm"
      loading={
        <div className="flex aspect-[0.707] w-full items-center justify-center bg-white text-sm text-muted-foreground">
          Loading page {pageNumber}…
        </div>
      }
    />
  );
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

  const pageWidth = containerWidth > 0 ? Math.min(containerWidth - 16, 960) : undefined;

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
            <LazyPdfPage
              key={`page-${index + 1}`}
              pageNumber={index + 1}
              width={pageWidth}
              scrollRoot={containerRef}
            />
          ))}
        </div>
      </Document>
    </div>
  );
}
