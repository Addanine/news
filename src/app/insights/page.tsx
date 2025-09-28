"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getReadingStats, getReadingCalendar, type ReadingStats } from "~/lib/reading-tracker";

export default function InsightsPage() {
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [calendar, setCalendar] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    setStats(getReadingStats());
    setCalendar(getReadingCalendar(90));
  }, []);

  const getStreakColor = (count: number) => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800";
    if (count === 1) return "bg-green-200 dark:bg-green-900";
    if (count === 2) return "bg-green-400 dark:bg-green-700";
    return "bg-green-600 dark:bg-green-500";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!stats) {
    return (
      <main className="min-h-screen bg-white dark:bg-gray-900">
        <header className="border-b border-black dark:border-gray-700 px-6 py-4">
          <div className="mx-auto max-w-6xl flex items-center justify-between">
            <Link href="/" className="text-xl font-normal hover:underline dark:text-white">
              lift.news
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-6 py-12 text-center text-sm text-gray-600 dark:text-gray-400">
          loading insights...
        </div>
      </main>
    );
  }

  const calendarEntries = Array.from(calendar.entries()).reverse();
  const weeks: Array<Array<[string, number]>> = [];
  for (let i = 0; i < calendarEntries.length; i += 7) {
    weeks.push(calendarEntries.slice(i, i + 7));
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <header className="border-b border-black dark:border-gray-700 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="text-xl font-normal hover:underline dark:text-white">
            lift.news
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/news"
              className="text-sm hover:underline dark:text-white"
            >
              news
            </Link>
            <Link
              href="/recommendations"
              className="text-sm hover:underline dark:text-white"
            >
              for you
            </Link>
            <Link
              href="/gallery"
              className="text-sm hover:underline dark:text-white"
            >
              gallery
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
          <h1 className="text-3xl font-normal dark:text-white">reading insights</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            track your positive news reading journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="border border-black dark:border-gray-700 p-6">
            <div className="mb-3">
              <Image src="/icons/streak.svg" alt="Streak" width={32} height={32} className="dark:invert" />
            </div>
            <div className="text-3xl font-normal dark:text-white">{stats.currentStreak}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">day streak</div>
          </div>

          <div className="border border-black dark:border-gray-700 p-6">
            <div className="mb-3">
              <Image src="/icons/book.svg" alt="Books" width={32} height={32} className="dark:invert" />
            </div>
            <div className="text-3xl font-normal dark:text-white">{stats.totalArticlesRead}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">articles read</div>
          </div>

          <div className="border border-black dark:border-gray-700 p-6">
            <div className="mb-3">
              <Image src="/icons/calendar.svg" alt="Calendar" width={32} height={32} className="dark:invert" />
            </div>
            <div className="text-3xl font-normal dark:text-white">{stats.articlesThisWeek}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">this week</div>
          </div>

          <div className="border border-black dark:border-gray-700 p-6">
            <div className="mb-3">
              <Image src="/icons/crown.svg" alt="Crown" width={32} height={32} className="dark:invert" />
            </div>
            <div className="text-3xl font-normal dark:text-white">{stats.longestStreak}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">longest streak</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="border border-black dark:border-gray-700 p-6">
            <h2 className="text-xl font-normal mb-4 dark:text-white">achievements</h2>
            <div className="grid grid-cols-2 gap-3">
              {stats.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`border border-black dark:border-gray-700 p-4 text-center transition-opacity ${
                    badge.earned ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  <div className="text-sm font-normal dark:text-white mb-1">{badge.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {badge.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-black dark:border-gray-700 p-6">
            <h2 className="text-xl font-normal mb-4 dark:text-white">top categories</h2>
            {stats.topCategories.length > 0 ? (
              <div className="space-y-3">
                {stats.topCategories.map((cat, index) => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <span className="text-sm dark:text-gray-200">
                      {index + 1}. {cat.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 h-2">
                        <div
                          className="bg-black dark:bg-white h-full"
                          style={{
                            width: `${(cat.count / stats.totalArticlesRead) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                        {cat.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                start reading to see your top categories
              </p>
            )}
          </div>
        </div>

        <div className="border border-black dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-normal mb-4 dark:text-white">reading calendar</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            last 90 days of reading activity
          </p>
          <div className="overflow-x-auto">
            <div className="inline-flex flex-col gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex gap-1">
                  {week.map(([date, count]) => (
                    <div
                      key={date}
                      className={`w-3 h-3 ${getStreakColor(count)} border border-gray-300 dark:border-gray-600`}
                      title={`${date}: ${count} article${count !== 1 ? 's' : ''}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-gray-600 dark:text-gray-400">
            <span>less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600" />
              <div className="w-3 h-3 bg-green-200 dark:bg-green-900 border border-gray-300 dark:border-gray-600" />
              <div className="w-3 h-3 bg-green-400 dark:bg-green-700 border border-gray-300 dark:border-gray-600" />
              <div className="w-3 h-3 bg-green-600 dark:bg-green-500 border border-gray-300 dark:border-gray-600" />
            </div>
            <span>more</span>
          </div>
        </div>

        <div className="border border-black dark:border-gray-700 p-6">
          <h2 className="text-xl font-normal mb-4 dark:text-white">recent reading history</h2>
          {stats.readingHistory.length > 0 ? (
            <div className="space-y-3">
              {stats.readingHistory.slice(0, 10).map((entry) => (
                <div
                  key={`${entry.articleId}-${entry.timestamp}`}
                  className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0"
                >
                  <Link
                    href={`/article/${encodeURIComponent(entry.articleId)}`}
                    className="text-sm font-normal hover:underline dark:text-white"
                  >
                    {entry.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                    <span>{entry.source}</span>
                    <span>•</span>
                    <span>{formatDate(entry.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              no articles read yet. <Link href="/news" className="underline">start reading</Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}