import { ProcessingError, StitchPattern } from '../types';
import { PatternGenerator } from './PatternGenerator';
import { FormatConverter } from '../formats/converter';

export class ConversionManager {
  private progress: number = 0;
  private stage: string = '';
  private error: Error | null = null;

  async convertImage(params: {
    imageData: ImageData;
    settings: {
      width: number;
      height: number;
      density: number;
      angle: number;
      underlay: boolean;
      pullCompensation: number;
      color: string;
    };
  }): Promise<StitchPattern> {
    try {
      this.updateProgress('preprocessing', 0);

      // Generate pattern
      const pattern = await PatternGenerator.generatePattern(params);
      this.updateProgress('processing', 50);

      // Validate pattern
      PatternGenerator.validatePattern(pattern);
      this.updateProgress('finalizing', 90);

      // Final validation
      if (!pattern.stitches.length) {
        throw new ProcessingError('No stitches generated');
      }

      this.updateProgress('complete', 100);
      return pattern;

    } catch (error) {
      this.error = error instanceof Error ? error : new Error('Unknown error');
      console.error('Conversion error:', error);
      throw error;
    }
  }

  async exportPattern(pattern: StitchPattern, format: string): Promise<ArrayBuffer> {
    try {
      this.updateProgress('exporting', 0);
      
      // Validate pattern before export
      PatternGenerator.validatePattern(pattern);
      this.updateProgress('exporting', 50);

      // Convert to requested format
      const formatData = await FormatConverter.convertToFormat(pattern, format);
      this.updateProgress('complete', 100);

      return formatData;

    } catch (error) {
      this.error = error instanceof Error ? error : new Error('Unknown error');
      console.error('Export error:', error);
      throw error;
    }
  }

  getProgress(): { progress: number; stage: string; error: Error | null } {
    return {
      progress: this.progress,
      stage: this.stage,
      error: this.error
    };
  }

  private updateProgress(stage: string, progress: number) {
    this.stage = stage;
    this.progress = progress;
    this.error = null;
  }
}