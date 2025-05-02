import React from "react";
import { cn } from "~/utils/cn";
import { Button } from "./Button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    // Always show first page
    pages.push(1);
    
    // Calculate range around current page
    let rangeStart = Math.max(2, currentPage - 1);
    let rangeEnd = Math.min(totalPages - 1, currentPage + 1);
    
    // Add ellipsis if needed before range
    if (rangeStart > 2) {
      pages.push("...");
    }
    
    // Add pages in range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }
    
    // Add ellipsis if needed after range
    if (rangeEnd < totalPages - 1) {
      pages.push("...");
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className={cn("flex items-center justify-center space-x-1", className)}
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        &laquo;
      </Button>
      
      {pageNumbers.map((page, index) => {
        if (typeof page === "string") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-gray-500"
            >
              {page}
            </span>
          );
        }
        
        return (
          <Button
            key={page}
            variant={currentPage === page ? "primary" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            aria-current={currentPage === page ? "page" : undefined}
            aria-label={`Page ${page}`}
          >
            {page}
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        &raquo;
      </Button>
    </nav>
  );
};
