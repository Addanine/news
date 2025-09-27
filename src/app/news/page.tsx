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
}

export default function NewsPage() {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);
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

  useEffect(() => {
    async function fetchData() {
      try {
        const [dailyRes, likesRes] = await Promise.all([
          fetch('/api/daily'),
          fetch(`/api/articles/like?sessionId=${sessionId}`)
        ]);

        const dailyData = await dailyRes.json() as { article?: Article };
        const likesData = await likesRes.json() as { likes?: string[] };
        
        if (dailyData.article) {
          setArticle(dailyData.article);
          if (likesData.likes?.includes(dailyData.article.id)) {
            setLiked(true);
          }
        }
      } catch (err) {
        setError('failed to load daily article');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [sessionId]);

  const handleLike = async () => {
    if (!article) return;

    try {
      const response = await fetch('/api/articles/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id, sessionId }),
      });

      const data = await response.json() as { liked?: boolean };
      
      if (data.liked !== undefined) {
        setLiked(data.liked);
      }
    } catch (err) {
      console.error('Failed to like article:', err);
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
              
              {article.description && (
                <p className="text-lg text-gray-700 leading-relaxed">
                  {article.description}
                </p>
              )}

              <div className="flex items-center gap-4 pt-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 border border-black px-4 py-2 text-sm transition-colors ${
                    liked 
                      ? 'bg-black text-white' 
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {liked ? '♥' : '♡'} {liked ? 'liked' : 'like'}
                </button>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-black px-4 py-2 text-sm hover:bg-black hover:text-white transition-colors"
                >
                  read original →
                </a>
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