"use client";

import { Input } from "@/components/ui/input";

export function FilterBar({
  search,
  category,
  examType,
  categories,
  examTypes,
  onSearchChange,
  onCategoryChange,
  onExamTypeChange
}: {
  search: string;
  category: string;
  examType: string;
  categories: string[];
  examTypes: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onExamTypeChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl lg:grid-cols-[1fr_220px_220px]">
      <Input
        label="Search courses"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search NDA, AFCAT, SSB..."
      />
      <label className="block">
        <span className="text-sm font-medium text-ink">Category</span>
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="mt-2 h-12 w-full rounded border border-white/12 bg-navy-deep px-4 text-sm text-white outline-none focus:border-gold"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-ink">Exam type</span>
        <select
          value={examType}
          onChange={(event) => onExamTypeChange(event.target.value)}
          className="mt-2 h-12 w-full rounded border border-white/12 bg-navy-deep px-4 text-sm text-white outline-none focus:border-gold"
        >
          <option value="">All exams</option>
          {examTypes.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
