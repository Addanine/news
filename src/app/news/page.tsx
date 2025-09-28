"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Category } from "~/lib/news-aggregator";
import { trackArticleRead } from "~/lib/reading-tracker";
import { estimateReadingTime } from "~/lib/reading-time";
import {
  getReadingTypography,
  getWordsPerMinute,
  useReadingPreferences,
} from "~/lib/reading-preferences";
import { ReadingProgress } from "~/components/ReadingProgress";
import { KeyboardShortcutsModal } from "~/components/KeyboardShortcutsModal";
import { CommandPalette } from "~/components/CommandPalette";

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
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalArticles, setTotalArticles] = useState(0);
  const [streamingSummary, setStreamingSummary] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const { preferences } = useReadingPreferences();
  const typography = useMemo(() => getReadingTypography(preferences), [preferences]);
  const wordsPerMinute = useMemo(() => getWordsPerMinute(preferences), [preferences]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const readingTime = useMemo(() => {
    if (!article) return null;
    const text = article.content ?? article.summary ?? article.description ?? "";
    if (!text) return null;
    return estimateReadingTime(text, wordsPerMinute);
  }, [article, wordsPerMinute]);
  const titleStyles = useMemo(() => ({ ...typography.heading(1), marginTop: 0 }), [typography]);
  const shortcutList = useMemo(
    () => [
      { keys: 'j', description: 'next article' },
      { keys: 'k', description: 'previous article' },
      { keys: '/', description: 'search & navigate' },
      { keys: 'shift + /', description: 'toggle shortcuts help' },
      { keys: 'p', description: 'print or save as pdf' },
      { keys: 'n', description: 'jump to news feed' },
      { keys: 'g', description: 'open gallery' },
      { keys: 'i', description: 'open insights dashboard' },
      { keys: 'r', description: 'view recommendations' },
    ],
    []
  );
  const markdownComponents = useMemo<Components>(
    () => ({
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
        <p style={typography.paragraph} className="mb-4 text-gray-800 dark:text-gray-200">
          {children}
        </p>
      ),
      h1: ({ children }) => (
        <h1 style={typography.heading(1)} className="dark:text-white">
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 style={typography.heading(2)} className="dark:text-white">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 style={typography.heading(3)} className="dark:text-white">
          {children}
        </h3>
      ),
      h4: ({ children }) => (
        <h4 style={typography.heading(4)} className="dark:text-white">
          {children}
        </h4>
      ),
      ul: ({ children }) => (
        <ul
          style={{ ...typography.paragraph, paddingLeft: '1.25rem' }}
          className="mb-4 list-disc space-y-2 text-gray-800 dark:text-gray-200"
        >
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol
          style={{ ...typography.paragraph, paddingLeft: '1.25rem' }}
          className="mb-4 list-decimal space-y-2 text-gray-800 dark:text-gray-200"
        >
          {children}
        </ol>
      ),
      blockquote: ({ children }) => (
        <blockquote
          style={{ ...typography.paragraph, borderLeft: '4px solid var(--tw-prose-borders, #000)', paddingLeft: '1rem', fontStyle: 'italic' }}
          className="my-4 border-black dark:border-gray-600 dark:text-gray-300"
        >
          {children}
        </blockquote>
      ),
      code: ({ children }) => (
        <code
          style={typography.code}
          className="bg-gray-100 px-1 py-0.5 text-sm dark:bg-gray-800 dark:text-gray-200"
        >
          {children}
        </code>
      ),
    }),
    [typography]
  );
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

  const handleNextArticle = useCallback(() => {
    setCurrentIndex(prev => {
      const maxIndex = totalArticles > 0 ? totalArticles - 1 : prev + 1;
      return Math.min(prev + 1, maxIndex);
    });
  }, [totalArticles]);

  const handlePreviousArticle = useCallback(() => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  }, []);

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

  const handlePrint = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.print();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (event.key === 'j') {
        event.preventDefault();
        handleNextArticle();
      }

      if (event.key === 'k') {
        event.preventDefault();
        handlePreviousArticle();
      }

      if (event.key === '/' && !event.shiftKey) {
        event.preventDefault();
        setShowCommandPalette(true);
      }

      if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
        event.preventDefault();
        setShowShortcuts(true);
      }

      if (event.key === 'n') {
        event.preventDefault();
        router.push('/news');
      }

      if (event.key === 'i') {
        event.preventDefault();
        router.push('/insights');
      }

      if (event.key === 'r') {
        event.preventDefault();
        router.push('/recommendations');
      }

      if (event.key === 'g') {
        event.preventDefault();
        router.push('/gallery');
      }

      if (event.key === 'p') {
        event.preventDefault();
        handlePrint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextArticle, handlePreviousArticle, handlePrint, router]);

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
      <div className="no-print">
        <ReadingProgress />
      </div>
      <header className="border-b border-black dark:border-gray-700 px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link href="/" className="text-xl font-normal hover:underline dark:text-white">
            lift.news
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="text-sm hover:underline dark:text-white"
            >
              search
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
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="uppercase tracking-wider">{article.source}</span>
                <div className="flex items-center gap-2">
                  <span>{formatDate(article.publishedAt)}</span>
                  {readingTime !== null && (
                    <span aria-label="Estimated reading time">· {readingTime} min read</span>
                  )}
                </div>
              </div>

              <h1 style={titleStyles} className="font-normal leading-tight dark:text-white">
                {article.title}
              </h1>

              {(streamingSummary || isSummaryLoading) && (
                <div className="bg-gray-50 dark:bg-gray-800 border border-black dark:border-gray-700 p-4 my-6">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">
                    AI Summary {isSummaryLoading && !streamingSummary && <span className="animate-pulse">...</span>}
                  </h3>
                  <p style={typography.paragraph} className="text-gray-800 dark:text-gray-200">
                    {streamingSummary}
                    {isSummaryLoading && streamingSummary && <span className="inline-block w-2 h-4 bg-gray-800 dark:bg-gray-200 ml-1 animate-pulse" />}
                  </p>
                </div>
              )}

              {article.description && (
                <p style={typography.paragraph} className="text-gray-700 dark:text-gray-300">
                  {article.description}
                </p>
              )}

              <div className="no-print flex flex-wrap items-center gap-3 pt-4">
                <Link
                  href="/gallery"
                  className="border border-black dark:border-gray-700 px-4 py-2 text-sm hover:bg-black hover:text-white dark:text-white dark:hover:bg-gray-700 transition-colors"
                >
                  gallery
                </Link>
                <button
                  onClick={handlePreviousArticle}
                  disabled={currentIndex === 0}
                  className="border border-black dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm transition-colors hover:bg-black hover:text-white dark:text-white dark:hover:bg-gray-700"
                >
                  ← previous
                </button>
                <button
                  onClick={handleShare}
                  className="border border-black dark:border-gray-700 px-4 py-2 text-sm hover:bg-black hover:text-white dark:text-white dark:hover:bg-gray-700 transition-colors"
                >
                  share
                </button>
                <button
                  onClick={handlePrint}
                  className="border border-black dark:border-gray-700 px-4 py-2 text-sm hover:bg-black hover:text-white dark:text-white dark:hover:bg-gray-700 transition-colors"
                >
                  print / pdf
                </button>
                <button
                  onClick={handleNextArticle}
                  disabled={totalArticles > 0 ? currentIndex >= totalArticles - 1 : false}
                  className={`border border-black px-4 py-2 text-sm transition-colors dark:border-gray-700 ${
                    totalArticles > 0 && currentIndex >= totalArticles - 1
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:bg-black hover:text-white dark:text-white dark:hover:bg-gray-700'
                  }`}
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
                <div
                  id="article-content"
                  className="print-readable"
                  style={typography.container}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {article.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </article>
        )}
      </div>
      <KeyboardShortcutsModal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcutList}
      />
      <CommandPalette
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
    </main>
  );
}