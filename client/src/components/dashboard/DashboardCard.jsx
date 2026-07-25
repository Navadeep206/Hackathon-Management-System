import React from 'react';

const DashboardCard = ({ title, subtitle, action, children }) => {
  return (
    <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-1 font-medium">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      <div className="p-6 flex-grow">
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;
