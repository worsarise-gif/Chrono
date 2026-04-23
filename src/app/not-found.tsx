import Link from 'next/link';
import { Home } from 'lucide-react';
import StarryBackground from '../components/StarryBackground';
import { PlanetLogo } from '../components/PlanetLogo';

export default function NotFound() {
  return (
    <div className="flex h-[100dvh] w-full relative items-center justify-center bg-background text-foreground overflow-hidden">
      <StarryBackground />
      <div className="relative z-10 flex flex-col items-center p-8 bg-surface/80 backdrop-blur-md border border-border/50 rounded-[32px] shadow-2xl max-w-md text-center mx-4">
        <PlanetLogo className="text-black dark:text-white mb-6 transform scale-150" />
        <h1 className="text-7xl font-bold text-foreground mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl font-medium hover:opacity-90 transition-opacity w-full justify-center"
        >
          <Home size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
