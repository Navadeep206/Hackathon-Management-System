import React from 'react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4">
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
        404
      </h1>
      <p className="mt-4 text-lg text-gray-500">
        Page Not Found
      </p>
    </div>
  );
};

export default NotFound;
