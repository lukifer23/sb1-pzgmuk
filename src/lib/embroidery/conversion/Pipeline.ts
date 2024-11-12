import { ProcessingError } from '../types';
import type { ConversionStep, ConversionContext } from './types';

export class ConversionPipeline {
  private steps: ConversionStep[] = [];

  addStep(step: ConversionStep): this {
    this.steps.push(step);
    return this;
  }

  async execute(context: ConversionContext): Promise<ConversionContext> {
    let currentContext = { ...context };

    try {
      for (const step of this.steps) {
        currentContext = await step.execute(currentContext);
        
        if (currentContext.progress) {
          currentContext.onProgress?.(
            currentContext.progress.stage,
            currentContext.progress.percent
          );
        }
      }

      return currentContext;
    } catch (error) {
      if (error instanceof ProcessingError) {
        throw error;
      }
      throw new ProcessingError('Pipeline execution failed', error as Error);
    }
  }
}