"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { exercises } from "@/lib/data/exercises";
import { ExerciseFigure } from "@/components/ExerciseFigure";
import { Card, Pill } from "@/components/ui";
import type { ExerciseCategory } from "@/lib/types";

const categories: { value: ExerciseCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "warmup", label: "Warm-up" },
  { value: "strength", label: "Strength" },
  { value: "cardio", label: "Cardio" },
  { value: "core", label: "Core" },
  { value: "mobility", label: "Mobility" },
];

export default function ExercisesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ExerciseCategory | "all">("all");

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesCategory = category === "all" || ex.category === category;
      const matchesQuery = ex.name.toLowerCase().includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <div className="space-y-5 px-4 pt-6 md:px-6">
      <h1 className="text-2xl font-semibold text-text">Exercise Library</h1>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises"
          aria-label="Search exercises"
          className="w-full rounded-full border border-border bg-bg-elevated py-3 pl-10 pr-4 text-sm text-text placeholder:text-text-faint focus:border-primary focus:outline-none"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {categories.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              category === c.value ? "bg-primary text-primary-foreground" : "border border-border text-text-muted"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-text-muted">No exercises match &quot;{query}&quot;.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((ex) => (
            <Link key={ex.id} href={`/exercises/${ex.id}`}>
              <Card className="flex h-full flex-col items-center gap-2 text-center !p-3">
                <div className="aspect-square w-full max-w-[120px] rounded-xl bg-bg-subtle">
                  <ExerciseFigure pattern={ex.animation} equipment={ex.equipment} title={ex.name} />
                </div>
                <p className="text-sm font-medium leading-tight text-text">{ex.name}</p>
                <Pill tone="neutral">{ex.category}</Pill>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
