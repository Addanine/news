"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Category } from "~/lib/news-aggregator";
import { useDarkMode } from "~/lib/dark-mode";
import { trackArticleRead } from "~/lib/reading-tracker";

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
  const { isDark, toggle, mounted } = useDarkMode();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalArticles, setTotalArticles] = useState(0);
  const [streamingSummary, setStreamingSummary] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
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

  const streamSummary = async (content: string, title: string) => {
    setIsSummaryLoading(true);
    setStreamingSummary("");
    
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title }),
      });

      if (!response.ok || !response.body) {
        console.error('Failed to stream summary');
        setIsSummaryLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value, { stream: true });
        setStreamingSummary(prev => prev + text);
      }
    } catch (err) {
      console.error('Error streaming summary:', err);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const fetchArticle = async (skip: number) => {
    setLoading(true);
    setStreamingSummary("");
    
    try {
      const dailyRes = await fetch(`/api/daily?skip=${skip}`);
      const dailyData = await dailyRes.json() as { article?: Article; totalArticles?: number };
      
      if (dailyData.article) {
        setArticle(dailyData.article);
        setTotalArticles(dailyData.totalArticles ?? 0);
        
        trackArticleRead(
          dailyData.article.id,
          dailyData.article.title,
          dailyData.article.source,
          dailyData.article.categories
        );
        
        if (dailyData.article.content && dailyData.article.title) {
          void streamSummary(dailyData.article.content, dailyData.article.title);
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const handleNextArticle = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const handleShare = async () => {
    if (!article) return;
    
    const shareUrl = `${window.location.origin}/article/${encodeURIComponent(article.id)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
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
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <header className="border-b border-black dark:border-gray-700 px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link href="/" className="text-xl font-normal hover:underline dark:text-white">
            lift.news
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              className="hover:opacity-70 transition-opacity"
              aria-label="Toggle dark mode"
            >
              {mounted && (
                <Image 
                  src={isDark ? '/icons/sun.svg' : '/icons/moon.svg'} 
                  alt={isDark ? 'Light mode' : 'Dark mode'} 
                  width={20} 
                  height={20}
                  className="dark:invert"
                />
              )}
            </button>
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

      <div className="mx-auto max-w-4xl px-6 py-12">
        {loading && (
          <div className="py-12 text-center text-sm text-gray-600 dark:text-gray-400">
            loading today&apos;s article...
          </div>
        )}

        {error && (
          <div className="border border-black dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6 text-sm dark:text-white">
            {error}
          </div>
        )}

        {!loading && !error && !article && (
          <div className="py-12 text-center text-sm text-gray-600 dark:text-gray-400">
            no article found for today
          </div>
        )}

        {!loading && !error && article && (
          <article className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span className="uppercase tracking-wider">{article.source}</span>
                <span>{formatDate(article.publishedAt)}</span>
              </div>
              
              <h1 className="text-4xl font-normal leading-tight dark:text-white">
                {article.title}
              </h1>
              
              {(streamingSummary || isSummaryLoading) && (
                <div className="bg-gray-50 dark:bg-gray-800 border border-black dark:border-gray-700 p-4 my-6">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">
                    AI Summary {isSummaryLoading && !streamingSummary && <span className="animate-pulse">...</span>}
                  </h3>
                  <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                    {streamingSummary}
                    {isSummaryLoading && streamingSummary && <span className="inline-block w-2 h-4 bg-gray-800 dark:bg-gray-200 ml-1 animate-pulse" />}
                  </p>
                </div>
              )}

              {article.description && (
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  {article.description}
                </p>
              )}

              <div className="flex items-center gap-4 pt-4 flex-wrap">
                <Link
                  href="/gallery"
                  className="border border-black dark:border-gray-700 px-4 py-2 text-sm hover:bg-black hover:text-white dark:text-white dark:hover:bg-gray-700 transition-colors"
                >
                  gallery
                </Link>
                <button
                  onClick={handleShare}
                  className="border border-black dark:border-gray-700 px-4 py-2 text-sm hover:bg-black hover:text-white dark:text-white dark:hover:bg-gray-700 transition-colors"
                >
                  share
                </button>
                <button
                  onClick={handleNextArticle}
                  className="border border-black dark:border-gray-700 px-4 py-2 text-sm hover:bg-black hover:text-white dark:text-white dark:hover:bg-gray-700 transition-colors"
                >
                  next article →
                </button>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-black dark:border-gray-700 px-4 py-2 text-sm hover:bg-black hover:text-white dark:text-white dark:hover:bg-gray-700 transition-colors"
                >
                  read original
                </a>
                <span className="text-xs text-gray-600 dark:text-gray-400 ml-auto">
                  {currentIndex + 1} of {totalArticles}
                </span>
              </div>
            </div>

            {article.imageUrl && (
              <div className="border border-black dark:border-gray-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full"
                />
              </div>
            )}

            {article.content && (
              <div className="border-t border-black dark:border-gray-700 pt-8">
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
                      <p className="mb-4 text-base leading-relaxed dark:text-gray-200">{children}</p>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-normal mt-8 mb-4 dark:text-white">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-normal mt-8 mb-4 dark:text-white">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-normal mt-6 mb-3 dark:text-white">{children}</h3>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-4 space-y-2 dark:text-gray-200">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-4 space-y-2 dark:text-gray-200">{children}</ol>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-black dark:border-gray-600 pl-4 italic my-4 dark:text-gray-300">{children}</blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-100 dark:bg-gray-800 dark:text-gray-200 px-1 py-0.5 text-sm">{children}</code>
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