import { Clock } from 'lucide-react';

export default function History() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">History</h1>
        <p className="text-dark-400 mt-1">Your recent upscale jobs</p>
      </div>

      <div className="card text-center py-16">
        <Clock className="w-16 h-16 text-dark-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No history yet</h3>
        <p className="text-dark-400">Your upscaled images will appear here</p>
      </div>
    </div>
  );
}
