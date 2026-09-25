import { Button } from "@/components/button/button";
import { Select } from "@/components/select/select";
import { getPaginationItems } from "./pagination-items";
import { tableStyles } from "./table.styles";

export type TablePaginationProps = {
  /** 1-based current page. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageSizeChange: (pageSize: number) => void;
};

export function TablePagination({
  page,
  pageCount,
  onPageChange,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: TablePaginationProps) {
  const styles = tableStyles();
  // Never leave the active size out of the list, or the select would show a
  // value it can't represent.
  const sizes = [...new Set([...pageSizeOptions, pageSize])].sort(
    (a, b) => a - b,
  );

  return (
    <>
      <div className={styles.pageSizeLabel()}>
        <span aria-hidden>Rows per page</span>
        <Select
          size="sm"
          aria-label="Rows per page"
          options={sizes.map((size) => ({ value: String(size) }))}
          value={String(pageSize)}
          onValueChange={(next) => onPageSizeChange(Number(next))}
        />
      </div>
      <nav aria-label="Pagination" className={styles.pagination()}>
        <Button
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous page
        </Button>
        {getPaginationItems(page, pageCount).map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              aria-hidden
              className={styles.pageEllipsis()}
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              size="sm"
              aria-label={`Page ${item}`}
              aria-current={item === page ? "page" : undefined}
              selected={item === page}
              className="min-w-8"
              onClick={() => onPageChange(item)}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next page
        </Button>
      </nav>
    </>
  );
}
