"use client";

import type { Category } from "~/lib/news-aggregator";

interface CategoryConfig {
  id: Category;
  label: string;
  icon: string;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'science-innovation', label: 'science & innovation', icon: '🔬' },
  { id: 'environment', label: 'environment', icon: '🌱' },
  { id: 'community', label: 'community', icon: '🤝' },
  { id: 'kindness', label: 'kindness', icon: '💝' },
  { id: 'health-recovery', label: 'health & recovery', icon: '⚕️' },
  { id: 'education', label: 'education', icon: '📚' },
  { id: 'global-progress', label: 'global progress', icon: '🌍' },
  { id: 'technology', label: 'technology', icon: '💻' },
];

interface CategoryFilterProps {
  selected: Category[];
  onChange: (categories: Category[]) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const toggleCategory = (categoryId: Category) => {
    if (selected.includes(categoryId)) {
      onChange(selected.filter(id => id !== categoryId));
    } else {
      onChange([...selected, categoryId]);
    }
  };

  const selectAll = () => {
    onChange(CATEGORIES.map(c => c.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="border-b border-black pb-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-normal">filter by category</h3>
        <div className="flex gap-2 text-xs">
          <button
            onClick={selectAll}
            className="hover:underline"
          >
            select all
          </button>
          <span>|</span>
          <button
            onClick={clearAll}
            className="hover:underline"
          >
            clear all
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => toggleCategory(category.id)}
            className={`border border-black px-3 py-1.5 text-xs transition-colors ${
              selected.includes(category.id)
                ? 'bg-black text-white'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <span className="mr-1">{category.icon}</span>
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
}