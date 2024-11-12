import { useState, useEffect } from 'react';
import { useDesign } from '../contexts/DesignContext';
import { EmbroideryConverter } from '../lib/embroidery/converter';
import { StitchPreview } from '../lib/embroidery/preview';
import { StitchOptimizer } from '../lib/embroidery/optimizer';
import { FormatConverter } from '../lib/embroidery/formats/converter';
import { Slider } from './ui/slider';
import type { EmbroideryFormat } from '../lib/embroidery/types';

const EXPORT_FORMATS: { id: EmbroideryFormat; label: string }[] = [
  { id: 'dst', label: 'Tajima DST' },
  { id: 'pes', label: 'Brother PES' },
  { id: 'jef', label: 'Janome JEF' },
  { id: 'exp', label: 'Melco EXP' },
  { id: 'vp3', label: 'Pfaff VP3' },
  { id: 'hus', label: 'Husqvarna Viking HUS' },
  { id: 'pat', label: 'Gammill Quilting PAT' },
  { id: 'qcc', label: "Quilter's Creative Touch QCC" }
];

export default function RightPanel() {
  const { 
    currentColor, 
    setCurrentColor, 
    fabricCanvas,
    exportArea
  } = useDesign();
  
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewSpeed, setPreviewSpeed] = useState(1);
  const [selectedFormat, setSelectedFormat] = useState<EmbroideryFormat>('dst');
  const [previewInstance, setPreviewInstance] = useState<StitchPreview | null>(null);
  const [pattern, setPattern] = useState<any>(null);
  const [stitchDensity, setStitchDensity] = useState(4.0);
  const [fillAngle, setFillAngle] = useState(0);
  const [useUnderlay, setUseUnderlay] = useState(true);
  const [pullCompensation, setPullCompensation] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handlePreview = async () => {
    if (!fabricCanvas || !exportArea) return;

    if (isPreviewing && previewInstance) {
      previewInstance.stop();
      setIsPreviewing(false);
      setPreviewInstance(null);
      return;
    }

    const imageData = fabricCanvas.getContext().getImageData(
      exportArea.left!,
      exportArea.top!,
      exportArea.width!,
      exportArea.height!
    );

    const settings = {
      density: stitchDensity,
      angle: fillAngle,
      underlay: useUnderlay,
      pullCompensation: pullCompensation / 100
    };

    const newPattern = EmbroideryConverter.convertImageToStitches(imageData, settings);
    const optimizedPattern = StitchOptimizer.optimizePattern(newPattern);
    setPattern(optimizedPattern);

    const preview = new StitchPreview(fabricCanvas, optimizedPattern);
    preview.setSpeed(previewSpeed);
    preview.start();
    
    setPreviewInstance(preview);
    setIsPreviewing(true);

    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
    setImagePreview(canvas.toDataURL());
  };

  const handleExport = async () => {
    if (!fabricCanvas || !exportArea || !pattern) return;

    try {
      setIsExporting(true);
      const formatData = FormatConverter.convertToFormat(pattern, selectedFormat);
      
      const blob = new Blob([formatData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `embroidery.${selectedFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export design. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="w-48 bg-figma-surface border-l border-figma-border flex flex-col">
      <div className="p-2 space-y-4">
        <div>
          <h3 className="text-xs font-medium text-figma-text mb-1">Color</h3>
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="w-full h-6 rounded cursor-pointer"
          />
        </div>

        {imagePreview && (
          <div>
            <h3 className="text-xs font-medium text-figma-text mb-1">Preview</h3>
            <img 
              src={imagePreview} 
              alt="Conversion preview" 
              className="w-full rounded border border-figma-border"
            />
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-xs font-medium text-figma-text">Export Settings</h3>
          
          <div>
            <label className="block text-xs text-figma-text-secondary mb-1">Format</label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as EmbroideryFormat)}
              className="w-full bg-figma-bg border border-figma-border rounded px-1 py-0.5 text-xs text-figma-text"
            >
              {EXPORT_FORMATS.map(format => (
                <option key={format.id} value={format.id}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-figma-text-secondary mb-1">
              Stitch Density
            </label>
            <Slider
              value={[stitchDensity]}
              onValueChange={([value]) => setStitchDensity(value)}
              min={1}
              max={10}
              step={0.1}
              className="mb-1"
            />
            <div className="text-xs text-figma-text-secondary text-right">
              {stitchDensity.toFixed(1)} st/mm
            </div>
          </div>

          <div>
            <label className="block text-xs text-figma-text-secondary mb-1">
              Fill Angle
            </label>
            <Slider
              value={[fillAngle]}
              onValueChange={([value]) => setFillAngle(value)}
              min={0}
              max={360}
              step={1}
              className="mb-1"
            />
            <div className="text-xs text-figma-text-secondary text-right">
              {fillAngle}°
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs text-figma-text">
              <input
                type="checkbox"
                checked={useUnderlay}
                onChange={(e) => setUseUnderlay(e.target.checked)}
                className="rounded border-figma-border bg-figma-bg"
              />
              Add underlay stitches
            </label>
          </div>

          <div>
            <label className="block text-xs text-figma-text-secondary mb-1">
              Pull Compensation
            </label>
            <Slider
              value={[pullCompensation]}
              onValueChange={([value]) => setPullCompensation(value)}
              min={0}
              max={100}
              step={1}
              className="mb-1"
            />
            <div className="text-xs text-figma-text-secondary text-right">
              {pullCompensation}%
            </div>
          </div>

          <div>
            <label className="block text-xs text-figma-text-secondary mb-1">
              Preview Speed
            </label>
            <Slider
              value={[previewSpeed]}
              onValueChange={([value]) => {
                setPreviewSpeed(value);
                if (previewInstance) {
                  previewInstance.setSpeed(value);
                }
              }}
              min={0.1}
              max={5}
              step={0.1}
              className="mb-1"
            />
            <div className="text-xs text-figma-text-secondary text-right">
              {previewSpeed.toFixed(1)}x
            </div>
          </div>

          <div className="flex gap-1 mt-4">
            <button
              onClick={handlePreview}
              className={`flex-1 px-2 py-1 rounded text-xs font-medium ${
                isPreviewing
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-figma-hover text-figma-text hover:bg-opacity-80'
              }`}
            >
              {isPreviewing ? 'Stop' : 'Preview'}
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || !pattern}
              className="flex-1 px-2 py-1 rounded text-xs font-medium bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}