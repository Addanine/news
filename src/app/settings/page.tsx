"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "~/lib/news-aggregator";

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
      <main className="min-h-screen bg-white">
        <header className="border-b border-black px-6 py-4">
          <div className="mx-auto max-w-4xl">
            <Link href="/" className="text-xl font-normal hover:underline">
              lift
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-4xl px-6 py-12 text-center text-sm text-gray-600">
          loading settings...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-black px-6 py-4">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="text-xl font-normal hover:underline">
            lift
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-normal">settings</h1>
          <Link
            href="/news"
            className="text-sm hover:underline"
          >
            ← back to news
          </Link>
        </div>

        <div className="space-y-8">
          <section className="border border-black p-6">
            <h2 className="mb-4 text-lg font-normal">categories</h2>
            <p className="mb-4 text-sm text-gray-600">
              select which types of news you want to see
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`border border-black px-3 py-1.5 text-xs transition-colors ${
                    selectedCategories.includes(category.id)
                      ? 'bg-black text-white'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.label}
                </button>
              ))}
            </div>
          </section>

          <section className="border border-black p-6">
            <h2 className="mb-4 text-lg font-normal">display</h2>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showImages"
                checked={showImages}
                onChange={(e) => setShowImages(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="showImages" className="text-sm">
                show article images
              </label>
            </div>
          </section>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="border border-black bg-black px-6 py-3 text-sm text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50"
            >
              {saving ? 'saving...' : 'save settings'}
            </button>
            <Link
              href="/news"
              className="inline-block border border-black px-6 py-3 text-sm transition-colors hover:bg-black hover:text-white"
            >
              cancel
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}