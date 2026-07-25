import React from 'react';

const StatCard = ({ icon: Icon, title, count, description }) => {
  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-start gap-4">
      {Icon && (
        <div className="flex-shrink-0 p-3 rounded-xl bg-indigo-50 text-indigo-600">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        <h4 className="text-3xl font-extrabold text-gray-900 mt-1">{count}</h4>
        {description && <p className="text-xs text-gray-400 mt-1 font-medium">{description}</p>}
      </div>
    </div>
  );
};

export default StatCard;
