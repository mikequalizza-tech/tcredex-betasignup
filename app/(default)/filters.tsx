'use client';

import { useCategory } from './category-provider';

const categories = [
  { name: 'All', value: 'all' },
  { name: 'Updates', value: 'updates' },
  { name: 'Engineering', value: 'engineering' },
  { name: 'Product', value: 'product' },
];

export default function BlogFilters() {
  const { category, setCategory } = useCategory();

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => setCategory(cat.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            category === cat.value
              ? 'bg-indigo-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
