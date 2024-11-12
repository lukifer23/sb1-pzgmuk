import { ProcessingError } from '../types';

export class BitmapProcessor {
  static async createBitmap(imageData: ImageData): Promise<ImageData> {
    try {
      // Convert to grayscale
      const grayscale = new ImageData(
        new Uint8ClampedArray(imageData.width * imageData.height * 4),
        imageData.width,
        imageData.height
      );

      for (let i = 0; i < imageData.data.length; i += 4) {
        const gray = Math.round(
          imageData.data[i] * 0.299 +
          imageData.data[i + 1] * 0.587 +
          imageData.data[i + 2] * 0.114
        );
        grayscale.data[i] = gray;
        grayscale.data[i + 1] = gray;
        grayscale.data[i + 2] = gray;
        grayscale.data[i + 3] = imageData.data[i + 3];
      }

      // Apply Gaussian blur
      return this.applyGaussianBlur(grayscale);
    } catch (error) {
      throw new ProcessingError('Failed to process image bitmap', error instanceof Error ? error : undefined);
    }
  }

  private static applyGaussianBlur(imageData: ImageData): ImageData {
    const kernel = [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1]
    ];
    const kernelSum = 16;
    
    const result = new ImageData(
      new Uint8ClampedArray(imageData.width * imageData.height * 4),
      imageData.width,
      imageData.height
    );

    for (let y = 1; y < imageData.height - 1; y++) {
      for (let x = 1; x < imageData.width - 1; x++) {
        let r = 0, g = 0, b = 0, a = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * imageData.width + (x + kx)) * 4;
            const weight = kernel[ky + 1][kx + 1];
            
            r += imageData.data[idx] * weight;
            g += imageData.data[idx + 1] * weight;
            b += imageData.data[idx + 2] * weight;
            a += imageData.data[idx + 3] * weight;
          }
        }

        const idx = (y * imageData.width + x) * 4;
        result.data[idx] = Math.round(r / kernelSum);
        result.data[idx + 1] = Math.round(g / kernelSum);
        result.data[idx + 2] = Math.round(b / kernelSum);
        result.data[idx + 3] = Math.round(a / kernelSum);
      }
    }

    return result;
  }
}