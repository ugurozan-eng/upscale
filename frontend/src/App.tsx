import React, { useState, useRef, useEffect } from 'react';
import { Upload, Sparkles, Download, History, Home, ArrowLeft, Play, ZoomIn, ZoomOut, Maximize2, Check, X, User, CreditCard, Info } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface UploadedFile {
  name: string;
  size: string;
  preview: string;
  file: File;
}

interface Model {
  name: string;
  description: string;
  credits: number;
  scale: string;
  speed: string;
  available: boolean;
  badge: string;
  showcase: {
    before: string;
    after: string;
  };
  features: string[];
}

interface HistoryItem {
  id: number;
  name: string;
  model: string;
  date: string;
  thumbnail: string;
  outputUrl?: string;
}

const models: Record<string, Model> = {
  'recraft-crisp-4x': {
    name: 'Recraft Crisp 4x',
    description: 'Perfect for portraits and detailed images',
    credits: 5,
    scale: '4x',
    speed: '~4 seconds',
    available: true,
    badge: '⭐ Most Popular',
    showcase: {
      before: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=50',
      after: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=95'
    },
    features: ['Best for faces', 'Sharp details', 'Natural colors']
  },
  'recraft-crisp-8x': {
    name: 'Recraft Crisp 8x',
    description: 'Ultra-high resolution upscaling',
    credits: 10,
    scale: '8x',
    speed: '~8 seconds',
    available: true,
    badge: '🚀 Ultra HD',
    showcase: {
      before: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=50',
      after: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=95'
    },
    features: ['Maximum quality', 'Print ready', 'Huge resolution']
  },
  'real-esrgan-10x': {
    name: 'RealESRGAN 10x',
    description: 'General purpose super resolution',
    credits: 8,
    scale: '10x',
    speed: '~6 seconds',
    available: true,
    badge: '💎 Pro',
    showcase: {
      before: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=50',
      after: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=95'
    },
    features: ['10x scale', 'Versatile', 'Fast processing']
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'processing' | 'result' | 'history'>('dashboard');
  const [selectedModel, setSelectedModel] = useState<string>('recraft-crisp-4x');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [userCredits, setUserCredits] = useState(42);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showModelPreview, setShowModelPreview] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{ inputUrl: string; outputUrl: string } | null>(null);
  const [error, setError] = useState<string>('');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('upscaleHistory');
    if (saved) {
      try {
        setHistoryItems(JSON.parse(saved));
      } catch {
        console.error('Failed to load history');
      }
    }
  }, []);

  // Fetch user credits
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/credits`)
      .then(res => res.json())
      .then(data => setUserCredits(data.credits || 42))
      .catch(() => setUserCredits(42));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setError('');
      setUploadedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        preview: URL.createObjectURL(file),
        file
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setError('');
      setUploadedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        preview: URL.createObjectURL(file),
        file
      });
    }
  };

  const handleUpscale = async () => {
    if (!uploadedFile) return;

    setCurrentView('processing');
    setProcessingProgress(0);
    setError('');

    try {
      // Check if mock mode
      const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';

      if (isMockMode) {
        // Mock processing
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 300));
          setProcessingProgress(i);
        }

        setResultData({
          inputUrl: uploadedFile.preview,
          outputUrl: uploadedFile.preview // In mock mode, use same image
        });
        setCurrentView('result');
      } else {
        // Real API call
        const formData = new FormData();
        formData.append('file', uploadedFile.file);

        setProcessingProgress(10);

        const uploadResponse = await fetch(`${API_BASE_URL}/api/test/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        const uploadData = await uploadResponse.json();
        const jobId = uploadData.job_id;
        const inputUrl = uploadData.input_url;

        setProcessingProgress(30);

        // Poll for completion
        let completed = false;
        let attempts = 0;
        const maxAttempts = 120;

        while (!completed && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;

          const statusResponse = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`);
          if (!statusResponse.ok) continue;

          const jobData = await statusResponse.json();
          setProcessingProgress(30 + Math.min((attempts / maxAttempts) * 60, 60));

          if (jobData.status === 'completed') {
            completed = true;
            const outputUrl = jobData.output_url || inputUrl;

            setResultData({ inputUrl, outputUrl });

            // Save to history
            const newItem: HistoryItem = {
              id: Date.now(),
              name: uploadedFile.name,
              model: models[selectedModel].name,
              date: 'Just now',
              thumbnail: inputUrl,
              outputUrl
            };
            const newHistory = [newItem, ...historyItems].slice(0, 20);
            setHistoryItems(newHistory);
            localStorage.setItem('upscaleHistory', JSON.stringify(newHistory));

            setProcessingProgress(100);
            setCurrentView('result');
          } else if (jobData.status === 'failed') {
            throw new Error(jobData.error_message || 'Processing failed');
          }
        }

        if (!completed) {
          throw new Error('Processing timeout');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCurrentView('dashboard');
    }
  };

  const handleDownload = async () => {
    if (!resultData?.outputUrl) return;

    try {
      const response = await fetch(resultData.outputUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `upscaled-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError('Failed to download image');
    }
  };

  const handleSliderMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  useEffect(() => {
    if (isDragging) {
      const handleMouseUp = () => setIsDragging(false);
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);

  // Fullscreen Modal Component
  const FullscreenModal = () => (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <button
        onClick={() => setIsFullscreen(false)}
        className="absolute top-4 right-4 p-3 bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full h-full flex items-center justify-center">
        <div className="w-full max-w-7xl h-[90vh] relative">
          <div
            ref={sliderRef}
            className="w-full h-full relative cursor-col-resize select-none rounded-xl overflow-hidden"
            onMouseMove={handleSliderMove}
          >
            <img
              src={resultData?.outputUrl || uploadedFile?.preview}
              alt="After"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ transform: `scale(${zoom})` }}
              draggable={false}
            />
            <div className="absolute top-6 right-6 px-4 py-2 bg-teal-500 rounded-full text-sm font-semibold shadow-2xl">
              UPSCALED {models[selectedModel].scale}
            </div>

            <div
              className="absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={resultData?.inputUrl || uploadedFile?.preview}
                alt="Before"
                className="w-full h-full object-contain"
                style={{ transform: `scale(${zoom})` }}
                draggable={false}
              />
              <div className="absolute top-6 left-6 px-4 py-2 bg-slate-600 rounded-full text-sm font-semibold shadow-2xl">
                ORIGINAL
              </div>
            </div>

            <div
              className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-400"
              style={{ left: `${sliderPosition}%` }}
              onMouseDown={() => setIsDragging(true)}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-amber-500 rounded-full shadow-2xl shadow-amber-500/50 border-4 border-white flex items-center justify-center cursor-col-resize">
                <div className="flex gap-1.5">
                  <div className="w-0.5 h-5 bg-white rounded"></div>
                  <div className="w-0.5 h-5 bg-white rounded"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 bg-slate-800/90 rounded-full">
            <button onClick={() => setZoom(Math.max(zoom - 0.25, 1))} disabled={zoom <= 1} className="p-2 hover:bg-slate-700 rounded disabled:opacity-40">
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold w-16 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(zoom + 0.25, 3))} disabled={zoom >= 3} className="p-2 hover:bg-slate-700 rounded disabled:opacity-40">
              <ZoomIn className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-slate-600"></div>
            <button onClick={() => setZoom(1)} className="p-2 hover:bg-slate-700 rounded">
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Model Preview Modal
  const ModelPreviewModal = ({ modelKey }: { modelKey: string }) => {
    const model = models[modelKey];
    const [previewSlider, setPreviewSlider] = useState(50);

    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowModelPreview(null)}>
        <div className="bg-slate-900 rounded-2xl max-w-3xl w-full p-8 border border-teal-800/30" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">{model.name}</h3>
              <p className="text-slate-400">{model.description}</p>
            </div>
            <button onClick={() => setShowModelPreview(null)} className="p-2 hover:bg-slate-800 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div
            className="relative aspect-video rounded-xl overflow-hidden mb-6 cursor-col-resize"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              setPreviewSlider((x / rect.width) * 100);
            }}
          >
            <img src={model.showcase.after} alt="After" className="w-full h-full object-cover" />
            <div className="absolute top-4 right-4 px-3 py-1 bg-teal-500 rounded-full text-xs font-semibold">
              ENHANCED
            </div>

            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - previewSlider}% 0 0)` }}>
              <img src={model.showcase.before} alt="Before" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 px-3 py-1 bg-slate-600 rounded-full text-xs font-semibold">
                ORIGINAL
              </div>
            </div>

            <div className="absolute top-0 bottom-0 w-1 bg-amber-500" style={{ left: `${previewSlider}%` }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-amber-500 rounded-full border-4 border-white"></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Scale</div>
              <div className="text-xl font-bold text-amber-400">{model.scale}</div>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Speed</div>
              <div className="text-xl font-bold">{model.speed}</div>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Credits</div>
              <div className="text-xl font-bold text-teal-400">{model.credits}</div>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Status</div>
              <div className="text-xl font-bold text-green-400">Available</div>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {model.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-300">
                <Check className="w-4 h-4 text-teal-400" />
                {feature}
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setSelectedModel(modelKey);
              setShowModelPreview(null);
            }}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-lg font-semibold transition-all"
          >
            Select This Model
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white">
      {/* Modals */}
      {isFullscreen && <FullscreenModal />}
      {showModelPreview && <ModelPreviewModal modelKey={showModelPreview} />}

      {/* Top Navigation */}
      <nav className="border-b border-teal-800/30 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-amber-400 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-amber-400">
                  UpscaleAI
                </h1>
                <p className="text-xs text-slate-400">AI-Powered Enhancement</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-teal-900/50 text-teal-400' : 'hover:bg-slate-800'}`}
              >
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium">Dashboard</span>
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${currentView === 'history' ? 'bg-teal-900/50 text-teal-400' : 'hover:bg-slate-800'}`}
              >
                <History className="w-4 h-4" />
                <span className="text-sm font-medium">History</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-900/30 to-amber-800/30 border border-amber-700/50 rounded-lg">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-400">{userCredits} Credits</span>
              </div>

              <button className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center hover:ring-2 ring-teal-400 transition-all">
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="p-1 hover:bg-red-800/50 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div className="space-y-8">
            <div className="text-center space-y-4 py-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-900/30 border border-teal-700/50 rounded-full text-sm text-teal-400 mb-4">
                <Sparkles className="w-4 h-4" />
                AI-Powered Image Enhancement
              </div>
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-300 to-amber-400">
                Transform Your Images
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                Professional upscaling up to 10x resolution. Choose your model, upload, and enhance.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Upload Zone */}
                {!uploadedFile ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-teal-700/50 rounded-xl p-12 text-center bg-slate-800/30 hover:border-teal-500/50 hover:bg-slate-800/50 transition-all cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-teal-900/30 rounded-full flex items-center justify-center">
                        <Upload className="w-10 h-10 text-teal-400" />
                      </div>
                      <div>
                        <p className="text-xl font-semibold mb-2">Drop your image here</p>
                        <p className="text-slate-400">or click to browse</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>PNG, JPG, WebP</span>
                        <span>•</span>
                        <span>Up to 10MB</span>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="bg-slate-800/50 border border-teal-800/30 rounded-xl p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-24 bg-slate-900 rounded-lg overflow-hidden">
                          <img src={uploadedFile.preview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{uploadedFile.name}</h3>
                          <p className="text-sm text-slate-400">{uploadedFile.size}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                            <span className="text-sm text-teal-400">Ready to upscale</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setUploadedFile(null)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      onClick={handleUpscale}
                      className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-lg font-semibold text-lg transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 flex items-center justify-center gap-2"
                    >
                      <Play className="w-5 h-5" />
                      Start Upscaling ({models[selectedModel].credits} credits)
                    </button>
                  </div>
                )}

                {/* Model Selection */}
                <div className="bg-slate-800/50 border border-teal-800/30 rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-400" />
                    Select AI Model
                  </h3>
                  <div className="grid gap-3">
                    {Object.entries(models).map(([key, model]) => (
                      <div
                        key={key}
                        onClick={() => setSelectedModel(key)}
                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          selectedModel === key
                            ? 'border-teal-500 bg-teal-900/30'
                            : 'border-slate-700 bg-slate-900/30 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowModelPreview(key); }}
                            className="flex gap-2 flex-shrink-0 group/preview"
                          >
                            <div className="w-16 h-16 rounded overflow-hidden relative">
                              <img src={model.showcase.before} alt="Before" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                                <Info className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div className="w-16 h-16 rounded overflow-hidden relative">
                              <img src={model.showcase.after} alt="After" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                                <Info className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          </button>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{model.name}</span>
                              {model.badge && (
                                <span className="text-xs px-2 py-0.5 bg-amber-900/30 border border-amber-700/50 rounded text-amber-400">
                                  {model.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-400 mb-2">{model.description}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-amber-400 font-semibold">{model.credits} credits</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400">{model.scale}</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400">{model.speed}</span>
                            </div>
                          </div>

                          {selectedModel === key && (
                            <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/20 border border-amber-700/50 rounded-xl p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold text-amber-400 mb-2">Need More Credits?</h3>
                    <p className="text-sm text-amber-200/70">Upgrade to Pro for 500 credits/month</p>
                  </div>
                  <button className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Upgrade Now
                  </button>
                </div>

                {historyItems.length > 0 && (
                  <div className="bg-slate-800/50 border border-teal-800/30 rounded-xl p-6">
                    <h3 className="font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {historyItems.slice(0, 3).map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-slate-700/30 rounded-lg transition-colors cursor-pointer">
                          <div className="w-10 h-10 bg-slate-900 rounded overflow-hidden">
                            <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-slate-400">{item.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Processing View */}
        {currentView === 'processing' && (
          <div className="max-w-2xl mx-auto text-center space-y-8 py-16">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-teal-500 to-amber-500 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-16 h-16 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Enhancing Your Image</h2>
              <p className="text-slate-400">Using {models[selectedModel].name}</p>
            </div>
            <div className="space-y-3">
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-amber-500 transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-slate-400">{processingProgress}% Complete</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {[
                { label: 'Analyzing', threshold: 33 },
                { label: 'Enhancing', threshold: 66 },
                { label: 'Finalizing', threshold: 100 }
              ].map((step, i) => (
                <div key={i} className="p-4 bg-slate-800/50 rounded-lg">
                  <div className={`w-6 h-6 mx-auto mb-2 ${processingProgress >= step.threshold ? 'text-teal-400' : 'text-slate-600'}`}>
                    <Check className="w-6 h-6" />
                  </div>
                  <p className={processingProgress >= step.threshold ? 'text-white' : 'text-slate-600'}>{step.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result View */}
        {currentView === 'result' && resultData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setCurrentView('dashboard'); setUploadedFile(null); setResultData(null); }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-lg font-medium transition-all shadow-lg"
              >
                <Download className="w-5 h-5" />
                Download HD
              </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-800/50 border border-teal-800/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Before / After Comparison</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setZoom(Math.max(zoom - 0.25, 1))} disabled={zoom <= 1} className="p-2 hover:bg-slate-700 rounded disabled:opacity-40">
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(Math.min(zoom + 0.25, 3))} disabled={zoom >= 3} className="p-2 hover:bg-slate-700 rounded disabled:opacity-40">
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsFullscreen(true)} className="p-2 hover:bg-slate-700 rounded">
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div
                  ref={sliderRef}
                  className="relative h-[600px] bg-slate-900 rounded-lg overflow-hidden cursor-col-resize select-none"
                  onMouseMove={handleSliderMove}
                  onClick={() => setIsFullscreen(true)}
                >
                  <img
                    src={resultData.outputUrl}
                    alt="After"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                    draggable={false}
                  />
                  <div className="absolute top-4 right-4 px-3 py-1 bg-teal-500 rounded-full text-xs font-semibold shadow-lg">
                    UPSCALED {models[selectedModel].scale}
                  </div>

                  <div
                    className="absolute inset-0"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <img
                      src={resultData.inputUrl}
                      alt="Before"
                      className="w-full h-full object-contain"
                      style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                      draggable={false}
                    />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-slate-600 rounded-full text-xs font-semibold shadow-lg">
                      ORIGINAL
                    </div>
                  </div>

                  <div
                    className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-400 cursor-col-resize"
                    style={{ left: `${sliderPosition}%` }}
                    onMouseDown={(e) => { e.stopPropagation(); setIsDragging(true); }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-amber-500 rounded-full shadow-2xl shadow-amber-500/50 border-4 border-white flex items-center justify-center cursor-col-resize">
                      <div className="flex gap-1">
                        <div className="w-0.5 h-4 bg-white rounded"></div>
                        <div className="w-0.5 h-4 bg-white rounded"></div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 rounded-full text-xs text-slate-300">
                    Click to view fullscreen
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/50 border border-teal-800/30 rounded-xl p-5">
                  <h3 className="font-semibold mb-4 text-teal-400">Enhancement Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Model</span>
                      <span className="font-medium">{models[selectedModel].name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Scale</span>
                      <span className="font-medium text-amber-400">{models[selectedModel].scale}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Credits Used</span>
                      <span className="font-medium">{models[selectedModel].credits}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setResultData(null);
                    setCurrentView('dashboard');
                  }}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 rounded-lg font-medium transition-colors"
                >
                  Upscale Another Image
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History View */}
        {currentView === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Enhancement History</h2>
              {historyItems.length > 0 && (
                <button
                  onClick={() => {
                    setHistoryItems([]);
                    localStorage.removeItem('upscaleHistory');
                  }}
                  className="px-4 py-2 border border-slate-600 hover:border-red-500 hover:bg-red-900/20 rounded-lg transition-colors text-sm"
                >
                  Clear All
                </button>
              )}
            </div>

            {historyItems.length === 0 ? (
              <div className="text-center py-16">
                <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No history yet</h3>
                <p className="text-slate-400 mb-6">Your upscaled images will appear here</p>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 rounded-lg font-medium transition-colors"
                >
                  Start Upscaling
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {historyItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-slate-800/50 border border-teal-800/30 rounded-xl overflow-hidden hover:border-teal-700 transition-all cursor-pointer group"
                    onClick={() => {
                      if (item.outputUrl) {
                        setResultData({ inputUrl: item.thumbnail, outputUrl: item.outputUrl });
                        setCurrentView('result');
                      }
                    }}
                  >
                    <div className="aspect-video bg-slate-900 relative overflow-hidden">
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <button className="w-full py-2 bg-teal-600 hover:bg-teal-700 rounded-lg font-medium transition-colors">
                          View Result
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1 truncate">{item.name}</h3>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{item.model}</span>
                        <span className="text-slate-500">{item.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
