import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import SearchBar from '../components/common/SearchBar';
import FilterPanel from '../components/common/FilterPanel';
import Pagination from '../components/common/Pagination';
import { SkeletonGrid } from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { Toast } from '../components/common/ErrorMessage';
import {
  FaCalendarAlt,
  FaCode,
  FaMedal,
  FaTrophy,
  FaUserFriends,
  FaArrowRight,
} from 'react-icons/fa';

const Hackathons = () => {
  const navigate = useNavigate();

  // User auth state
  const [user] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

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
      setError(null);
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
        // Only set error if not unauthenticated (since guest fetch is fine, but backend might require auth for listing, in which case we display local message or prompt login)
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

  const pinHeights = ['h-56', 'h-72', 'h-64', 'h-80', 'h-60', 'h-72'];

  return (
    <div className="min-h-screen bg-[#edf3f6] text-slate-950 font-sans py-12">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          
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
                <span className="text-xs font-black uppercase tracking-wider text-[#247d8b]">Browse Dashboard</span>
                <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 font-display">Discover active challenges</h2>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
                  Search, filter, and register for active prototype design sprints and hackathons. Click a card to view detailed specifications.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm uppercase tracking-wider select-none">
                Active: {totalRecords}
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
                      <div 
                        onClick={() => navigate(`/hackathons/${h._id}`)}
                        className={`relative ${pinHeights[index % pinHeights.length]} bg-slate-100 flex-shrink-0 overflow-hidden cursor-pointer`}
                      >
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
                        <div onClick={() => navigate(`/hackathons/${h._id}`)} className="cursor-pointer">
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

                {/* Pagination */}
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

export default Hackathons;
