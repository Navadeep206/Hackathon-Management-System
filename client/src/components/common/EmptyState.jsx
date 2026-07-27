import React from 'react';
import { FaInbox } from 'react-icons/fa';

const EmptyState = ({
  icon: Icon = FaInbox,
  title = 'No Items Found',
  message = 'Adjust your keywords, reset filters, or perform a new search to find records.',
  action,
}) => {
  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-10 text-center shadow-sm max-w-md mx-auto my-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-indigo-50 text-indigo-600 mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
        {message}
      </p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
};

export default EmptyState;
