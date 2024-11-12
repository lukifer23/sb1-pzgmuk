import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FormatConverter } from '../lib/embroidery/formats/converter';
import type { StitchPattern } from '../lib/embroidery/types';

interface ConversionResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pattern: StitchPattern | null;
  onUpdateSettings: () => void;
  conversionError?: Error | null;
}

export default function ConversionResultsDialog({
  open,
  onOpenChange,
  pattern,
  onUpdateSettings,
  conversionError
}: ConversionResultsDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState('dst');
  const [isExporting, setIsExporting] = useState(false);
  const [fileName, setFileName] = useState('embroidery');
  const [exportError, setExportError] = useState<Error | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!pattern || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 600;
    canvas.height = 400;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate scale to fit pattern
    const padding = 40;
    const scale = Math.min(
      (canvas.width - padding * 2) / pattern.dimensions.width,
      (canvas.height - padding * 2) / pattern.dimensions.height
    );

    // Center pattern
    const offsetX = (canvas.width - pattern.dimensions.width * scale) / 2;
    const offsetY = (canvas.height - pattern.dimensions.height * scale) / 2;

    // Draw background grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    const gridSize = 10 * scale;
    
    for (let x = offsetX; x < canvas.width - offsetX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();
    }
    
    for (let y = offsetY; y < canvas.height - offsetY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Draw stitches
    let lastPoint = null;
    ctx.strokeStyle = pattern.colors[0];
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    pattern.stitches.forEach((stitch) => {
      const x = stitch.x * scale + offsetX;
      const y = stitch.y * scale + offsetY;

      if (lastPoint && stitch.type === 'normal') {
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      // Draw stitch points
      if (stitch.type === 'normal') {
        ctx.fillStyle = stitch.color;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      lastPoint = { x, y };
    });

  }, [pattern]);

  const handleExport = async () => {
    if (!pattern) return;

    try {
      setIsExporting(true);
      setExportError(null);
      const formatData = await FormatConverter.convertToFormat(pattern, selectedFormat);
      
      const blob = new Blob([formatData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.${selectedFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      setExportError(error instanceof Error ? error : new Error('Export failed'));
    } finally {
      setIsExporting(false);
    }
  };

  if (!pattern) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-figma-surface p-6 rounded-lg shadow-xl w-[800px]">
          <Dialog.Title className="text-xl font-medium text-figma-text mb-4">
            Conversion Results
          </Dialog.Title>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-figma-text mb-2">Pattern Preview</h3>
              <canvas
                ref={canvasRef}
                className="border border-figma-border rounded bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-figma-text mb-2">Pattern Details</h3>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-figma-text-secondary">Stitch Count:</dt>
                    <dd className="text-figma-text">{pattern.stitches.length.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-figma-text-secondary">Colors Used:</dt>
                    <dd className="text-figma-text">{pattern.colors.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-figma-text-secondary">Size:</dt>
                    <dd className="text-figma-text">
                      {pattern.dimensions.width.toFixed(1)} × {pattern.dimensions.height.toFixed(1)} mm
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-figma-text-secondary">Estimated Time:</dt>
                    <dd className="text-figma-text">
                      {Math.ceil((pattern.stitches.length / 800) * 60)} minutes
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-sm font-medium text-figma-text mb-2">Export Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-figma-text-secondary mb-1">
                      File Name
                    </label>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="w-full bg-figma-bg border border-figma-border rounded px-2 py-1.5 text-sm text-figma-text"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-figma-text-secondary mb-1">
                      Format
                    </label>
                    <select
                      value={selectedFormat}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      className="w-full bg-figma-bg border border-figma-border rounded px-2 py-1.5 text-sm text-figma-text"
                    >
                      <option value="dst">Tajima DST</option>
                      <option value="pes">Brother PES</option>
                      <option value="jef">Janome JEF</option>
                      <option value="exp">Melco EXP</option>
                      <option value="vp3">Pfaff VP3</option>
                      <option value="hus">Husqvarna Viking HUS</option>
                      <option value="pat">Gammill Quilting PAT</option>
                      <option value="qcc">Quilter's Creative Touch QCC</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={onUpdateSettings}
                      className="px-4 py-2 text-sm text-figma-text-secondary hover:text-figma-text bg-figma-hover rounded"
                    >
                      Update Settings
                    </button>
                    <button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExporting ? 'Exporting...' : 'Export Pattern'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {(conversionError || exportError) && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded">
                <h4 className="text-sm font-medium text-red-500 mb-1">Error Details</h4>
                <p className="text-sm text-red-400">
                  {conversionError?.message || exportError?.message}
                </p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}