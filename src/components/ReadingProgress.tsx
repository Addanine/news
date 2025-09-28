"use client";

import { useEffect, useState } from "react";

interface ReadingProgressProps {
  targetSelector?: string;
}

export function ReadingProgress({ targetSelector = "#article-content" }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const target = document.querySelector<HTMLElement>(targetSelector);
    if (!target) {
      setProgress(0);
      return;
    }

    const calculateProgress = () => {
      const targetTop = target.getBoundingClientRect().top + window.scrollY;
      const targetHeight = target.offsetHeight;
      const viewportHeight = window.innerHeight;

      const distance = targetHeight - viewportHeight;
      if (distance <= 0) {
        setProgress(100);
        return;
      }

      const scrolled = window.scrollY - targetTop;
      const ratio = Math.min(Math.max(scrolled / distance, 0), 1);
      setProgress(Math.round(ratio * 100));
    };

    calculateProgress();

    window.addEventListener("scroll", calculateProgress, { passive: true });
    window.addEventListener("resize", calculateProgress);

    return () => {
      window.removeEventListener("scroll", calculateProgress);
      window.removeEventListener("resize", calculateProgress);
    };
  }, [targetSelector]);

  return (
    <div className="sticky top-0 z-30 h-1 w-full bg-gray-200 dark:bg-gray-800">
      <div
        className="h-full bg-black transition-all duration-150 ease-out dark:bg-gray-100"
        style={{ width: `${progress}%` }}
        aria-hidden
      />
    </div>
  );
}
