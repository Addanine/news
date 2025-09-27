import type { Category } from "./news-aggregator";

export interface ReadingEntry {
  articleId: string;
  title: string;
  source: string;
  categories: Category[];
  timestamp: number;
  date: string;
}

export interface ReadingStats {
  totalArticlesRead: number;
  currentStreak: number;
  longestStreak: number;
  articlesThisWeek: number;
  articlesThisMonth: number;
  topCategories: { category: Category; count: number }[];
  readingHistory: ReadingEntry[];
  lastReadDate: string | null;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  earnedDate?: string;
}

const STORAGE_KEY = "reading_history";

export function trackArticleRead(
  articleId: string,
  title: string,
  source: string,
  categories: Category[]
): void {
  if (typeof window === "undefined") return;

  const history = getReadingHistory();
  const today = new Date().toISOString().split("T")[0];

  const existingEntry = history.find(
    (entry) => entry.articleId === articleId && entry.date === today
  );

  if (!existingEntry) {
    const newEntry: ReadingEntry = {
      articleId,
      title,
      source,
      categories,
      timestamp: Date.now(),
      date: today ?? "",
    };

    history.unshift(newEntry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }
}

export function getReadingHistory(): ReadingEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as ReadingEntry[]) : [];
  } catch {
    return [];
  }
}

export function calculateStreak(history: ReadingEntry[]): {
  current: number;
  longest: number;
} {
  if (history.length === 0) return { current: 0, longest: 0 };

  const uniqueDates = Array.from(
    new Set(history.map((entry) => entry.date))
  ).sort((a, b) => b.localeCompare(a));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
    currentStreak = 1;
    tempStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i] ?? "");
      const prevDate = new Date(uniqueDates[i - 1] ?? "");
      const diffDays = Math.floor(
        (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        currentStreak++;
        tempStreak++;
      } else {
        break;
      }
    }
  }

  tempStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i] ?? "");
    const prevDate = new Date(uniqueDates[i - 1] ?? "");
    const diffDays = Math.floor(
      (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return { current: currentStreak, longest: longestStreak };
}

export function getReadingStats(): ReadingStats {
  const history = getReadingHistory();
  const streaks = calculateStreak(history);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const articlesThisWeek = history.filter(
    (entry) => entry.timestamp > weekAgo.getTime()
  ).length;

  const articlesThisMonth = history.filter(
    (entry) => entry.timestamp > monthAgo.getTime()
  ).length;

  const categoryCount = new Map<Category, number>();
  history.forEach((entry) => {
    entry.categories.forEach((cat) => {
      categoryCount.set(cat, (categoryCount.get(cat) ?? 0) + 1);
    });
  });

  const topCategories = Array.from(categoryCount.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const lastReadDate = history.length > 0 ? history[0]?.date ?? null : null;

  const badges = calculateBadges(
    history.length,
    streaks.current,
    streaks.longest,
    articlesThisWeek
  );

  return {
    totalArticlesRead: history.length,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    articlesThisWeek,
    articlesThisMonth,
    topCategories,
    readingHistory: history.slice(0, 50),
    lastReadDate,
    badges,
  };
}

function calculateBadges(
  totalRead: number,
  currentStreak: number,
  longestStreak: number,
  weeklyRead: number
): Badge[] {
  const badges: Badge[] = [
    {
      id: "first_article",
      name: "First Steps",
      description: "Read your first article",
      earned: totalRead >= 1,
    },
    {
      id: "streak_3",
      name: "Consistent Reader",
      description: "Maintain a 3-day reading streak",
      earned: currentStreak >= 3,
    },
    {
      id: "streak_7",
      name: "Week Warrior",
      description: "Maintain a 7-day reading streak",
      earned: currentStreak >= 7,
    },
    {
      id: "streak_30",
      name: "Monthly Master",
      description: "Maintain a 30-day reading streak",
      earned: longestStreak >= 30,
    },
    {
      id: "articles_10",
      name: "Getting Started",
      description: "Read 10 articles",
      earned: totalRead >= 10,
    },
    {
      id: "articles_50",
      name: "Knowledgeable",
      description: "Read 50 articles",
      earned: totalRead >= 50,
    },
    {
      id: "articles_100",
      name: "News Enthusiast",
      description: "Read 100 articles",
      earned: totalRead >= 100,
    },
    {
      id: "weekly_10",
      name: "Weekly Reader",
      description: "Read 10 articles in a week",
      earned: weeklyRead >= 10,
    },
  ];

  return badges;
}

export function getReadingCalendar(days = 90): Map<string, number> {
  const history = getReadingHistory();
  const calendar = new Map<string, number>();

  const now = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    calendar.set(dateStr ?? "", 0);
  }

  history.forEach((entry) => {
    if (calendar.has(entry.date)) {
      calendar.set(entry.date, (calendar.get(entry.date) ?? 0) + 1);
    }
  });

  return calendar;
}