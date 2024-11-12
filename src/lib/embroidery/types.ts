export interface Point {
  x: number;
  y: number;
}

export interface StitchPoint extends Point {
  type: 'normal' | 'jump' | 'trim' | 'stop' | 'end';
  color: string;
}

export interface ProcessingSettings {
  width: number;
  height: number;
  density: number;
  edgeThreshold: number;
  angle: number;
  underlay: boolean;
  pullCompensation: number;
  color: string;
}

export interface StitchPattern {
  stitches: StitchPoint[];
  colors: string[];
  dimensions: {
    width: number;
    height: number;
  };
  metadata: {
    name: string;
    date: string;
    format: string;
  };
}

export class ProcessingError extends Error {
  originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = 'ProcessingError';
    this.originalError = originalError;
  }
}