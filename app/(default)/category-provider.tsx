'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface CategoryContextType {
  category: string;
  setCategory: (category: string) => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function useCategory() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
}

export default function CategoryProvider({ children }: { children: ReactNode }) {
  const [category, setCategory] = useState<string>('all');

  return (
    <CategoryContext.Provider value={{ category, setCategory }}>
      {children}
    </CategoryContext.Provider>
  );
}
