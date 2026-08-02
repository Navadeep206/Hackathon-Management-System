import React from 'react';

const FilterPanel = ({ filters = [], activeFilters = {}, onFilterChange, onReset }) => {
  return (
    <div className="sticky top-24 space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/70 backdrop-blur">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <div>
          <p className="text-[10px] font-black uppercase text-cyan-600">Refine board</p>
          <h4 className="text-sm font-black text-slate-950">Search Filters</h4>
        </div>
        <button
          onClick={onReset}
          className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 transition-colors hover:bg-cyan-50 hover:text-cyan-700 cursor-pointer"
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
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700 transition-all focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-100"
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
