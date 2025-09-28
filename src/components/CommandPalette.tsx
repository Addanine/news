"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getReadingHistory } from "~/lib/reading-tracker";

interface CommandPaletteItem {
  id: string;
  title: string;
  description?: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [historyItems, setHistoryItems] = useState<CommandPaletteItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) return;

    const history = getReadingHistory();
    const mapped = history.map((entry) => ({
      id: entry.articleId,
      title: entry.title,
      description: `${entry.source} · ${entry.date}`,
      action: () => {
        router.push(`/article/${encodeURIComponent(entry.articleId)}`);
        onClose();
      },
    }));

    const navItems: CommandPaletteItem[] = [
      {
        id: "news",
        title: "Go to news feed",
        description: "Navigate to the main daily article",
        action: () => {
          router.push("/news");
          onClose();
        },
      },
      {
        id: "insights",
        title: "Open insights dashboard",
        action: () => {
          router.push("/insights");
          onClose();
        },
      },
      {
        id: "recommendations",
        title: "View recommendations",
        action: () => {
          router.push("/recommendations");
          onClose();
        },
      },
      {
        id: "gallery",
        title: "Browse gallery",
        action: () => {
          router.push("/gallery");
          onClose();
        },
      },
      {
        id: "settings",
        title: "Update preferences",
        action: () => {
          router.push("/settings");
          onClose();
        },
      },
    ];

    setHistoryItems([...navItems, ...mapped]);
    setQuery("");
    setActiveIndex(0);
  }, [open, onClose, router]);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return historyItems;

    return historyItems.filter((item) =>
      item.title.toLowerCase().includes(normalizedQuery) ||
      (item.description?.toLowerCase().includes(normalizedQuery) ?? false)
    );
  }, [historyItems, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyNavigation = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(filteredItems.length, 1));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + Math.max(filteredItems.length, 1)) % Math.max(filteredItems.length, 1));
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const item = filteredItems[activeIndex];
      if (item) {
        item.action();
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-24" role="dialog" aria-modal>
      <div className="w-full max-w-2xl overflow-hidden border border-black bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-950">
        <div className="border-b border-black dark:border-gray-700">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyNavigation}
            className="w-full bg-transparent px-5 py-4 text-base outline-none placeholder:text-gray-400 dark:text-white"
            placeholder="Search articles, history, or navigate..."
            aria-label="Search articles"
          />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filteredItems.length === 0 && (
            <div className="px-5 py-6 text-sm text-gray-600 dark:text-gray-300">
              No matches found. Try another keyword.
            </div>
          )}
          {filteredItems.map((item, index) => (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex w-full flex-col items-start gap-1 border-b border-black/5 px-5 py-3 text-left transition-colors last:border-b-0 dark:border-gray-800 ${
                index === activeIndex ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</span>
              {item.description && (
                <span className="text-xs text-gray-600 dark:text-gray-300">{item.description}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
