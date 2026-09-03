import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// The header is transparent-over-hero only on the homepage before scrolling;
// every other page (and any scroll past the hero) gets solid styling.
export function useScrolledHeaderStyles() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isSolid = isScrolled || location.pathname !== '/';

  return {
    isSolid,
    headerClassName: isSolid ? 'bg-card/95 backdrop-blur-md shadow-md' : 'bg-transparent',
    textClassName: isSolid ? 'text-foreground' : 'text-card',
    iconButtonClassName: isSolid ? '' : 'text-card hover:bg-card/10',
    outlineButtonVariant: (isSolid ? 'ghost' : 'heroOutline') as 'ghost' | 'heroOutline',
    primaryButtonVariant: (isSolid ? 'default' : 'hero') as 'default' | 'hero',
  };
}
