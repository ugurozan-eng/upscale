import { Link, useLocation } from 'react-router-dom';
import { Sparkles, History, Settings, Coins } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCredits } from '../api/client';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const data = await getCredits();
        setCredits(data.credits);
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      }
    };
    fetchCredits();
  }, [location.pathname]);

  const navItems = [
    { path: '/', icon: Sparkles, label: 'Upscale' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">UpscaleAI</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-dark-300 hover:text-white hover:bg-dark-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Credits */}
            <div className="flex items-center space-x-2 bg-dark-800 border border-dark-600 rounded-full px-4 py-2">
              <Coins className="w-5 h-5 text-accent-400" />
              <span className="font-semibold text-accent-400">{credits}</span>
              <span className="text-dark-400 text-sm">credits</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-20 md:pb-8 min-h-screen">
        {children}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-800/90 backdrop-blur-lg border-t border-dark-700 px-6 py-3">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center space-y-1 ${
                  isActive ? 'text-primary-400' : 'text-dark-400'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
