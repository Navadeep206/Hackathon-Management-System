import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import SearchBar from '../components/common/SearchBar';
import FilterPanel from '../components/common/FilterPanel';
import Pagination from '../components/common/Pagination';
import { SkeletonGrid } from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { Toast } from '../components/common/ErrorMessage';
import {
  FaArrowRight,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaClipboardCheck,
  FaCode,
  FaCubes,
  FaDatabase,
  FaMedal,
  FaRocket,
  FaTrophy,
  FaUserFriends,
  FaUsersCog,
  FaSearch,
  FaUserCircle,
  FaSignOutAlt,
  FaChevronDown,
} from 'react-icons/fa';

const Home = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // User auth state
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Sync user state from other components / storage changes
  const fetchUser = () => {
    try {
      const storedUser = localStorage.getItem('user');
      setUser(storedUser ? JSON.parse(storedUser) : null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    window.addEventListener('storage', fetchUser);
    return () => window.removeEventListener('storage', fetchUser);
  }, []);

  // Handle logout from custom header
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
    navigate('/login');
    window.dispatchEvent(new Event('storage'));
  };

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

  // Hackathons state
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({ mode: '', status: '' });

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchHackathons = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 6,
          search,
          mode: activeFilters.mode,
          status: activeFilters.status,
        };

        const res = await api.get('/hackathons', { params });
        if (res.data?.success) {
          setHackathons(res.data.hackathons || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalRecords(res.data.totalRecords || 0);
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to retrieve hackathons portfolio.');
      } finally {
        setLoading(false);
      }
    };

    fetchHackathons();
  }, [page, search, activeFilters]);

  // Handle participant register click
  const handleRegisterClick = async (hackathonId, title) => {
    if (!user) {
      setToast({ type: 'error', message: 'You must log in to register for a hackathon!' });
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    if (user.role !== 'Participant') {
      setToast({
        type: 'error',
        message: `Forbidden: Only Participants can enroll. Your role is: ${user.role}`,
      });
      return;
    }

    try {
      const res = await api.post(`/registrations/${hackathonId}`);
      if (res.data?.success) {
        setToast({
          type: 'success',
          message: `Successfully registered for "${title}"! Approval pending.`,
        });
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to submit registration request.';
      setToast({ type: 'error', message: msg });
    }
  };

  const handleFilterChange = (name, value) => {
    setActiveFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setActiveFilters({ mode: '', status: '' });
    setSearch('');
    setPage(1);
  };

  const filterConfig = [
    {
      name: 'mode',
      label: 'Format Mode',
      options: ['Online', 'Offline'],
    },
    {
      name: 'status',
      label: 'Campaign Status',
      options: ['Upcoming', 'Registration Open', 'Registration Closed', 'Ongoing', 'Completed'],
    },
  ];

  const prizeTotal = hackathons.reduce((sum, h) => sum + (Number(h.prizePool) || 0), 0);
  const formattedPrizeTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(prizeTotal);

  const scrollToListings = () => {
    document.getElementById('hackathon-listings')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHighlights = () => {
    document.getElementById('platform-highlights')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Determine dashboard path based on role
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

  const platformHighlights = [
    {
      icon: FaUsersCog,
      title: 'Role-based workspaces',
      text: 'Admin, organizer, participant, and judge views are separated so each user lands in the right workflow.',
    },
    {
      icon: FaClipboardCheck,
      title: 'Submission review flow',
      text: 'Teams submit projects, judges evaluate entries, and organizers track progress without manual handoffs.',
    },
    {
      icon: FaChartLine,
      title: 'Leaderboard outcomes',
      text: 'Completed events can publish clear rankings that make project outcomes visible and presentation-ready.',
    },
  ];

  const pinHeights = ['h-56', 'h-72', 'h-64', 'h-80', 'h-60', 'h-72'];

  return (
    <div className="min-h-screen bg-[#edf3f6] text-slate-950 font-sans pb-16">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main Container padding matching layout max-width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Rounded Mockup Frame Card - Gradient backdrop matching reference */}
        <section className="relative overflow-hidden rounded-[2.5rem] sm:rounded-[3.2rem] border-3 border-[#0b1b1e] bg-gradient-to-br from-[#13444e] via-[#247d8b] to-[#f4c3ab] shadow-2xl flex flex-col justify-between min-h-[640px] md:min-h-[720px] transition-all">
          <div className="absolute inset-0 hero-grid opacity-15 pointer-events-none" />
          
          {/* Custom Integrated Navbar (Circle Header) */}
          <header className="relative z-20 w-full px-6 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between">
            
            {/* Logo */}
            <div className="flex items-center gap-2.5 select-none cursor-pointer" onClick={() => navigate('/')}>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white border border-white/25 shadow-md">
                <svg className="w-5 h-5 text-white animate-spin-slow" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="4.5" r="2" />
                  <circle cx="17.3" cy="6.7" r="2" />
                  <circle cx="19.5" cy="12" r="2" />
                  <circle cx="17.3" cy="17.3" r="2" />
                  <circle cx="12" cy="19.5" r="2" />
                  <circle cx="6.7" cy="17.3" r="2" />
                  <circle cx="4.5" cy="12" r="2" />
                  <circle cx="6.7" cy="6.7" r="2" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-display">Circle</span>
            </div>

            {/* Menu Links */}
            <nav className="hidden md:flex items-center gap-8 bg-white/5 border border-white/10 rounded-full px-7 py-2.5 backdrop-blur-md">
              <span 
                onClick={scrollToHighlights}
                className="text-[10px] font-black tracking-widest text-white/80 hover:text-white transition-all cursor-pointer uppercase"
              >
                About
              </span>
              <span 
                onClick={scrollToListings}
                className="text-[10px] font-black tracking-widest text-white/80 hover:text-white transition-all cursor-pointer uppercase"
              >
                Events
              </span>
              {dashboardPath ? (
                <span 
                  onClick={() => navigate(dashboardPath)}
                  className="text-[10px] font-black tracking-widest text-white/80 hover:text-white transition-all cursor-pointer uppercase"
                >
                  Workspace
                </span>
              ) : (
                <span 
                  onClick={() => navigate('/login')}
                  className="text-[10px] font-black tracking-widest text-white/80 hover:text-white transition-all cursor-pointer uppercase"
                >
                  Workspace
                </span>
              )}
              <span 
                onClick={() => {
                  if (hackathons && hackathons.length > 0) {
                    navigate(`/leaderboard/${hackathons[0]._id}`);
                  } else {
                    scrollToListings();
                  }
                }}
                className="text-[10px] font-black tracking-widest text-white/80 hover:text-white transition-all cursor-pointer uppercase"
              >
                Leaderboard
              </span>
            </nav>

            {/* Right Action Menu: Search icon and login/profile pill */}
            <div className="flex items-center gap-4">
              {/* Search trigger */}
              <button 
                onClick={scrollToListings}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer shadow-sm"
                aria-label="Search events"
              >
                <FaSearch className="text-xs" />
              </button>

              {/* User authentication block */}
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 px-3.5 py-1.5 backdrop-blur-md transition-all text-white font-bold text-xs cursor-pointer shadow-sm"
                  >
                    <FaUserCircle className="h-4 w-4 text-white" />
                    <span>{user.name.split(' ')[0]}</span>
                    <FaChevronDown className={`text-[9px] transition-transform duration-250 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white p-2 text-slate-900 shadow-2xl border border-slate-100 ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150 z-30">
                      <div className="px-3.5 py-2 border-b border-slate-100 mb-1">
                        <p className="text-xs font-black text-slate-800 truncate">{user.name}</p>
                        <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider mt-0.5">{user.role}</p>
                      </div>
                      {dashboardPath && (
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            navigate(dashboardPath);
                          }}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all cursor-pointer"
                        >
                          <FaCubes className="text-slate-400" /> Go to Dashboard
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                      >
                        <FaSignOutAlt className="text-red-400" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="bg-white hover:bg-slate-100 text-[#13444e] font-black px-6 py-2.5 rounded-full text-xs shadow-md transition-all duration-150 uppercase tracking-wider cursor-pointer border border-white"
                >
                  Sign In
                </button>
              )}
            </div>

          </header>

          {/* Hero Core Content */}
          <div className="relative z-10 w-full px-6 sm:px-10 lg:px-12 pt-12 md:pt-16 pb-20 flex-grow grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            
            {/* Left copy text */}
            <div className="flex flex-col text-white max-w-xl">
              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.04] tracking-tight text-white">
                Your next big idea starts here
              </h1>
              <p className="mt-5 text-sm sm:text-base leading-relaxed text-white/90 font-medium">
                The ideal framework to learn how to manage all aspects of startup. Launch build events, form teams, submit projects, evaluate entries, and reveal winners inside a unified dashboard operations hub.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={scrollToListings}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f5cbb6] hover:bg-[#e8b59e] px-8 py-3.5 text-xs font-black text-[#13444e] shadow-lg shadow-black/10 tracking-widest uppercase transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  Start For Free <FaArrowRight />
                </button>
              </div>

              {/* Sponsor Logos Block */}
              <div className="mt-14 pt-8 border-t border-white/15">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-white/70 select-none">
                  <div className="flex items-center font-bold tracking-tight text-sm">
                    <span className="text-base font-black mr-1 flex items-center justify-center border border-white/40 rounded-sm w-4 h-4 text-xs font-sans">⇿</span> 
                    <span>TransferWise</span>
                  </div>
                  <div className="font-extrabold tracking-widest text-xs uppercase">
                    Woo Commerce
                  </div>
                  <div className="flex items-center font-black tracking-tight text-sm italic">
                    <span className="font-black text-indigo-300">Pay</span>Pal
                  </div>
                  <div className="flex items-center font-semibold text-sm">
                    Pay<span className="w-2.5 h-2.5 rounded-full bg-white border border-[#13444e] mx-0.5 inline-block"></span>neer
                  </div>
                </div>
              </div>
            </div>

            {/* Right vector illustration (inline SVG) */}
            <div className="relative w-full flex justify-center">
              <svg viewBox="0 0 500 400" className="w-full h-auto max-w-[430px] select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Floating Orbit (top left) */}
                <g className="float-orbit">
                  <circle cx="80" cy="90" r="16" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3"/>
                  <circle cx="80" cy="90" r="3" fill="#f4c3ab"/>
                  <line x1="80" y1="90" x2="105" y2="70" stroke="#102c30" strokeWidth="1.2"/>
                  <circle cx="105" cy="70" r="6" fill="#13444e" stroke="#102c30" strokeWidth="1.2"/>
                  <circle cx="65" cy="110" r="8" fill="#ffffff" stroke="#102c30" strokeWidth="1.2"/>
                </g>
                
                {/* Floating Paper Airplane (top right) */}
                <g className="float-airplane">
                  <path d="M410,120 L445,95 L430,135 L422,128 Z" fill="#ffffff" stroke="#102c30" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M410,120 L430,135 L445,95" stroke="#102c30" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M422,128 L422,136 L426,132" fill="#f4c3ab" stroke="#102c30" strokeWidth="1.5" strokeLinejoin="round"/>
                </g>
                
                {/* Floor base line */}
                <line x1="50" y1="340" x2="450" y2="340" stroke="#102c30" strokeWidth="2" strokeLinecap="round"/>
                
                {/* Side Table & Coffee Mug */}
                <path d="M140,260 L140,340" stroke="#102c30" strokeWidth="2"/>
                <path d="M110,260 L170,260" stroke="#102c30" strokeWidth="2" strokeLinecap="round"/>
                <path d="M130,260 L130,248 C130,246 132,244 135,244 L145,244 C148,244 150,246 150,248 L150,260 Z" fill="#ffffff" stroke="#102c30" strokeWidth="1.5"/>
                <path d="M150,248 C153,248 155,250 155,252 C155,254 153,256 150,256" stroke="#102c30" strokeWidth="1.5"/>
                
                {/* Potted Plant Left */}
                <g transform="translate(80, 270)">
                  <path d="M20,70 L40,70 L45,45 L15,45 Z" fill="#ffffff" stroke="#102c30" strokeWidth="1.7"/>
                  <path d="M18,45 Q10,20 16,5 Q24,25 22,45" fill="#f4c3ab" stroke="#102c30" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M26,45 Q36,10 32,-8 Q30,12 28,45" fill="#ffffff" stroke="#102c30" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M34,45 Q44,22 41,10 Q37,25 35,45" fill="#13444e" stroke="#102c30" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M22,45 Q26,30 25,20" stroke="#102c30" strokeWidth="1"/>
                  <path d="M30,45 Q31,25 29,15" stroke="#102c30" strokeWidth="1"/>
                </g>
                
                {/* Potted Vase Right */}
                <g transform="translate(370, 240)">
                  <path d="M20,100 L30,100 L33,70 C33,65 29,60 25,60 C21,60 17,65 17,70 Z" fill="#ffffff" stroke="#102c30" strokeWidth="1.7"/>
                  <line x1="25" y1="60" x2="25" y2="100" stroke="#102c30" strokeWidth="1.5"/>
                  <path d="M25,60 C23,45 10,35 5,30" stroke="#102c30" strokeWidth="1.5"/>
                  <path d="M25,60 C25,40 35,30 45,25" stroke="#102c30" strokeWidth="1.5"/>
                  <path d="M25,60 Q25,35 20,20" stroke="#102c30" strokeWidth="1.5"/>
                  <circle cx="5" cy="30" r="3.5" fill="#f4c3ab" stroke="#102c30" strokeWidth="1"/>
                  <circle cx="45" cy="25" r="3.5" fill="#f4c3ab" stroke="#102c30" strokeWidth="1"/>
                  <circle cx="20" cy="20" r="3.5" fill="#ffffff" stroke="#102c30" strokeWidth="1"/>
                </g>
                
                {/* Ergonomic Chair legs */}
                <path d="M290,340 L290,290 L260,265 M290,340 L320,340 M290,340 L260,340" stroke="#102c30" strokeWidth="2.5" strokeLinecap="round"/>
                {/* Chair Shell */}
                <path d="M230,225 C230,265 255,275 295,270 C310,268 322,250 322,230 L328,190 C328,175 315,165 300,165 L260,165 C240,165 230,180 230,205 Z" fill="#ffffff" stroke="#102c30" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M245,225 C245,215 270,215 285,215 C295,215 295,228 290,240" fill="none" stroke="#102c30" strokeWidth="2"/>

                {/* Developer character sitting */}
                {/* Pants */}
                <path d="M275,268 L240,268 L235,325" stroke="#102c30" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M275,268 L240,268 L235,325" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Shoe */}
                <path d="M228,325 C222,325 218,328 220,332 L240,332 C242,332 242,325 238,325 Z" fill="#ffffff" stroke="#102c30" strokeWidth="1.8"/>

                {/* Torso */}
                <path d="M285,190 L275,268" stroke="#102c30" strokeWidth="10" strokeLinecap="round"/>
                <path d="M285,190 L275,268" stroke="#f4c3ab" strokeWidth="7" strokeLinecap="round"/>
                <line x1="280" y1="200" x2="274" y2="255" stroke="#102c30" strokeWidth="1.5"/>
                
                {/* Laptop screen */}
                <path d="M165,225 L215,225" stroke="#102c30" strokeWidth="3" strokeLinecap="round"/>
                <path d="M165,225 L158,190 C157,185 160,182 165,182 L200,182" fill="none" stroke="#102c30" strokeWidth="2"/>
                <path d="M167,222 L161,192 C160,187 163,185 167,185 L195,185" fill="#ffffff"/>
                
                {/* Typing arms */}
                <path d="M275,200 C240,205 220,210 205,215" fill="none" stroke="#102c30" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M205,215 Q195,215 190,222" stroke="#102c30" strokeWidth="2" strokeLinecap="round"/>
                
                {/* Neck and Face */}
                <path d="M288,190 L288,175" stroke="#102c30" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M288,175 C288,170 282,150 295,145 C300,143 304,148 304,152 C304,165 298,175 288,175 Z" fill="#ffffff" stroke="#102c30" strokeWidth="1.8" strokeLinejoin="round"/>
                <circle cx="295" cy="155" r="1" fill="#102c30"/>
                <path d="M292,162 C294,164 296,164 297,162" stroke="#102c30" strokeWidth="1" fill="none"/>
                <path d="M298,144 C304,144 308,149 308,154 C308,157 302,159 300,157 C296,155 292,150 292,146 C292,143 294,144 298,144 Z" fill="#102c30"/>
              </svg>
            </div>
          </div>

          {/* Bottom Curved Stats Panel - White background, rounded curve at top */}
          <div className="relative z-10 w-full bg-white text-[#13444e] rounded-t-[2.2rem] sm:rounded-t-[2.8rem] px-6 py-8 sm:py-9 border-t border-slate-100 flex flex-col md:flex-row items-center justify-around gap-6 select-none shadow-[0_-15px_35px_rgba(11,27,30,0.04)]">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="w-3 h-3 rounded-full border-2 border-[#13444e] mb-2 block bg-white opacity-85"></span>
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#13444e] font-display">.200+</span>
              <span className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">Events Launched</span>
            </div>
            
            <div className="hidden md:block w-px h-12 bg-slate-100" />
            
            <div className="flex flex-col items-center justify-center text-center">
              <span className="w-3 h-3 rounded-full border-2 border-[#13444e] mb-2 block bg-white opacity-85"></span>
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#13444e] font-display">.150+</span>
              <span className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">Solutions Devised</span>
            </div>
            
            <div className="hidden md:block w-px h-12 bg-slate-100" />

            <div className="flex flex-col items-center justify-center text-center">
              <span className="w-3 h-3 rounded-full border-2 border-[#13444e] mb-2 block bg-white opacity-85"></span>
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#13444e] font-display">.10k+</span>
              <span className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">Developers Engaged</span>
            </div>
          </div>
        </section>

        {/* Platform highlights (About section) */}
        <section id="platform-highlights" className="mt-20 scroll-mt-6 grid gap-6 md:grid-cols-3">
          {platformHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:border-[#247d8b] hover:shadow-[#247d8b]/5"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0b1220] text-[#f5cbb6] shadow-lg transition-transform group-hover:-rotate-3 group-hover:scale-105">
                  <Icon className="text-base" />
                </div>
                <h2 className="mt-5 text-lg font-bold text-slate-900 tracking-tight">{item.title}</h2>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">{item.text}</p>
              </div>
            );
          })}
        </section>

        {/* Primary search & listings board section */}
        <section id="hackathon-listings" className="mt-24 scroll-mt-6 grid grid-cols-1 gap-8 lg:grid-cols-4">
          
          {/* Filters Column */}
          <div className="lg:col-span-1">
            <FilterPanel
              filters={filterConfig}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
            />
          </div>

          {/* Listings Column */}
          <div className="lg:col-span-3 space-y-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#247d8b]">Event inspiration board</p>
                <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 font-display">Discover active challenges</h2>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
                  Browse and enroll in live design challenges, hackathons, and product sprint campaigns.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm uppercase tracking-wider select-none">
                Total Campaigns: {totalRecords}
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <SearchBar
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
                placeholder="Search hackathons by name, theme, or tags..."
                onClear={() => setSearch('')}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 font-bold text-xs shadow-sm">
                {error}
              </div>
            )}

            {/* Hackathons Grid */}
            {loading ? (
              <SkeletonGrid count={3} />
            ) : hackathons.length === 0 ? (
              <EmptyState
                icon={FaCalendarAlt}
                title="No Hackathons Found"
                message="No hackathons match your search queries or filter details. Try clearing filters or using other search keywords."
              />
            ) : (
              <div>
                {/* Pinterest style columns layout */}
                <div className="columns-1 gap-6 md:columns-2 xl:columns-3">
                  {hackathons.map((h, index) => (
                    <div
                      key={h._id}
                      className="group relative mb-6 break-inside-avoid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-lg shadow-slate-200/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-[#247d8b]/5 hover:border-[#247d8b]/30"
                    >
                      <div className="absolute inset-x-6 top-0 h-1.5 rounded-b-full bg-gradient-to-r from-[#13444e] via-[#247d8b] to-[#f4c3ab] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Header Banner Image */}
                      <div className={`relative ${pinHeights[index % pinHeights.length]} bg-slate-100 flex-shrink-0 overflow-hidden`}>
                        {h.bannerImage ? (
                          <img
                            src={`http://127.0.0.1:5099${h.bannerImage}`}
                            alt={h.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#13444e] to-[#247d8b] p-5 text-white">
                            <div className="absolute left-6 top-8 h-20 w-20 rounded-[1.6rem] bg-white/10 border border-white/20 transform-3d rotate-3d-cube" />
                            <div className="absolute bottom-8 right-7 h-16 w-16 rounded-[1.4rem] bg-[#f5cbb6]/25 border border-[#f5cbb6]/25 transform-3d rotate-3d-cube-alt" />
                            <div className="absolute right-16 top-20 h-10 w-10 rounded-2xl bg-white/10 shadow-xl backdrop-blur-xs" />
                            <div className="relative z-10 flex h-full flex-col justify-between">
                              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 border border-white/25 text-white shadow-xl">
                                <FaCode className="text-xs" />
                              </div>
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#f5cbb6] opacity-90">Challenge Theme</p>
                                <p className="mt-1 text-xl font-bold leading-tight tracking-tight font-display">{h.theme}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent opacity-80" />
                        
                        {/* Format Badge */}
                        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-slate-800 px-2.5 py-1 rounded-xl text-[9px] font-black shadow-md uppercase tracking-wider">
                          {h.mode}
                        </span>
                        
                        {/* Status Badge */}
                        <span
                          className={`absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[9px] font-black shadow-md uppercase tracking-wider text-white ${
                            h.status === 'Registration Open'
                              ? 'bg-emerald-600 shadow-emerald-200'
                              : h.status === 'Completed'
                              ? 'bg-gray-750'
                              : 'bg-cyan-700 shadow-cyan-200'
                          }`}
                        >
                          {h.status}
                        </span>
                      </div>

                      {/* Content details */}
                      <div className="p-6 flex-grow flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black text-[#247d8b] uppercase tracking-widest block">
                            Theme: {h.theme}
                          </span>
                          <h3 className="text-lg font-bold text-slate-900 mt-1.5 leading-snug group-hover:text-[#247d8b] transition-colors tracking-tight">
                            {h.title}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-3 line-clamp-3 leading-relaxed">
                            {h.description || 'No description provided.'}
                          </p>
                        </div>

                        {/* Stats icons */}
                        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 rounded-2xl bg-amber-50/70 p-3 text-slate-500 border border-amber-100/50">
                            <FaTrophy className="text-amber-500 h-4 w-4 shrink-0" />
                            <div className="leading-none">
                              <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">Prize Pool</span>
                              <span className="text-xs font-black text-slate-800">${h.prizePool?.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-2xl bg-[#edf3f6] p-3 text-slate-500 border border-slate-200/50">
                            <FaUserFriends className="text-[#247d8b] h-4 w-4 shrink-0" />
                            <div className="leading-none">
                              <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">Team Size</span>
                              <span className="text-xs font-black text-slate-800">Max {h.maxTeamSize}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                          <FaCalendarAlt className="text-slate-350" /> Deadline: {new Date(h.registrationDeadline).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Action footer */}
                      <div className="px-6 pb-6 pt-0">
                        {h.status === 'Completed' ? (
                          <button
                            onClick={() => navigate(`/leaderboard/${h._id}`)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-4 rounded-xl text-xs shadow-md shadow-emerald-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
                          >
                            <FaMedal className="text-xs" /> View Leaderboard <FaArrowRight />
                          </button>
                        ) : h.status === 'Registration Open' ? (
                          <button
                            onClick={() => handleRegisterClick(h._id, h.title)}
                            className="w-full bg-slate-950 hover:bg-[#247d8b] text-white font-black py-3 px-4 rounded-xl text-xs shadow-md transition-all cursor-pointer uppercase tracking-wider border border-slate-950 hover:border-[#247d8b]"
                          >
                            Enroll Now
                          </button>
                        ) : (
                          <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-black text-slate-400 uppercase tracking-wider">
                            Enrollment Closed
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination links */}
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
