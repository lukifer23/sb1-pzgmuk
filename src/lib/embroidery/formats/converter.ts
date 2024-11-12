import type { StitchPattern, EmbroideryFormat } from '../types';
import { DSTWriter } from './dst';
import { PESWriter } from './pes';
import { JEFWriter } from './jef';
import { EXPWriter } from './exp';
import { VP3Writer } from './vp3';
import { HUSWriter } from './hus';
import { PATWriter } from './pat';
import { QCCWriter } from './qcc';

export class FormatConverter {
  static convertToFormat(pattern: StitchPattern, format: EmbroideryFormat): ArrayBuffer {
    try {
      // Validate pattern
      this.validatePattern(pattern);

      // Convert coordinates to machine format (0.1mm units)
      const machinePattern = this.convertToMachineFormat(pattern);

      // Convert to requested format
      switch (format) {
        case 'dst':
          return DSTWriter.write(machinePattern);
        case 'pes':
          return PESWriter.write(machinePattern);
        case 'jef':
          return JEFWriter.write(machinePattern);
        case 'exp':
          return EXPWriter.write(machinePattern);
        case 'vp3':
          return VP3Writer.write(machinePattern);
        case 'hus':
          return HUSWriter.write(machinePattern);
        case 'pat':
          return PATWriter.write(machinePattern);
        case 'qcc':
          return QCCWriter.write(machinePattern);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      console.error('Format conversion error:', error);
      throw error instanceof Error ? error : new Error('Unknown conversion error');
    }
  }

  private static validatePattern(pattern: StitchPattern): void {
    if (!pattern) {
      throw new Error('Pattern is required');
    }
    if (!Array.isArray(pattern.stitches) || pattern.stitches.length === 0) {
      throw new Error('Pattern must contain stitches');
    }
    if (!pattern.dimensions?.width || !pattern.dimensions?.height) {
      throw new Error('Pattern must have valid dimensions');
    }
    if (!Array.isArray(pattern.colors) || pattern.colors.length === 0) {
      throw new Error('Pattern must have at least one color');
    }
  }

  private static convertToMachineFormat(pattern: StitchPattern): StitchPattern {
    // Convert mm to 0.1mm units and ensure coordinates are positive
    const minX = Math.min(...pattern.stitches.map(s => s.x));
    const minY = Math.min(...pattern.stitches.map(s => s.y));

    return {
      ...pattern,
      stitches: pattern.stitches.map(stitch => ({
        ...stitch,
        x: Math.round((stitch.x - minX) * 10),
        y: Math.round((stitch.y - minY) * 10)
      })),
      dimensions: {
        width: Math.round(pattern.dimensions.width * 10),
        height: Math.round(pattern.dimensions.height * 10)
      }
    };
  }
}