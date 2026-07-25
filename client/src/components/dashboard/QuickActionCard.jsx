import React from 'react';

const QuickActionCard = ({ icon: Icon, title, description, actionText, onClick }) => {
  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <h4 className="text-base font-bold text-gray-900">{title}</h4>
        </div>
        {description && <p className="text-sm text-gray-500 mt-2 font-medium">{description}</p>}
      </div>
      <button
        onClick={onClick}
        className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-all duration-150 cursor-pointer shadow-sm text-center"
      >
        {actionText}
      </button>
    </div>
  );
};

export default QuickActionCard;
