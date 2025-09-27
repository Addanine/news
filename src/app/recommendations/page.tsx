"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDarkMode } from "~/lib/dark-mode";
import type { RecommendationScore } from "~/lib/recommendation-engine";
import { getRecommendationInsights } from "~/lib/recommendation-engine";
import { getReadingHistory } from "~/lib/reading-tracker";

export default function RecommendationsPage() {
  const { isDark, toggle } = useDarkMode();
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState<ReturnType<typeof getRecommendationInsights> | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [loadingSummaries, setLoadingSummaries] = useState<Record<string, boolean>>({});
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    const history = getReadingHistory();
    setHistoryCount(history.length);
  }, []);

  useEffect(() => {
    async function fetchRecommendations() {
      setLoading(true);
      try {
        const response = await fetch('/api/recommendations');
        const data = await response.json() as { recommendations?: RecommendationScore[] };
        
        if (data.recommendations) {
          setRecommendations(data.recommendations);
          const calculatedInsights = getRecommendationInsights(data.recommendations);
          setInsights(calculatedInsights);

          data.recommendations.slice(0, 5).forEach((rec) => {
            void fetchSummary(rec.article.id, rec.article.url, rec.article.title);
          });
        }
      } catch (err) {
        setError('failed to load recommendations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    void fetchRecommendations();
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

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-blue-600 dark:text-blue-400";
    if (score >= 25) return "text-yellow-600 dark:text-yellow-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 75) return "perfect match";
    if (score >= 50) return "great match";
    if (score >= 25) return "good match";
    return "potential interest";
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <header className="border-b border-black dark:border-gray-700 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="text-xl font-normal hover:underline dark:text-white">
            lift.news
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              className="hover:opacity-70 transition-opacity"
              aria-label="Toggle dark mode"
            >
              <Image 
                src={isDark ? '/icons/sun.svg' : '/icons/moon.svg'} 
                alt={isDark ? 'Light mode' : 'Dark mode'} 
                width={20} 
                height={20}
                className="dark:invert"
              />
            </button>
            <Link
              href="/news"
              className="text-sm hover:underline dark:text-white"
            >
              news
            </Link>
            <Link
              href="/gallery"
              className="text-sm hover:underline dark:text-white"
            >
              gallery
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
        <div className="mb-8">
          <h1 className="text-3xl font-normal dark:text-white">for you</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {historyCount === 0 
              ? "Start reading to get personalized recommendations"
              : `Personalized recommendations based on your reading history`
            }
          </p>
        </div>

        {historyCount > 0 && insights && (
          <div className="mb-8 border border-black dark:border-gray-700 p-6">
            <h2 className="text-lg font-normal mb-4 dark:text-white">why these recommendations?</h2>
            <div className="space-y-2">
              {insights.topReasons.map((reason, index) => (
                <div key={index} className="flex items-start gap-2 text-sm dark:text-gray-200">
                  <span className="text-gray-600 dark:text-gray-400">•</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
            {insights.categoryDistribution.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  recommended categories:
                </p>
                <div className="flex flex-wrap gap-2">
                  {insights.categoryDistribution.slice(0, 5).map((cat) => (
                    <span
                      key={cat.category}
                      className="text-xs border border-black dark:border-gray-700 px-2 py-1 dark:text-gray-200"
                    >
                      {cat.category} ({cat.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="py-12 text-center text-sm text-gray-600 dark:text-gray-400">
            analyzing your preferences...
          </div>
        )}

        {error && (
          <div className="border border-black dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6 text-sm dark:text-white">
            {error}
          </div>
        )}

        {!loading && !error && recommendations.length === 0 && (
          <div className="border border-black dark:border-gray-700 p-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              No recommendations available yet.
            </p>
            <Link
              href="/news"
              className="inline-block border border-black dark:border-gray-700 px-6 py-3 text-sm hover:bg-black hover:text-white dark:text-white dark:hover:bg-gray-700 transition-colors"
            >
              Start Reading
            </Link>
          </div>
        )}

        {!loading && !error && recommendations.length > 0 && (
          <div className="space-y-6">
            {recommendations.map((rec, index) => (
              <div
                key={rec.article.id}
                className="border border-black dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row">
                  {rec.article.imageUrl && (
                    <div className="md:w-1/3 aspect-video md:aspect-auto overflow-hidden border-b md:border-b-0 md:border-r border-black dark:border-gray-700">
                      <Link href={`/article/${encodeURIComponent(rec.article.id)}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={rec.article.imageUrl}
                          alt={rec.article.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                    </div>
                  )}
                  <div className="flex-1 p-6 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            #{index + 1}
                          </span>
                          <span className={`text-xs font-medium uppercase tracking-wider ${getScoreColor(rec.score)}`}>
                            {getScoreBadge(rec.score)}
                          </span>
                        </div>
                        <Link
                          href={`/article/${encodeURIComponent(rec.article.id)}`}
                          className="block"
                        >
                          <h2 className="text-xl font-normal leading-tight hover:underline dark:text-white mb-2">
                            {rec.article.title}
                          </h2>
                        </Link>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          {rec.article.source} · {formatDate(rec.article.publishedAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-normal ${getScoreColor(rec.score)}`}>
                          {Math.round(rec.score)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          match
                        </div>
                      </div>
                    </div>

                    {summaries[rec.article.id] && (
                      <div className="bg-gray-50 dark:bg-gray-800 border border-black dark:border-gray-700 p-3">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {summaries[rec.article.id]}
                        </p>
                      </div>
                    )}

                    {!summaries[rec.article.id] && loadingSummaries[rec.article.id] && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                        loading summary...
                      </p>
                    )}

                    {!summaries[rec.article.id] && !loadingSummaries[rec.article.id] && rec.article.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {rec.article.description}
                      </p>
                    )}

                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        why recommended:
                      </p>
                      <div className="space-y-1">
                        {rec.reasons.map((reason, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs dark:text-gray-300">
                            <span className="text-gray-400">•</span>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3">
                      <Link
                        href={`/article/${encodeURIComponent(rec.article.id)}`}
                        className="border border-black dark:border-gray-700 px-4 py-2 text-sm hover:bg-black hover:text-white dark:text-white dark:hover:bg-gray-700 transition-colors"
                      >
                        read article
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}