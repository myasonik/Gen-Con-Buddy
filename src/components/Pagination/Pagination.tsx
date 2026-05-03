import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { Select } from "../../ui/Select/Select";
import { Toggletip } from "../../ui/Toggletip/Toggletip";
import { BACKEND_MAX_RESULTS, PAGE_SIZE_OPTIONS } from "../../utils/constants";
import styles from "./Pagination.module.css";

function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  if (page > 3) {
    pages.push("...");
  }
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (page < totalPages - 2) {
    pages.push("...");
  }
  pages.push(totalPages);
  return pages;
}

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onNavigate: (page: number, limit: number) => void;
  "aria-label"?: string;
  singleLine?: boolean;
}

export function Pagination({
  page,
  limit,
  total,
  onNavigate,
  "aria-label": ariaLabel = "Pagination",
  singleLine = false,
}: PaginationProps): React.JSX.Element {
  const naturalTotalPages = Math.ceil(total / limit);
  const maxPages = Math.floor(BACKEND_MAX_RESULTS / limit);
  const totalPages = Math.min(naturalTotalPages, maxPages);
  const isTruncated = naturalTotalPages > maxPages;
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <nav aria-label={ariaLabel} className={styles.nav}>
      <div className={styles.controls}>
        {total.toLocaleString()} events
        {!singleLine && isTruncated && (
          <Toggletip
            label="Why are some pages unavailable?"
            message={`Results are capped at ${BACKEND_MAX_RESULTS.toLocaleString()} events. Narrow your search to see more.`}
          />
        )}
        <Button
          variant="secondary"
          className={styles.navButton}
          onClick={() => onNavigate(page - 1, limit)}
          disabled={page === 1}
          aria-label="Previous"
        >
          <ChevronLeft size={14} aria-hidden="true" />
        </Button>
        {pageNumbers.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} aria-hidden className={styles.ellipsis}>
              …
            </span>
          ) : (
            <Button
              key={p}
              variant="secondary"
              onClick={() => onNavigate(p, limit)}
              aria-current={p === page ? "page" : undefined}
              disabled={p === page}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="secondary"
          className={styles.navButton}
          onClick={() => onNavigate(page + 1, limit)}
          disabled={page === totalPages}
          aria-label="Next"
        >
          <ChevronRight size={14} aria-hidden="true" />
        </Button>
      </div>
      {!singleLine && (
        <div className={styles.summary}>
          <label className={styles.perPageLabel}>
            Per page
            <Select
              value={String(limit)}
              onValueChange={(v) => onNavigate(1, Number(v))}
              options={PAGE_SIZE_OPTIONS.map((opt) => ({ value: String(opt), label: String(opt) }))}
            />
          </label>
        </div>
      )}
    </nav>
  );
}
