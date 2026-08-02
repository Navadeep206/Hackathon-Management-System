import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const role = user.role;
        if (role === 'Admin') navigate('/admin/dashboard', { replace: true });
        else if (role === 'Organizer') navigate('/organizer/dashboard', { replace: true });
        else if (role === 'Participant') navigate('/participant/dashboard', { replace: true });
        else if (role === 'Judge') navigate('/judge/dashboard', { replace: true });
        else navigate('/', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Redirecting to workspace...</p>
      </div>
    </div>
  );
};

export default DashboardRedirect;
