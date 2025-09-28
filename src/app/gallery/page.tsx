"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Category } from "~/lib/news-aggregator";

interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  source: string;
  author?: string;
  categories: Category[];
  summary?: string;
}

export default function GalleryPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [loadingSummaries, setLoadingSummaries] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchArticles() {
      setLoading(true);
      try {
        const response = await fetch('/api/sync-articles');
        const data = await response.json() as { articles?: Article[] };
        
        if (data.articles) {
          setArticles(data.articles);
          
          data.articles.forEach((article) => {
            void fetchSummary(article.id, article.url, article.title);
          });
        }
      } catch (err) {
        setError('failed to load articles');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    void fetchArticles();
  }, []);

  const fetchSummary = async (articleId: string, url: string, title: string) => {
    setLoadingSummaries(prev => ({ ...prev, [articleId]: true }));
    
    try {
      const response = await fetch('/api/article-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title }),
      });
      
      const data = await response.json() as { summary?: string };
      
      if (data.summary) {
        setSummaries(prev => ({ ...prev, [articleId]: data.summary ?? '' }));
      }
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setLoadingSummaries(prev => ({ ...prev, [articleId]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <header className="border-b border-black dark:border-gray-700 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="text-xl font-normal hover:underline dark:text-white">
            lift.news
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/recommendations"
              className="text-sm hover:underline dark:text-white"
            >
              for you
            </Link>
            <Link
              href="/insights"
              className="text-sm hover:underline dark:text-white"
            >
              insights
            </Link>
            <Link
              href="/settings"
              className="text-sm hover:underline dark:text-white"
            >
              settings
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-normal dark:text-white">article gallery</h1>
          <Link
            href="/news"
            className="text-sm hover:underline dark:text-white"
          >
            ← back to feed
          </Link>
        </div>

        {loading && (
          <div className="py-12 text-center text-sm text-gray-600 dark:text-gray-400">
            loading articles...
          </div>
        )}

        {error && (
          <div className="border border-black dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6 text-sm dark:text-white">
            {error}
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-600 dark:text-gray-400">
            no articles found
          </div>
        )}

        {!loading && !error && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/article/${encodeURIComponent(article.id)}`}
                className="border border-black dark:border-gray-700 hover:shadow-lg transition-shadow group"
              >
                {article.imageUrl && (
                  <div className="aspect-video overflow-hidden border-b border-black dark:border-gray-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {article.source} · {formatDate(article.publishedAt)}
                  </div>
                  <h2 className="text-lg font-normal leading-tight group-hover:underline dark:text-white">
                    {article.title}
                  </h2>
                  {summaries[article.id] && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {summaries[article.id]}
                    </p>
                  )}
                  {!summaries[article.id] && loadingSummaries[article.id] && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic line-clamp-2">
                      loading summary...
                    </p>
                  )}
                  {!summaries[article.id] && !loadingSummaries[article.id] && article.description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {article.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}