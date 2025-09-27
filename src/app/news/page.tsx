"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  source: string;
  author?: string;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchArticles() {
      try {
        const response = await fetch('/api/articles');
        const data = await response.json() as { articles?: Article[] };
        
        if (data.articles) {
          setArticles(data.articles);
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours === 1) return '1h ago';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1d ago';
    return `${diffInDays}d ago`;
  };

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-black px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="text-xl font-normal hover:underline">
            lift
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between border-b border-black pb-4">
          <input
            type="text"
            placeholder="search..."
            className="border border-black px-4 py-2 text-sm focus:outline-none"
          />
          <div className="flex gap-4 text-sm">
            <button className="border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
              categories
            </button>
            <button className="border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
              settings
            </button>
          </div>
        </div>

        {loading && (
          <div className="py-12 text-center text-sm text-gray-600">
            loading articles...
          </div>
        )}

        {error && (
          <div className="border border-black bg-gray-50 p-6 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-600">
            no articles found
          </div>
        )}

        {!loading && !error && articles.length > 0 && (
          <div className="grid grid-cols-1 gap-px bg-black md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white p-6 hover:bg-gray-100 transition-colors"
              >
                {article.imageUrl ? (
                  <div className="mb-4 aspect-[4/3] border border-black bg-gray-50 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="mb-4 aspect-[4/3] border border-black bg-gray-50" />
                )}
                <div className="mb-2 text-xs uppercase tracking-wider text-gray-600">
                  {article.source}
                </div>
                <h2 className="mb-2 text-lg font-normal leading-tight line-clamp-3">
                  {article.title}
                </h2>
                <p className="mb-4 text-sm text-gray-700 leading-relaxed line-clamp-3">
                  {article.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{article.source}</span>
                  <span>{formatTimeAgo(article.publishedAt)}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}