import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`h-9 w-9 text-sm font-bold rounded-lg transition-all cursor-pointer ${
            page === i
              ? 'bg-indigo-650 text-white shadow-sm shadow-indigo-200'
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between border-t border-gray-150 px-4 py-4 sm:px-6 mt-6">
      {/* Mobile styling */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className={`inline-flex items-center rounded-lg border border-gray-250 bg-white px-4 py-2 text-sm font-semibold text-gray-750 transition-colors ${
            page === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
          }`}
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className={`inline-flex items-center rounded-lg border border-gray-250 bg-white px-4 py-2 text-sm font-semibold text-gray-750 transition-colors ${
            page === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
          }`}
        >
          Next
        </button>
      </div>

      {/* Desktop styling */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">
            Showing page <span className="font-bold text-gray-800">{page}</span> of{' '}
            <span className="font-bold text-gray-800">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md gap-1" aria-label="Pagination">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-750 transition-colors cursor-pointer ${
                page === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
            >
              <FaChevronLeft className="h-3 w-3" />
            </button>
            {renderPageNumbers()}
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={`h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-750 transition-colors cursor-pointer ${
                page === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
            >
              <FaChevronRight className="h-3 w-3" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
