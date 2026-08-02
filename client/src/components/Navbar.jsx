import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaSignOutAlt, FaUserCircle, FaTachometerAlt, FaChevronDown, FaUser } from 'react-icons/fa';
import api from '../services/api';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
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
    window.addEventListener('storage', fetchUser);
    return () => window.removeEventListener('storage', fetchUser);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    setProfileDropdownOpen(false);
    setIsOpen(false);
    navigate('/login');
    window.dispatchEvent(new Event('storage'));
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    setIsOpen(false);
    if (location.pathname === '/') {
      document.getElementById('platform-highlights')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById('platform-highlights')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md shadow-xs select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Left Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="group flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 font-display">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-white border border-slate-800 shadow-sm transition-transform group-hover:-translate-y-0.5">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="4.5" r="2" />
                  <circle cx="17.3" cy="6.7" r="2" />
                  <circle cx="19.5" cy="12" r="2" />
                  <circle cx="17.3" cy="17.3" r="2" />
                  <circle cx="12" cy="19.5" r="2" />
                  <circle cx="6.7" cy="17.3" r="2" />
                  <circle cx="4.5" cy="12" r="2" />
                  <circle cx="6.7" cy="6.7" r="2" />
                </svg>
              </span>
              <span>Circle</span>
            </Link>
          </div>

          {/* Center Links Section (Desktop) */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  isActive && location.hash === ''
                    ? 'text-slate-900 bg-slate-50'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                }`
              }
            >
              Home
            </NavLink>
            {user && (
              <>
                <NavLink
                  to="/hackathons"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      isActive
                        ? 'text-slate-900 bg-slate-50'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                    }`
                  }
                >
                  Hackathons
                </NavLink>
                <NavLink
                  to="/leaderboard"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      isActive
                        ? 'text-slate-900 bg-slate-50'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                    }`
                  }
                >
                  Leaderboard
                </NavLink>
              </>
            )}
            <a
              href="#about"
              onClick={handleAboutClick}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-950"
            >
              About
            </a>
          </div>

          {/* Right Section (Desktop Auth state) */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2 transition-all text-slate-700 font-bold text-xs cursor-pointer shadow-xs"
                >
                  <FaUserCircle className="h-4 w-4 text-slate-400" />
                  <span>{user.name.split(' ')[0]}</span>
                  <FaChevronDown className={`text-[9px] transition-transform duration-250 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white p-2 text-slate-900 shadow-2xl border border-slate-100 ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150 z-30">
                    <div className="px-3.5 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-black text-slate-800 truncate">{user.name}</p>
                      <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider mt-0.5">{user.role}</p>
                    </div>
                    
                    <Link
                      to="/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all"
                    >
                      <FaTachometerAlt className="text-slate-450" /> Workspace
                    </Link>
                    
                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all"
                    >
                      <FaUser className="text-slate-455" /> Profile Settings
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-650 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                    >
                      <FaSignOutAlt className="text-red-400" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-650 hover:text-slate-950 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-slate-950 hover:bg-[#247d8b] text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2.5 rounded-xl text-slate-500 hover:text-slate-950 hover:bg-slate-50 focus:outline-none transition-all cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Links overlay */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="pt-2 pb-4 space-y-1.5 px-4 border-t border-slate-100">
            <NavLink
              to="/"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold uppercase tracking-wider ${
                  isActive ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`
              }
            >
              Home
            </NavLink>
            {user && (
              <>
                <NavLink
                  to="/hackathons"
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold uppercase tracking-wider ${
                      isActive ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                    }`
                  }
                >
                  Hackathons
                </NavLink>
                <NavLink
                  to="/leaderboard"
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold uppercase tracking-wider ${
                      isActive ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                    }`
                  }
                >
                  Leaderboard
                </NavLink>
              </>
            )}
            <a
              href="#about"
              onClick={handleAboutClick}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            >
              About
            </a>

            <div className="pt-4 border-t border-slate-100 mt-4">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl">
                    <FaUserCircle className="h-7 w-7 text-slate-400" />
                    <div>
                      <p className="text-xs font-black text-slate-900 leading-none">{user.name}</p>
                      <p className="text-[9px] text-indigo-600 font-extrabold uppercase mt-1 tracking-wider">{user.role}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      Workspace
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      Profile
                    </Link>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black bg-red-50 text-red-650 hover:bg-red-100 border border-red-150 transition-all cursor-pointer uppercase tracking-widest"
                  >
                    <FaSignOutAlt className="text-xs" /> Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-black uppercase text-slate-650 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors tracking-widest"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-black uppercase text-white bg-slate-950 hover:bg-[#247d8b] shadow-sm transition-all tracking-widest"
                  >
                    Sign Up
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
