"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type FontSizeOption = "small" | "medium" | "large" | "xlarge";
export type FontFamilyOption = "sans" | "serif" | "dyslexic";
export type LineSpacingOption = "normal" | "relaxed" | "loose";
export type ContentWidthOption = "narrow" | "comfortable" | "wide";
export type ReadingSpeedOption = "slow" | "average" | "fast";

export interface ReadingPreferences {
  fontSize: FontSizeOption;
  fontFamily: FontFamilyOption;
  lineSpacing: LineSpacingOption;
  contentWidth: ContentWidthOption;
  readingSpeed: ReadingSpeedOption;
}

interface ReadingPreferencesContextValue {
  preferences: ReadingPreferences;
  updatePreference: <K extends keyof ReadingPreferences>(key: K, value: ReadingPreferences[K]) => void;
  reset: () => void;
  mounted: boolean;
}

const STORAGE_KEY = "reading_preferences_v1";

const DEFAULT_PREFERENCES: ReadingPreferences = {
  fontSize: "medium",
  fontFamily: "sans",
  lineSpacing: "relaxed",
  contentWidth: "comfortable",
  readingSpeed: "average",
};

const ReadingPreferencesContext = createContext<ReadingPreferencesContextValue | undefined>(undefined);

function mergePreferences(stored: Partial<ReadingPreferences> | null): ReadingPreferences {
  if (!stored) return DEFAULT_PREFERENCES;
  return {
    ...DEFAULT_PREFERENCES,
    ...stored,
  };
}

export function ReadingPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<ReadingPreferences>(DEFAULT_PREFERENCES);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ReadingPreferences>;
        setPreferences(mergePreferences(parsed));
      }
    } catch (error) {
      console.error("Failed to load reading preferences", error);
    } finally {
      setMounted(true);
    }
  }, []);

  const updatePreference = <K extends keyof ReadingPreferences>(key: K, value: ReadingPreferences[K]) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.error("Failed to persist reading preferences", error);
      }
      return next;
    });
  };

  const reset = () => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
    } catch (error) {
      console.error("Failed to reset reading preferences", error);
    }
  };

  const value = useMemo<ReadingPreferencesContextValue>(() => ({
    preferences,
    updatePreference,
    reset,
    mounted,
  }), [preferences, mounted]);

  return (
    <ReadingPreferencesContext.Provider value={value}>
      {children}
    </ReadingPreferencesContext.Provider>
  );
}

export function useReadingPreferences() {
  const context = useContext(ReadingPreferencesContext);
  if (!context) {
    throw new Error("useReadingPreferences must be used within a ReadingPreferencesProvider");
  }
  return context;
}

const fontSizeMultiplier: Record<FontSizeOption, number> = {
  small: 0.94,
  medium: 1,
  large: 1.12,
  xlarge: 1.28,
};

const lineHeightValue: Record<LineSpacingOption, number> = {
  normal: 1.5,
  relaxed: 1.7,
  loose: 1.85,
};

const contentWidthValue: Record<ContentWidthOption, number> = {
  narrow: 640,
  comfortable: 760,
  wide: 900,
};

const fontFamilyValue: Record<FontFamilyOption, string> = {
  sans: "var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  serif: "'Georgia', 'Iowan Old Style', 'Palatino', 'Times New Roman', serif",
  dyslexic: "'Atkinson Hyperlegible', 'OpenDyslexic', 'Arial', 'Helvetica', sans-serif",
};

const letterSpacingValue: Record<FontFamilyOption, string | undefined> = {
  sans: undefined,
  serif: undefined,
  dyslexic: "0.015em",
};

const headingScale: Record<FontSizeOption, number> = {
  small: 0.92,
  medium: 1,
  large: 1.08,
  xlarge: 1.18,
};

export interface ReadingTypographyStyles {
  container: React.CSSProperties;
  paragraph: React.CSSProperties;
  heading: (level: 1 | 2 | 3 | 4) => React.CSSProperties;
  code: React.CSSProperties;
}

export function getReadingTypography(preferences: ReadingPreferences): ReadingTypographyStyles {
  const baseFontSize = 1.05 * fontSizeMultiplier[preferences.fontSize];
  const fontFamily = fontFamilyValue[preferences.fontFamily];
  const headingBase = headingScale[preferences.fontSize];
  const letterSpacing = letterSpacingValue[preferences.fontFamily];

  const headingSizes: Record<1 | 2 | 3 | 4, number> = {
    1: 2.2 * headingBase,
    2: 1.8 * headingBase,
    3: 1.45 * headingBase,
    4: 1.25 * headingBase,
  };

  return {
    container: {
      maxWidth: `${contentWidthValue[preferences.contentWidth]}px`,
      marginInline: "auto",
      fontFamily,
      letterSpacing,
    },
    paragraph: {
      fontSize: `${baseFontSize}rem`,
      lineHeight: lineHeightValue[preferences.lineSpacing],
      fontFamily,
      letterSpacing,
    },
    heading: (level) => ({
      fontSize: `${headingSizes[level]}rem`,
      fontWeight: 400,
      lineHeight: 1.25,
      marginTop: level === 1 ? "2.5rem" : level === 2 ? "2rem" : "1.5rem",
      marginBottom: level === 1 ? "1.25rem" : level === 2 ? "1rem" : "0.75rem",
      fontFamily,
      letterSpacing,
    }),
    code: {
      fontSize: `${0.92 * fontSizeMultiplier[preferences.fontSize]}rem`,
      fontFamily: "'JetBrains Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
  };
}

export function getWordsPerMinute(preferences: ReadingPreferences): number {
  switch (preferences.readingSpeed) {
    case "slow":
      return 180;
    case "fast":
      return 260;
    default:
      return 220;
  }
}
