import React from 'react';

const RecentActivity = ({ title, activities, emptyMessage = 'No recent activities.' }) => {
  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
      <h3 className="text-base font-bold text-gray-900 mb-4">{title}</h3>
      {activities && activities.length > 0 ? (
        <ul className="divide-y divide-gray-100">
          {activities.map((act, idx) => (
            <li key={idx} className="py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-semibold text-gray-800">{act.primary}</p>
                {act.secondary && <p className="text-xs text-gray-400 mt-0.5 font-medium">{act.secondary}</p>}
              </div>
              {act.badge && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${act.badgeClass || 'bg-gray-100 text-gray-800'}`}>
                  {act.badge}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400 italic font-medium py-4 text-center">{emptyMessage}</p>
      )}
    </div>
  );
};

export default RecentActivity;
