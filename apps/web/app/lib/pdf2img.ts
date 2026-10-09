export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any = null;
let loadPromise: Promise<any> | null = null;

// ✅ Load pdf.js correctly
async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  loadPromise = import('pdfjs-dist').then((lib: any) => {
    // ✅ VERY IMPORTANT: worker file
    lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

    pdfjsLib = lib;
    return lib;
  });

  return loadPromise;
}

// ✅ MAIN FUNCTION
export async function convertPdfToImage(
  file: File,
): Promise<PdfConversionResult> {
  try {
    const lib = await loadPdfJs();

    // 📄 Read PDF
    const arrayBuffer = await file.arrayBuffer();

    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    // 📐 High quality render
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (context) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
    }

    // 🎨 Render page
    await page.render({
      canvasContext: context!,
      viewport,
    }).promise;

    // 🖼 Convert canvas → image
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              imageUrl: '',
              file: null,
              error: 'Blob creation failed',
            });
            return;
          }

          const originalName = file.name.replace(/\.pdf$/i, '');

          const imageFile = new File([blob], `${originalName}.png`, {
            type: 'image/png',
          });

          resolve({
            imageUrl: URL.createObjectURL(blob),
            file: imageFile,
          });
        },
        'image/png',
        1.0,
      );
    });
  } catch (err: any) {
    console.error('PDF ERROR:', err);

    return {
      imageUrl: '',
      file: null,
      error: `Failed to convert PDF: ${err.message}`,
    };
  }
}
