'use client';

import { useCallback } from 'react';

interface Category {
  id: number;
  name: string;
  sortOrder: number;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelect: (categoryId: number | null) => void;
}

export default function CategoryFilter({ categories, selectedCategory, onSelect }: CategoryFilterProps) {
  const handleClick = useCallback(
    (id: number | null) => {
      onSelect(id === selectedCategory ? null : id);
    },
    [selectedCategory, onSelect],
  );

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleClick(null)}
        className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
          selectedCategory === null
            ? 'bg-gray-900 text-white shadow-sm'
            : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        전체
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleClick(cat.id)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
            selectedCategory === cat.id
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
