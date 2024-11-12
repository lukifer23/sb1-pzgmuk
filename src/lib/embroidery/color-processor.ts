import { ProcessingError } from './types';

export class ColorProcessor {
  static async processColors(imageData: ImageData, targetColors: string[]): Promise<{
    palette: string[];
    colorMap: Uint8ClampedArray;
  }> {
    try {
      // Convert target colors to RGB
      const rgbPalette = targetColors.map(this.hexToRgb);
      
      // Create color map array
      const colorMap = new Uint8ClampedArray(imageData.width * imageData.height);
      
      // Process each pixel
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        
        // Find closest color in palette
        let minDistance = Infinity;
        let colorIndex = 0;
        
        rgbPalette.forEach((color, index) => {
          const distance = this.colorDistance(
            { r, g, b },
            color
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            colorIndex = index;
          }
        });
        
        colorMap[i / 4] = colorIndex;
      }
      
      return {
        palette: targetColors,
        colorMap
      };
    } catch (error) {
      throw new ProcessingError('Failed to process colors', error);
    }
  }
  
  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      throw new Error(`Invalid color format: ${hex}`);
    }
    
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    };
  }
  
  private static colorDistance(
    c1: { r: number; g: number; b: number },
    c2: { r: number; g: number; b: number }
  ): number {
    // Use CIE76 color difference formula
    const rMean = (c1.r + c2.r) / 2;
    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;
    
    // Weighted RGB distance
    return Math.sqrt(
      (2 + rMean / 256) * dr * dr +
      4 * dg * dg +
      (2 + (255 - rMean) / 256) * db * db
    );
  }
  
  static generateColorLayers(
    colorMap: Uint8ClampedArray,
    width: number,
    height: number
  ): boolean[][] {
    const layers: boolean[][] = [];
    const numColors = Math.max(...Array.from(colorMap)) + 1;
    
    for (let colorIndex = 0; colorIndex < numColors; colorIndex++) {
      const layer = Array(height).fill(0).map(() => Array(width).fill(false));
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (colorMap[idx] === colorIndex) {
            layer[y][x] = true;
          }
        }
      }
      
      layers.push(layer);
    }
    
    return layers;
  }
}