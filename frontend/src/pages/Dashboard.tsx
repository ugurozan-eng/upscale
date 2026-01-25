import { useState, useCallback } from 'react';
import { Sparkles, Zap, Download, ArrowRight } from 'lucide-react';
import FileUploader from '../components/FileUploader';
import ProcessingAnimation from '../components/ProcessingAnimation';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import { uploadAndUpscale } from '../api/client';
import type { UpscaleJob } from '../types';

type ViewState = 'upload' | 'processing' | 'result' | 'error';

export default function Dashboard() {
  const [viewState, setViewState] = useState<ViewState>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<UpscaleJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputPreview, setInputPreview] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setInputPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleUpscale = useCallback(async () => {
    if (!selectedFile) return;
    setViewState('processing');
    setError(null);

    try {
      const response = await uploadAndUpscale(selectedFile);
      setResult(response);
      setViewState('result');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upscale image';
      setError(errorMessage);
      setViewState('error');
    }
  }, [selectedFile]);

  const handleReset = useCallback(() => {
    setViewState('upload');
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setInputPreview(null);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!result?.output_url) return;
    try {
      const response = await fetch(result.output_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `upscaled-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, [result]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-3">AI Image Upscaler</h1>
        <p className="text-dark-300 text-lg">Enhance your images with cutting-edge AI technology</p>
      </div>

      <div className="card">
        {viewState === 'upload' && (
          <div className="space-y-6">
            <FileUploader onFileSelect={handleFileSelect} disabled={false} />
            {selectedFile && (
              <button onClick={handleUpscale} className="btn-primary flex items-center justify-center space-x-2 w-full">
                <Sparkles className="w-5 h-5" />
                <span>Upscale Image</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-dark-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Fast Processing</p>
                  <p className="text-sm text-dark-400">~5 seconds</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent-500/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent-400" />
                </div>
                <div>
                  <p className="font-medium text-white">AI Enhanced</p>
                  <p className="text-sm text-dark-400">Recraft Crisp</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-white">High Quality</p>
                  <p className="text-sm text-dark-400">PNG Output</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewState === 'processing' && <ProcessingAnimation message="Upscaling your image..." />}

        {viewState === 'result' && result && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 font-medium">Enhancement Complete!</span>
            </div>
            {inputPreview && result.output_url && (
              <BeforeAfterSlider beforeImage={inputPreview} afterImage={result.output_url} />
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleDownload} className="btn-primary flex items-center justify-center space-x-2 flex-1">
                <Download className="w-5 h-5" />
                <span>Download HD Image</span>
              </button>
              <button onClick={handleReset} className="btn-secondary flex items-center justify-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>Upscale Another</span>
              </button>
            </div>
          </div>
        )}

        {viewState === 'error' && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <span className="text-3xl">😕</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Something went wrong</h3>
              <p className="text-dark-400 mt-2">{error}</p>
            </div>
            <button onClick={handleReset} className="btn-secondary">Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
}
