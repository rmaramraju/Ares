
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Zap, ShieldCheck, RefreshCw, Scan, ArrowLeft, Upload } from 'lucide-react';
import { analyzePhysique } from './geminiService';
import ReactMarkdown from 'react-markdown';
import { HapticService } from './hapticService';

interface BiologicalScanProps {
  onClose: () => void;
}

export const BiologicalScan: React.FC<BiologicalScanProps> = ({ onClose }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MEDIA_API_UNAVAILABLE");
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access denied", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("PERMISSION_DENIED: Access to biometric sensors was rejected by the operator.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("SENSOR_NOT_FOUND: No compatible biometric imaging hardware detected.");
      } else {
        setError("CAMERA_ACCESS_DENIED: Biometric sensors offline. Check system authorization.");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      HapticService.impactHeavy();
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        setCapturedImage(base64);
        stopCamera();
        performAnalysis(base64);
      }
    }
  };

  const performAnalysis = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzePhysique(base64);
      setAnalysisResult(result);
      HapticService.notificationSuccess();
    } catch (err) {
      setError("ANALYSIS_FAILED: Neural link timeout.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64 = result.split(',')[1];
        setCapturedImage(base64);
        stopCamera();
        performAnalysis(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setError(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col animate-in fade-in duration-500 overflow-hidden">
      <header className="p-8 flex items-center justify-between bg-black/50 backdrop-blur-xl border-b border-white/5 pt-16">
        <div className="flex items-center gap-5">
          <button onClick={onClose} className="p-3 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-[10px] text-gold font-bold uppercase tracking-[0.4em]">Biometric Lab</p>
            <h2 className="text-2xl font-light tracking-tight uppercase">Biological Scan</h2>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
          <Scan size={20} className="text-gold animate-pulse" />
        </div>
      </header>

      <div className="flex-1 relative flex flex-col items-center justify-center p-6">
        {!capturedImage && !error && (
          <div className="relative w-full max-w-sm aspect-[3/4] rounded-[48px] overflow-hidden border border-white/10 shadow-2xl bg-zinc-900">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover grayscale opacity-60"
            />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-10 border-2 border-gold/20 rounded-[32px]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gold/40 shadow-[0_0_15px_rgba(212,175,55,0.5)] animate-scan" />
              </div>
              <div className="absolute top-4 left-4 text-[8px] font-black text-gold/40 uppercase tracking-widest">Sensor Active</div>
              <div className="absolute bottom-4 right-4 text-[8px] font-black text-gold/40 uppercase tracking-widest">Ares v4.2</div>
            </div>
            <button 
              onClick={captureFrame}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center group active:scale-90 transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-white group-hover:bg-gold transition-colors" />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-12 right-10 p-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <Upload size={20} />
            </button>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center gap-8 animate-in zoom-in-95 duration-500">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 border-4 border-gold/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap size={32} className="text-gold animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold uppercase tracking-widest">Analyzing Biometrics</h3>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.4em]">Synthesizing structural data...</p>
            </div>
          </div>
        )}

        {analysisResult && (
          <div className="w-full max-w-md bg-zinc-950/50 border border-white/5 rounded-[40px] p-8 overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-4 duration-700 max-h-[70vh]">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-gold/10 rounded-xl border border-gold/20">
                <ShieldCheck size={20} className="text-gold" />
              </div>
              <div>
                <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Analysis Verified</p>
                <h4 className="text-sm font-bold uppercase tracking-widest">Protocol Insights</h4>
              </div>
            </div>
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="text-zinc-400 text-xs leading-relaxed uppercase tracking-tight">
                <ReactMarkdown>{analysisResult}</ReactMarkdown>
              </div>
            </div>
            <button 
              onClick={reset}
              className="w-full mt-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3"
            >
              <RefreshCw size={14} /> New Scan
            </button>
          </div>
        )}

        {error && (
          <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto border border-gold/20">
              <X size={32} className="text-gold" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold uppercase text-gold tracking-widest">System Error</h3>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest px-12">{error}</p>
              <p className="text-[8px] text-zinc-700 uppercase tracking-widest mt-2">Try uploading a photo instead</p>
            </div>
            <div className="flex gap-4">
              <button onClick={reset} className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">Retry Handshake</button>
              <button onClick={() => fileInputRef.current?.click()} className="px-8 py-4 bg-gold/10 border border-gold/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-gold hover:bg-gold/20 transition-all flex items-center gap-2">
                <Upload size={14} /> Upload Image
              </button>
            </div>
          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileUpload} 
      />
      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
};
