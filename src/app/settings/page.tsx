"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "~/lib/news-aggregator";
import {
  getReadingTypography,
  type ContentWidthOption,
  type FontFamilyOption,
  type FontSizeOption,
  type LineSpacingOption,
  type ReadingSpeedOption,
  useReadingPreferences,
} from "~/lib/reading-preferences";

interface CategoryConfig {
  id: Category;
  label: string;
  icon: string;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'science-innovation', label: 'science & innovation', icon: '🔬' },
  { id: 'environment', label: 'environment', icon: '🌱' },
  { id: 'community', label: 'community', icon: '🤝' },
  { id: 'kindness', label: 'kindness', icon: '💝' },
  { id: 'health-recovery', label: 'health & recovery', icon: '⚕️' },
  { id: 'education', label: 'education', icon: '📚' },
  { id: 'global-progress', label: 'global progress', icon: '🌍' },
  { id: 'technology', label: 'technology', icon: '💻' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [showImages, setShowImages] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionId] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('sessionId') ?? crypto.randomUUID()
      : crypto.randomUUID()
  );
  const {
    preferences: readingPreferences,
    updatePreference,
    reset,
    mounted: readingPrefsMounted,
  } = useReadingPreferences();

  const typographyPreview = useMemo(() => getReadingTypography(readingPreferences), [readingPreferences]);

  const fontSizeSteps: FontSizeOption[] = ['small', 'medium', 'large', 'xlarge'];
  const readingSpeedSteps: ReadingSpeedOption[] = ['slow', 'average', 'fast'];
  const fontFamilyOptions: { value: FontFamilyOption; label: string }[] = [
    { value: 'sans', label: 'Sans Serif' },
    { value: 'serif', label: 'Serif' },
    { value: 'dyslexic', label: 'Dyslexic-friendly' },
  ];
  const spacingOptions: { value: LineSpacingOption; label: string }[] = [
    { value: 'normal', label: 'Compact' },
    { value: 'relaxed', label: 'Relaxed' },
    { value: 'loose', label: 'Open' },
  ];
  const widthOptions: { value: ContentWidthOption; label: string }[] = [
    { value: 'narrow', label: 'Narrow' },
    { value: 'comfortable', label: 'Comfortable' },
    { value: 'wide', label: 'Wide' },
  ];

  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await fetch(`/api/preferences?sessionId=${sessionId}`);
        const data = await response.json() as { selectedCategories: Category[]; showImages: boolean };
        
        setSelectedCategories(data.selectedCategories);
        setShowImages(data.showImages);
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        setLoading(false);
      }
    }

    void loadPreferences();
  }, [sessionId]);

  const toggleCategory = (categoryId: Category) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          selectedCategories,
          showImages,
        }),
      });

      if (response.ok) {
        router.push('/news');
      }
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white dark:bg-gray-900">
        <header className="border-b border-black dark:border-gray-700 px-6 py-4">
          <div className="mx-auto max-w-4xl flex items-center justify-between">
            <Link href="/" className="text-xl font-normal hover:underline dark:text-white">
              lift.news
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/recommendations" className="text-sm hover:underline dark:text-white">
                for you
              </Link>
              <Link href="/insights" className="text-sm hover:underline dark:text-white">
                insights
              </Link>
              <Link href="/news" className="text-sm hover:underline dark:text-white">
                news
              </Link>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-4xl px-6 py-12 text-center text-sm text-gray-600 dark:text-gray-400">
          loading settings...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <header className="border-b border-black dark:border-gray-700 px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link href="/" className="text-xl font-normal hover:underline dark:text-white">
            lift.news
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/recommendations" className="text-sm hover:underline dark:text-white">
              for you
            </Link>
            <Link href="/insights" className="text-sm hover:underline dark:text-white">
              insights
            </Link>
            <Link href="/news" className="text-sm hover:underline dark:text-white">
              news
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-normal dark:text-white">settings</h1>
          <Link
            href="/news"
            className="text-sm hover:underline dark:text-white"
          >
            ← back to news
          </Link>
        </div>

        <div className="space-y-8">
          <section className="border border-black dark:border-gray-700 p-6">
            <h2 className="mb-4 text-lg font-normal dark:text-white">categories</h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              select which types of news you want to see
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`border border-black dark:border-gray-700 px-3 py-1.5 text-xs transition-colors ${
                    selectedCategories.includes(category.id)
                      ? 'bg-black dark:bg-gray-700 text-white'
                      : 'bg-white dark:bg-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.label}
                </button>
              ))}
            </div>
          </section>

          <section className="border border-black dark:border-gray-700 p-6">
            <h2 className="mb-4 text-lg font-normal dark:text-white">display</h2>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showImages"
                checked={showImages}
                onChange={(e) => setShowImages(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="showImages" className="text-sm dark:text-gray-200">
                show article images
              </label>
            </div>
          </section>

          <section className="border border-black dark:border-gray-700 p-6">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-normal dark:text-white">reading preferences</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  customize how articles look and feel. preferences update instantly and are saved on this device.
                </p>
              </div>
              <button
                onClick={reset}
                className="text-xs uppercase tracking-widest text-gray-600 underline transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                type="button"
              >
                reset defaults
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-5">
                <div>
                  <label htmlFor="fontSize" className="mb-2 block text-xs uppercase tracking-widest text-gray-600 dark:text-gray-300">
                    font size
                  </label>
                  <input
                    id="fontSize"
                    type="range"
                    min={0}
                    max={fontSizeSteps.length - 1}
                    value={fontSizeSteps.indexOf(readingPreferences.fontSize)}
                    onChange={(event) => {
                      const nextIndex = Number(event.target.value);
                      updatePreference('fontSize', fontSizeSteps[nextIndex] ?? 'medium');
                    }}
                    className="w-full"
                    disabled={!readingPrefsMounted}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    current: {readingPreferences.fontSize}
                  </p>
                </div>

                <div>
                  <span className="mb-2 block text-xs uppercase tracking-widest text-gray-600 dark:text-gray-300">
                    font family
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {fontFamilyOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updatePreference('fontFamily', option.value)}
                        className={`border border-black px-3 py-1.5 text-xs transition-colors dark:border-gray-700 ${
                          readingPreferences.fontFamily === option.value
                            ? 'bg-black text-white dark:bg-gray-600'
                            : 'bg-white hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-xs uppercase tracking-widest text-gray-600 dark:text-gray-300">
                    line spacing
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {spacingOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updatePreference('lineSpacing', option.value)}
                        className={`border border-black px-3 py-1.5 text-xs transition-colors dark:border-gray-700 ${
                          readingPreferences.lineSpacing === option.value
                            ? 'bg-black text-white dark:bg-gray-600'
                            : 'bg-white hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-xs uppercase tracking-widest text-gray-600 dark:text-gray-300">
                    reading width
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {widthOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updatePreference('contentWidth', option.value)}
                        className={`border border-black px-3 py-1.5 text-xs transition-colors dark:border-gray-700 ${
                          readingPreferences.contentWidth === option.value
                            ? 'bg-black text-white dark:bg-gray-600'
                            : 'bg-white hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="readingSpeed" className="mb-2 block text-xs uppercase tracking-widest text-gray-600 dark:text-gray-300">
                    reading pace
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {readingSpeedSteps.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updatePreference('readingSpeed', option)}
                        className={`border border-black px-3 py-1.5 text-xs transition-colors dark:border-gray-700 ${
                          readingPreferences.readingSpeed === option
                            ? 'bg-black text-white dark:bg-gray-600'
                            : 'bg-white hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    current: {readingPreferences.readingSpeed}
                  </p>
                </div>
              </div>

              <div className="rounded border border-dashed border-black/40 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/40">
                <p className="mb-3 text-xs uppercase tracking-widest text-gray-600 dark:text-gray-300">
                  live preview
                </p>
                <div style={typographyPreview.container}>
                  <h3 style={typographyPreview.heading(2)} className="text-black dark:text-white">
                    A kinder way to read the news
                  </h3>
                  <p style={typographyPreview.paragraph} className="text-gray-700 dark:text-gray-200">
                    Adjust font, spacing, and width to suit your eyes. These settings apply across article pages and the daily feed so every story feels comfortable.
                  </p>
                  <p style={typographyPreview.paragraph} className="text-gray-700 dark:text-gray-200">
                    Try widening the column for immersive reading or keep it narrow for quick scanning.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="border border-black dark:border-gray-700 bg-black dark:bg-gray-700 px-6 py-3 text-sm text-white transition-colors hover:bg-white hover:text-black dark:hover:bg-gray-600 disabled:opacity-50"
            >
              {saving ? 'saving...' : 'save settings'}
            </button>
            <Link
              href="/news"
              className="inline-block border border-black dark:border-gray-700 px-6 py-3 text-sm transition-colors hover:bg-black hover:text-white dark:text-white dark:hover:bg-gray-700"
            >
              cancel
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}