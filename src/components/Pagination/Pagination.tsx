import clsx from "clsx";
import { Button } from "../../ui/Button/Button";
import { Toggletip } from "../../ui/Toggletip/Toggletip";
import styles from "./Pagination.module.css";

const PAGE_SIZE_OPTIONS = [100, 500, 1000] as const;
const BACKEND_MAX_RESULTS = 10_000;

function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (page > 3) pages.push("...");
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (page < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onNavigate: (page: number, limit: number) => void;
}

export function Pagination({
  page,
  limit,
  total,
  onNavigate,
}: PaginationProps) {
  const naturalTotalPages = Math.ceil(total / limit);
  const maxPages = Math.floor(BACKEND_MAX_RESULTS / limit);
  const totalPages = Math.min(naturalTotalPages, maxPages);
  const isTruncated = naturalTotalPages > maxPages;
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <nav aria-label="Pagination" className={styles.nav}>
      <div className={styles.controls}>
        <Button
          variant="secondary"
          className={styles.navButton}
          onClick={() => onNavigate(page - 1, limit)}
          disabled={page === 1}
        >
          ◀ Previous
        </Button>
        <span className={styles.pageLabel}>
          Page {page} of {totalPages}
        </span>
        {isTruncated && (
          <Toggletip
            label="Why are some pages unavailable?"
            message={`Results are capped at ${BACKEND_MAX_RESULTS.toLocaleString()} events. Narrow your search to see more.`}
          />
        )}
        {pageNumbers.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} aria-hidden className={styles.ellipsis}>
              …
            </span>
          ) : (
            <Button
              key={p}
              variant="secondary"
              className={clsx(styles.pageButton, {
                [styles.activePage]: p === page,
              })}
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
        >
          Next ▶
        </Button>
      </div>
      <div className={styles.summary}>
        {total.toLocaleString()} events
        <label className={styles.perPageLabel}>
          Per page
          <select
            value={limit}
            onChange={(e) => onNavigate(1, Number(e.target.value))}
            className={styles.perPageSelect}
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      </div>
    </nav>
  );
}
