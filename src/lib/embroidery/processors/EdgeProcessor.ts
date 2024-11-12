import { ProcessingError } from '../types';

export class EdgeProcessor {
  static async detectEdges(imageData: ImageData, threshold: number): Promise<ImageData> {
    try {
      const result = new ImageData(
        new Uint8ClampedArray(imageData.width * imageData.height * 4),
        imageData.width,
        imageData.height
      );

      for (let y = 1; y < imageData.height - 1; y++) {
        for (let x = 1; x < imageData.width - 1; x++) {
          const gx = this.sobelX(imageData, x, y);
          const gy = this.sobelY(imageData, x, y);
          
          const magnitude = Math.sqrt(gx * gx + gy * gy);
          const idx = (y * imageData.width + x) * 4;
          
          const edge = magnitude > threshold ? 255 : 0;
          result.data[idx] = edge;
          result.data[idx + 1] = edge;
          result.data[idx + 2] = edge;
          result.data[idx + 3] = 255;
        }
      }

      return this.thinEdges(result);
    } catch (error) {
      throw new ProcessingError('Failed to detect edges', error instanceof Error ? error : undefined);
    }
  }

  private static sobelX(imageData: ImageData, x: number, y: number): number {
    const kernel = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    return this.applyKernel(imageData, x, y, kernel);
  }

  private static sobelY(imageData: ImageData, x: number, y: number): number {
    const kernel = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
    return this.applyKernel(imageData, x, y, kernel);
  }

  private static applyKernel(
    imageData: ImageData,
    x: number,
    y: number,
    kernel: number[][]
  ): number {
    let sum = 0;
    
    for (let ky = -1; ky <= 1; ky++) {
      for (let kx = -1; kx <= 1; kx++) {
        const idx = ((y + ky) * imageData.width + (x + kx)) * 4;
        sum += imageData.data[idx] * kernel[ky + 1][kx + 1];
      }
    }
    
    return sum;
  }

  private static thinEdges(imageData: ImageData): ImageData {
    const result = new ImageData(
      new Uint8ClampedArray(imageData.width * imageData.height * 4),
      imageData.width,
      imageData.height
    );

    for (let y = 1; y < imageData.height - 1; y++) {
      for (let x = 1; x < imageData.width - 1; x++) {
        const idx = (y * imageData.width + x) * 4;
        
        if (imageData.data[idx] === 255) {
          const neighbors = this.getNeighborValues(imageData, x, y);
          if (this.isLocalMaximum(imageData.data[idx], neighbors)) {
            result.data[idx] = 255;
            result.data[idx + 1] = 255;
            result.data[idx + 2] = 255;
            result.data[idx + 3] = 255;
          }
        }
      }
    }

    return result;
  }

  private static getNeighborValues(imageData: ImageData, x: number, y: number): number[] {
    const neighbors = [];
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const idx = ((y + dy) * imageData.width + (x + dx)) * 4;
        neighbors.push(imageData.data[idx]);
      }
    }
    
    return neighbors;
  }

  private static isLocalMaximum(value: number, neighbors: number[]): boolean {
    return neighbors.every(n => value >= n);
  }
}