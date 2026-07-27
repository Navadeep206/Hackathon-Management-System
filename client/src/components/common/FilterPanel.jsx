import React from 'react';

const FilterPanel = ({ filters = [], activeFilters = {}, onFilterChange, onReset }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-gray-150">
        <h4 className="text-sm font-bold text-gray-900">Search Filters</h4>
        <button
          onClick={onReset}
          className="text-xs text-indigo-600 hover:underline font-bold transition-colors cursor-pointer"
        >
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
        {filters.map((filter) => (
          <div key={filter.name} className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              {filter.label}
            </label>
            <select
              value={activeFilters[filter.name] || ''}
              onChange={(e) => onFilterChange(filter.name, e.target.value)}
              className="w-full text-sm rounded-lg border border-gray-200 p-2 text-gray-700 bg-gray-50 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
            >
              <option value="">All {filter.label}</option>
              {filter.options.map((opt) => {
                const val = typeof opt === 'object' ? opt.value : opt;
                const label = typeof opt === 'object' ? opt.label : opt;
                return (
                  <option key={val} value={val}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterPanel;
