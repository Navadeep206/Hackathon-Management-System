import React, { useEffect } from 'react';
import { FaExclamationCircle, FaCheckCircle, FaTimes } from 'react-icons/fa';

export const Toast = ({ message, type = 'error', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bg =
    type === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-100/50'
      : 'bg-red-50 border-red-200 text-red-800 shadow-red-100/50';
  
  const Icon = type === 'success' ? FaCheckCircle : FaExclamationCircle;
  const iconColor = type === 'success' ? 'text-emerald-500' : 'text-red-500';

  return (
    <div
      className={`fixed bottom-5 right-5 z-[100] max-w-sm w-full border rounded-xl p-4 shadow-xl flex gap-3 items-start animate-in slide-in-from-bottom-5 fade-in duration-300 ${bg}`}
    >
      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
      <div className="flex-grow">
        <p className="text-sm font-bold capitalize">{type}</p>
        <p className="text-xs font-semibold mt-0.5 leading-relaxed">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <FaTimes className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

const ErrorMessage = ({ message, title = 'An Error Occurred' }) => {
  if (!message) return null;

  return (
    <div className="bg-red-50 border border-red-150 rounded-xl p-4 flex gap-3 text-red-800 max-w-md mx-auto my-4 shadow-sm animate-in fade-in duration-200">
      <FaExclamationCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-500" />
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs font-semibold mt-0.5 leading-relaxed">{message}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
