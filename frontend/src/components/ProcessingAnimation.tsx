import { Sparkles } from 'lucide-react';

interface ProcessingAnimationProps {
  message?: string;
}

export default function ProcessingAnimation({ message = 'Enhancing your image...' }: ProcessingAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="relative">
        <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl flex items-center justify-center animate-pulse">
          <Sparkles className="w-12 h-12 text-white animate-spin-slow" />
        </div>
        <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '3s' }}>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent-400 rounded-full" />
        </div>
        <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
          <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-2 h-2 bg-primary-300 rounded-full" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-xl font-semibold text-white">{message}</p>
        <p className="text-dark-400 mt-2">This usually takes 5-10 seconds</p>
      </div>
      <div className="w-64 h-2 bg-dark-700 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 animate-shimmer" style={{ width: '100%' }} />
      </div>
    </div>
  );
}
