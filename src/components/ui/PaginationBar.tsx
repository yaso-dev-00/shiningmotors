
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PaginationBar = ({ currentPage, totalPages, onPageChange }: PaginationBarProps) => {
  // Generate array of page numbers to display
  const generatePaginationItems = () => {
    const items = [];
    
    // Always show first page
    items.push(1);
    
    // Starting page number after first page
    let startPage = Math.max(2, currentPage - 1);
    
    // If we're far from start, add ellipsis
    if (startPage > 2) {
      items.push('ellipsis');
    }
    
    // Add pages around current page
    for (let i = startPage; i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i !== 1 && i !== totalPages) { // Avoid duplicating first and last
        items.push(i);
      }
    }
    
    // If we're far from end, add ellipsis
    if (currentPage + 1 < totalPages - 1) {
      items.push('ellipsis');
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(totalPages);
    }
    
    return items;
  };
  
  const paginationItems = generatePaginationItems();
  
  return (
    <div className="mt-8 flex justify-center">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              aria-disabled={currentPage === 1}
            />
          </PaginationItem>
          
          {paginationItems.map((item, index) => (
            item === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <span className="mx-2">...</span>
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationLink
                  isActive={currentPage === item}
                  onClick={() => onPageChange(item as number)}
                  className="cursor-pointer"
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            )
          ))}
          
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages || totalPages === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              aria-disabled={currentPage === totalPages || totalPages === 0}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
