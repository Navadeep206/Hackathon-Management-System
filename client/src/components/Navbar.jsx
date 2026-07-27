import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaSignOutAlt, FaUserCircle, FaCompass, FaAward } from 'react-icons/fa';
import api from '../services/api';

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);

  const fetchUser = () => {
    try {
      const storedUser = localStorage.getItem('user');
      setUser(storedUser ? JSON.parse(storedUser) : null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
    // Listen for storage events (e.g. login/logout in other tabs or components)
    window.addEventListener('storage', fetchUser);
    return () => window.removeEventListener('storage', fetchUser);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error on backend:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsOpen(false);
    navigate('/login');
    window.dispatchEvent(new Event('storage'));
  };

  // Determine dashboard link based on role
  const getDashboardPath = () => {
    if (!user) return null;
    const role = user.role;
    if (role === 'Admin') return '/admin/dashboard';
    if (role === 'Organizer') return '/organizer/dashboard';
    if (role === 'Participant') return '/participant/dashboard';
    if (role === 'Judge') return '/judge/dashboard';
    return null;
  };

  const dashboardPath = getDashboardPath();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-extrabold text-indigo-650 tracking-tight">
                HackathonManager
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="border-transparent text-gray-500 hover:border-indigo-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-semibold transition-colors"
              >
                Home
              </Link>
              {dashboardPath && (
                <Link
                  to={dashboardPath}
                  className="border-transparent text-gray-500 hover:border-indigo-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-semibold transition-colors"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <FaUserCircle className="h-5 w-5 text-gray-400" />
                  <div className="text-left leading-none">
                    <p className="text-sm font-bold text-gray-900">{user.name}</p>
                    <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">
                      {user.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-gray-500 hover:text-red-600 px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200"
                >
                  <FaSignOutAlt className="text-xs" /> Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl text-sm font-bold transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-indigo-650 text-white hover:bg-indigo-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-indigo-150 transition-all duration-150"
                >
                  Signup
                </Link>
              </>
            )}
          </div>

          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus:outline-none transition-all cursor-pointer"
            >
              {isOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden bg-white border-b border-gray-100 animate-in slide-in-from-top duration-200">
          <div className="pt-2 pb-4 space-y-1 px-4">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 block px-3 py-2 rounded-xl text-base font-semibold"
            >
              Home
            </Link>
            {dashboardPath && (
              <Link
                to={dashboardPath}
                onClick={() => setIsOpen(false)}
                className="text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 block px-3 py-2 rounded-xl text-base font-semibold"
              >
                Dashboard
              </Link>
            )}

            <div className="pt-4 border-t border-gray-100 mt-4">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl">
                    <FaUserCircle className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-none">{user.name}</p>
                      <p className="text-xs text-indigo-500 font-bold mt-1 uppercase tracking-wider">{user.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-red-50 text-red-650 hover:bg-red-100 border border-red-150 transition-all cursor-pointer"
                  >
                    <FaSignOutAlt className="text-xs" /> Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-650 hover:bg-indigo-700 shadow-sm shadow-indigo-150 transition-all"
                  >
                    Signup
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
