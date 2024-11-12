import type { StitchPattern, StitchPoint } from '../types';

export class DSTWriter {
  static write(pattern: StitchPattern): ArrayBuffer {
    // Create header and stitch data
    const header = this.createHeader(pattern);
    const stitchData = this.encodeStitches(pattern.stitches);
    
    // Combine header and stitch data
    const data = new ArrayBuffer(header.byteLength + stitchData.byteLength);
    const view = new Uint8Array(data);
    view.set(new Uint8Array(header), 0);
    view.set(new Uint8Array(stitchData), header.byteLength);
    
    return data;
  }

  private static createHeader(pattern: StitchPattern): ArrayBuffer {
    const header = new ArrayBuffer(512);
    const view = new Uint8Array(header);
    const encoder = new TextEncoder();
    
    // Calculate pattern bounds
    const bounds = this.calculateBounds(pattern.stitches);
    
    // Format header string
    const headerText = [
      'LA:Design Studio',
      `ST:${pattern.stitches.length}`,
      `CO:${pattern.colors.length}`,
      `+X:${bounds.maxX}`,
      `-X:${Math.abs(bounds.minX)}`,
      `+Y:${bounds.maxY}`,
      `-Y:${Math.abs(bounds.minY)}`,
      'AX:+0',
      'AY:+0',
      'MX:+0',
      'MY:+0',
      'PD:******'
    ].join('\r\n') + '\r\n';

    // Write header with padding
    const headerBytes = encoder.encode(headerText);
    view.set(headerBytes);
    
    return header;
  }

  private static calculateBounds(stitches: StitchPoint[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    const xCoords = stitches.map(s => s.x);
    const yCoords = stitches.map(s => s.y);
    
    return {
      minX: Math.min(...xCoords),
      maxX: Math.max(...xCoords),
      minY: Math.min(...yCoords),
      maxY: Math.max(...yCoords)
    };
  }

  private static encodeStitches(stitches: StitchPoint[]): ArrayBuffer {
    const data: number[] = [];
    let lastX = 0;
    let lastY = 0;

    // Add initial position
    data.push(...this.encodeStitchDelta(0, 0, 'normal'));

    // Encode all stitches
    for (const stitch of stitches) {
      const dx = Math.round(stitch.x - lastX);
      const dy = Math.round(stitch.y - lastY);

      // Split large movements into multiple jumps if needed
      if (Math.abs(dx) > 121 || Math.abs(dy) > 121) {
        const steps = Math.max(
          Math.ceil(Math.abs(dx) / 121),
          Math.ceil(Math.abs(dy) / 121)
        );
        
        const stepX = dx / steps;
        const stepY = dy / steps;

        for (let i = 0; i < steps; i++) {
          const isLastStep = i === steps - 1;
          const moveX = Math.round(isLastStep ? dx - (stepX * i) : stepX);
          const moveY = Math.round(isLastStep ? dy - (stepY * i) : stepY);
          
          data.push(...this.encodeStitchDelta(
            moveX,
            moveY,
            isLastStep ? stitch.type : 'jump'
          ));
        }
      } else {
        data.push(...this.encodeStitchDelta(dx, dy, stitch.type));
      }

      lastX = stitch.x;
      lastY = stitch.y;
    }

    // Add end of file marker
    data.push(0, 0, 0xF3);

    return new Uint8Array(data).buffer;
  }

  private static encodeStitchDelta(dx: number, dy: number, type: string): number[] {
    // Clamp deltas to valid range
    dx = Math.max(-121, Math.min(121, dx));
    dy = Math.max(-121, Math.min(121, dy));

    // Encode according to DST format specification
    const x = Math.abs(dx);
    const y = Math.abs(dy);

    let b0 = y & 0x0F;
    let b1 = x & 0x0F;
    let b2 = ((y & 0xF0) >> 4) | ((x & 0xF0) >> 4);

    // Set sign bits
    if (dx < 0) b2 |= 0x20;
    if (dy < 0) b2 |= 0x40;

    // Set stitch type bits
    switch (type) {
      case 'jump':
        b2 |= 0x83;
        break;
      case 'stop':
        b2 |= 0xC3;
        break;
      case 'end':
        b2 |= 0xF3;
        break;
      default: // normal stitch
        b2 |= 0x03;
    }

    return [b0, b1, b2];
  }
}