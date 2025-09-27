import type { Category } from "./news-aggregator";
import { getReadingHistory } from "./reading-tracker";

export interface ArticleForRecommendation {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  source: string;
  author?: string;
  categories: Category[];
}

export interface RecommendationScore {
  article: ArticleForRecommendation;
  score: number;
  reasons: string[];
}

interface CategoryPreference {
  category: Category;
  weight: number;
  recentBoost: number;
}

interface SourcePreference {
  source: string;
  weight: number;
}

export function generateRecommendations(
  availableArticles: ArticleForRecommendation[],
  limit = 10
): RecommendationScore[] {
  const history = getReadingHistory();

  if (history.length === 0) {
    return availableArticles.slice(0, limit).map((article) => ({
      article,
      score: 0.5,
      reasons: ["New user - showing popular articles"],
    }));
  }

  const categoryPreferences = calculateCategoryPreferences(history);
  const sourcePreferences = calculateSourcePreferences(history);
  const readArticleIds = new Set(history.map((entry) => entry.articleId));

  const scoredArticles = availableArticles
    .filter((article) => !readArticleIds.has(article.id))
    .map((article) => {
      const { score, reasons } = calculateArticleScore(
        article,
        categoryPreferences,
        sourcePreferences,
        history
      );

      return {
        article,
        score,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scoredArticles;
}

function calculateCategoryPreferences(
  history: ReturnType<typeof getReadingHistory>
): CategoryPreference[] {
  const categoryCount = new Map<Category, number>();
  const recentCategoryCount = new Map<Category, number>();

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  history.forEach((entry) => {
    entry.categories.forEach((cat) => {
      categoryCount.set(cat, (categoryCount.get(cat) ?? 0) + 1);

      if (entry.timestamp > weekAgo) {
        recentCategoryCount.set(cat, (recentCategoryCount.get(cat) ?? 0) + 1);
      }
    });
  });

  const totalReads = history.length;
  const recentReads = history.filter((e) => e.timestamp > weekAgo).length;

  return Array.from(categoryCount.entries()).map(([category, count]) => ({
    category,
    weight: count / totalReads,
    recentBoost:
      recentReads > 0 ? (recentCategoryCount.get(category) ?? 0) / recentReads : 0,
  }));
}

function calculateSourcePreferences(
  history: ReturnType<typeof getReadingHistory>
): SourcePreference[] {
  const sourceCount = new Map<string, number>();

  history.forEach((entry) => {
    sourceCount.set(entry.source, (sourceCount.get(entry.source) ?? 0) + 1);
  });

  const totalReads = history.length;

  return Array.from(sourceCount.entries()).map(([source, count]) => ({
    source,
    weight: count / totalReads,
  }));
}

function calculateArticleScore(
  article: ArticleForRecommendation,
  categoryPreferences: CategoryPreference[],
  sourcePreferences: SourcePreference[],
  history: ReturnType<typeof getReadingHistory>
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const categoryScores = article.categories.map((cat) => {
    const pref = categoryPreferences.find((p) => p.category === cat);
    if (pref) {
      const categoryScore = pref.weight * 40 + pref.recentBoost * 20;
      return { category: cat, score: categoryScore };
    }
    return { category: cat, score: 0 };
  });

  const totalCategoryScore = categoryScores.reduce(
    (sum, cs) => sum + cs.score,
    0
  );
  score += totalCategoryScore;

  const topCategoryMatch = categoryScores.sort((a, b) => b.score - a.score)[0];
  if (topCategoryMatch && topCategoryMatch.score > 5) {
    reasons.push(`Matches your interest in ${topCategoryMatch.category}`);
  }

  const sourcePref = sourcePreferences.find((p) => p.source === article.source);
  if (sourcePref) {
    const sourceScore = sourcePref.weight * 15;
    score += sourceScore;
    if (sourceScore > 3) {
      reasons.push(`From ${article.source}, a source you read often`);
    }
  }

  const recencyBonus = calculateRecencyBonus(article.publishedAt);
  score += recencyBonus;
  if (recencyBonus > 5) {
    reasons.push("Recently published");
  }

  const diversityBonus = calculateDiversityBonus(article, history);
  score += diversityBonus;
  if (diversityBonus > 3) {
    reasons.push("Explores new topics for you");
  }

  const streakBonus = calculateStreakBonus(history);
  score += streakBonus;

  if (reasons.length === 0) {
    reasons.push("Recommended based on your reading profile");
  }

  return { score: Math.min(score, 100), reasons };
}

function calculateRecencyBonus(publishedAt: string): number {
  const published = new Date(publishedAt).getTime();
  const now = Date.now();
  const hoursSincePublished = (now - published) / (1000 * 60 * 60);

  if (hoursSincePublished < 6) return 10;
  if (hoursSincePublished < 24) return 7;
  if (hoursSincePublished < 48) return 4;
  if (hoursSincePublished < 72) return 2;
  return 0;
}

function calculateDiversityBonus(
  article: ArticleForRecommendation,
  history: ReturnType<typeof getReadingHistory>
): number {
  const readCategories = new Set<Category>();
  history.forEach((entry) => {
    entry.categories.forEach((cat) => readCategories.add(cat));
  });

  const hasNewCategory = article.categories.some(
    (cat) => !readCategories.has(cat)
  );

  if (hasNewCategory && history.length > 5) {
    return 5;
  }

  return 0;
}

function calculateStreakBonus(
  history: ReturnType<typeof getReadingHistory>
): number {
  if (history.length === 0) return 0;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const hasReadToday = history.some((entry) => entry.date === today);
  const hasReadYesterday = history.some((entry) => entry.date === yesterday);

  if (hasReadToday) return 0;
  if (hasReadYesterday) return 8;

  return 3;
}

export function getRecommendationInsights(
  recommendations: RecommendationScore[]
): {
  topReasons: string[];
  avgScore: number;
  categoryDistribution: { category: Category; count: number }[];
} {
  const allReasons = recommendations.flatMap((r) => r.reasons);
  const reasonCount = new Map<string, number>();

  allReasons.forEach((reason) => {
    reasonCount.set(reason, (reasonCount.get(reason) ?? 0) + 1);
  });

  const topReasons = Array.from(reasonCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([reason]) => reason);

  const avgScore =
    recommendations.length > 0
      ? recommendations.reduce((sum, r) => sum + r.score, 0) /
        recommendations.length
      : 0;

  const categoryCount = new Map<Category, number>();
  recommendations.forEach((r) => {
    r.article.categories.forEach((cat) => {
      categoryCount.set(cat, (categoryCount.get(cat) ?? 0) + 1);
    });
  });

  const categoryDistribution = Array.from(categoryCount.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return {
    topReasons,
    avgScore,
    categoryDistribution,
  };
}