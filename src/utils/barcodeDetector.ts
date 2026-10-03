// Utility for camera barcode / QR code detection with fallback support

export interface BarcodeResult {
  rawValue: string;
  format?: string;
}

// Polyfill check for BarcodeDetector
declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): {
        detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string; format: string }>>;
      };
      getSupportedFormats(): Promise<string[]>;
    };
  }
}

export class CameraBarcodeDetector {
  private detector: unknown = null;
  private isNativeSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        // @ts-expect-error native detector check
        this.detector = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'data_matrix'],
        });
        this.isNativeSupported = true;
      } catch {
        this.isNativeSupported = false;
      }
    }
  }

  get isSupported(): boolean {
    return this.isNativeSupported;
  }

  async detect(videoElement: HTMLVideoElement): Promise<BarcodeResult | null> {
    if (this.isNativeSupported && this.detector) {
      try {
        // @ts-expect-error native call
        const barcodes = await this.detector.detect(videoElement);
        if (barcodes && barcodes.length > 0) {
          return {
            rawValue: barcodes[0].rawValue,
            format: barcodes[0].format,
          };
        }
      } catch (err) {
        console.warn('BarcodeDetector error:', err);
      }
    }
    return null;
  }
}
