"use client";

import * as React from "react";
import {
  BadgeCheck,
  ClipboardList,
  CreditCard,
  Cpu,
  FileSignature,
  FileText,
  HardDrive,
  LayoutGrid,
  Loader2,
  PackageOpen,
  Search,
  Users,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchResultSheet } from "@/components/search-result-sheet";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/app/api/search/route";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pickup: PackageOpen,
  quote: FileText,
  po: FileSignature,
  payment: CreditCard,
  dataWiping: HardDrive,
  device: Cpu,
  certificate: BadgeCheck,
  grn: ClipboardList,
  consolidated: LayoutGrid,
  user: Users,
};

export function GlobalSearch() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [selected, setSelected] = React.useState<SearchResult | null>(null);

  const handleChange = (next: string) => {
    setValue(next);
    if (next.trim()) {
      setOpen(true);
      setActive(0);
    } else {
      setOpen(false);
      setResults([]);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    let active = true;
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (!active) return;
        setResults(res.ok ? (data.results ?? []) : []);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [value]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  const select = (result: SearchResult) => {
    setOpen(false);
    setValue("");
    setResults([]);
    setLoading(false);
    setSelected(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const result = results[active];
      if (result) {
        select(result);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.trim()) setOpen(true);
          }}
          placeholder="Search anything... (Ctrl+K)"
          className="h-9 pl-8 pr-16"
          aria-label="Global search"
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              handleChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        )}
      </div>

      {open && value.trim() !== "" && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results.map((result, index) => {
                const IconComponent =
                  typeIcons[result.type] ?? Search;
                return (
                  <button
                    key={`${result.type}-${result.title}-${index}`}
                    type="button"
                    onClick={() => select(result)}
                    onMouseEnter={() => setActive(index)}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                      index === active
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground"
                    )}
                  >
                    <IconComponent className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {result.title}
                      </span>
                      {result.subtitle && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {result.subtitle}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {result.typeLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <SearchResultSheet
        result={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}