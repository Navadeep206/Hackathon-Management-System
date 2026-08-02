import React from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

const SearchBar = ({ value, onChange, placeholder = 'Search...', onClear }) => {
  return (
    <div className="relative flex-grow">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-cyan-600">
        <FaSearch className="h-4 w-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm font-bold text-slate-950 shadow-xl shadow-slate-200/70 transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-100"
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Clear search"
        >
          <FaTimes className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
