import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';

const Forbidden = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 sm:px-6 lg:px-8 text-center">
      <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-50 text-red-650 mb-6 border border-red-100">
        <FaLock className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
        403 - Forbidden Access
      </h1>
      <p className="mt-4 text-lg text-gray-500 max-w-md mx-auto font-medium">
        You do not have the required permissions to view this dashboard page. Please verify your credentials or log in as a different user.
      </p>
      <div className="mt-8 flex gap-4 justify-center">
        <button
          onClick={() => navigate(-1)}
          className="bg-white border border-gray-300 hover:bg-gray-55 text-gray-700 font-semibold py-2.5 px-5 rounded-lg shadow-sm transition-all text-sm cursor-pointer"
        >
          Go Back
        </button>
        <button
          onClick={() => navigate('/')}
          className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold py-2.5 px-5 rounded-lg shadow-sm transition-all text-sm cursor-pointer"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export default Forbidden;
