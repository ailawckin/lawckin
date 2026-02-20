import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";

interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function SearchPagination({ currentPage, totalPages, onPageChange }: SearchPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <Pagination className="mt-8">
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
  );
}
