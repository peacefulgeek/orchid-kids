import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const location = useLocation();
  const isArticle = location.pathname.startsWith('/articles/');

  useEffect(() => {
    if (!isArticle) {
      setProgress(0);
      return;
    }

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
    return () => window.removeEventListener('scroll', updateProgress);
  }, [isArticle, location.pathname]);

  if (!isArticle) return null;

  return (
    <div
      className="reading-progress"
      style={{ width: `${progress}%` }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    />
  );
}
