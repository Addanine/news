"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  content?: string;
  summary?: string;
}

export default function NewsPage() {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalArticles, setTotalArticles] = useState(0);
  const [sessionId] = useState(() => 
    typeof window !== 'undefined' 
      ? localStorage.getItem('sessionId') ?? crypto.randomUUID()
      : crypto.randomUUID()
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessionId', sessionId);
    }
  }, [sessionId]);

  const fetchArticle = async (skip: number) => {
    setLoading(true);
    try {
      const dailyRes = await fetch(`/api/daily?skip=${skip}`);
      const dailyData = await dailyRes.json() as { article?: Article; totalArticles?: number };
      
      if (dailyData.article) {
        setArticle(dailyData.article);
        setTotalArticles(dailyData.totalArticles ?? 0);
      }
    } catch (err) {
      setError('failed to load article');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchArticle(currentIndex);
  }, [currentIndex]);

  const handleNextArticle = () => {
    setCurrentIndex(prev => prev + 1);
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-black px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link href="/" className="text-xl font-normal hover:underline">
            lift
          </Link>
          <Link
            href="/settings"
            className="text-sm hover:underline"
          >
            settings
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        {loading && (
          <div className="py-12 text-center text-sm text-gray-600">
            loading today&apos;s article...
          </div>
        )}

        {error && (
          <div className="border border-black bg-gray-50 p-6 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && !article && (
          <div className="py-12 text-center text-sm text-gray-600">
            no article found for today
          </div>
        )}

        {!loading && !error && article && (
          <article className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="uppercase tracking-wider">{article.source}</span>
                <span>{formatDate(article.publishedAt)}</span>
              </div>
              
              <h1 className="text-4xl font-normal leading-tight">
                {article.title}
              </h1>
              
              {article.summary && (
                <div className="bg-gray-50 border border-black p-4 my-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wider">Quick Summary</h3>
                  <p className="text-base text-gray-800 leading-relaxed">
                    {article.summary}
                  </p>
                </div>
              )}

              {article.description && (
                <p className="text-lg text-gray-700 leading-relaxed">
                  {article.description}
                </p>
              )}

              <div className="flex items-center gap-4 pt-4 flex-wrap">
                <button
                  onClick={handleNextArticle}
                  className="border border-black px-4 py-2 text-sm hover:bg-black hover:text-white transition-colors"
                >
                  next article →
                </button>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-black px-4 py-2 text-sm hover:bg-black hover:text-white transition-colors"
                >
                  read original
                </a>
                <span className="text-xs text-gray-600 ml-auto">
                  {currentIndex + 1} of {totalArticles}
                </span>
              </div>
            </div>

            {article.imageUrl && (
              <div className="border border-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full"
                />
              </div>
            )}

            {article.content && (
              <div className="border-t border-black pt-8">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: ({ src, alt }) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={src} 
                        alt={alt ?? ''} 
                        className="w-full border border-black my-6"
                      />
                    ),
                    a: ({ href, children }) => (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        {children}
                      </a>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 text-base leading-relaxed">{children}</p>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-normal mt-8 mb-4">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-normal mt-8 mb-4">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-normal mt-6 mb-3">{children}</h3>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-black pl-4 italic my-4">{children}</blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-100 px-1 py-0.5 text-sm">{children}</code>
                    ),
                  }}
                >
                  {article.content}
                </ReactMarkdown>
              </div>
            )}
          </article>
        )}
      </div>
    </main>
  );
}