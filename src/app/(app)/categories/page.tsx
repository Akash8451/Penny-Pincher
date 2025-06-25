
'use client';
import { AppHeader } from '@/components/layout/app-header';
import CategoryManager from '@/components/categories/category-manager';

export default function CategoriesPage() {
  return (
    <>
      <AppHeader title="Manage Categories" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <CategoryManager />
      </div>
    </>
  );
}
