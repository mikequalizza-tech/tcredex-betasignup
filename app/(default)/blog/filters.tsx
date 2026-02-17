"use client";

import { useCategoryProvider } from "./category-provider";

export default function BlogFilters() {
  const { category, setCategory } = useCategoryProvider();

  // Categories sorted by type: Tax Credits first, then Industry topics
  const categories = [
    { name: "All", label: "View All" },
    // Tax Credit Programs
    { name: "NMTC", label: "NMTC" },
    { name: "HTC", label: "HTC" },
    { name: "OZ", label: "Opportunity Zones" },
    { name: "Housing Finance", label: "Housing Finance" },
    { name: "State Credits", label: "State Credits" },
    // Industry Topics
    { name: "Strategies", label: "Strategies" },
    { name: "Construction", label: "Construction" },
    { name: "Development", label: "Development" },
    { name: "Compliance", label: "Compliance" },
  ];

  return (
    <div className="flex justify-center pb-12 max-md:hidden md:pb-20">
      <div className="relative inline-flex flex-wrap justify-center rounded-[1.25rem] bg-gray-800/40 p-1">
        {categories.map((cat) => (
          <button
            key={cat.name}
            className={`flex h-8 flex-1 items-center gap-2.5 whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-indigo-200 ${
              category === cat.name
                ? "relative bg-linear-to-b from-gray-900 via-gray-800/60 to-gray-900 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_bottom,--theme(--color-indigo-500/0),--theme(--color-indigo-500/.5))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]"
                : "opacity-65 transition-opacity hover:opacity-90"
            }`}
            aria-pressed={category === cat.name}
            onClick={() => setCategory(cat.name)}
          >
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
