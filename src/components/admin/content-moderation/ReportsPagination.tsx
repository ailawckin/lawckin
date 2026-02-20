import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";

interface ReportsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

export function ReportsPagination({
  currentPage,
  totalPages,
  totalCount,
  perPage,
  onPageChange,
}: ReportsPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, totalCount);

  return (
    <div className="mt-4">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="ghost"
              size="default"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="gap-1 pl-2.5"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
          </PaginationItem>

          {pages.map((page, index) => {
            const showPage =
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1);

            if (showPage) {
              return (
                <PaginationItem key={page}>
                  <Button
                    variant={page === currentPage ? "outline" : "ghost"}
                    size="icon"
                    onClick={() => onPageChange(page)}
                    className="h-9 w-9"
                  >
                    {page}
                  </Button>
                </PaginationItem>
              );
            }

            const prevPage = pages[index - 1];
            const showEllipsis = prevPage !== undefined && page - prevPage > 1;

            if (showEllipsis) {
              return (
                <PaginationItem key={`ellipsis-${page}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }

            return null;
          })}

          <PaginationItem>
            <Button
              variant="ghost"
              size="default"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="gap-1 pr-2.5"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="text-sm text-muted-foreground text-center mt-2">
        Showing {start} to {end} of {totalCount} reports
      </p>
    </div>
  );
}
