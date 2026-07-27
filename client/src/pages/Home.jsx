import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import SearchBar from '../components/common/SearchBar';
import FilterPanel from '../components/common/FilterPanel';
import Pagination from '../components/common/Pagination';
import Loader, { SkeletonGrid } from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { Toast } from '../components/common/ErrorMessage';
import { FaCalendarAlt, FaTrophy, FaUserFriends, FaMapMarkerAlt } from 'react-icons/fa';

const Home = () => {
  const navigate = useNavigate();

  // User auth state
  const [user, setUser] = useState(() => {
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

  useEffect(() => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Hero Welcome banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-700 via-indigo-650 to-purple-650 p-8 sm:p-12 md:p-16 mb-12 shadow-xl shadow-indigo-100">
        <div className="relative z-10 max-w-2xl text-white">
          <span className="bg-indigo-500/35 border border-indigo-400/40 text-indigo-100 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            Explore Campaigns
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Discover & Join World-Class Hackathons
          </h1>
          <p className="mt-4 text-indigo-100/90 font-medium text-sm sm:text-base leading-relaxed">
            Collaborate in teams, build innovative solution prototypes, receive judge evaluations, and publish podium results.
          </p>
        </div>
        {/* Abstract background shapes */}
        <div className="absolute right-0 bottom-0 h-64 w-64 bg-indigo-500/10 rounded-full filter blur-2xl translate-x-20 translate-y-20"></div>
        <div className="absolute right-10 top-0 h-48 w-48 bg-purple-500/10 rounded-full filter blur-2xl -translate-y-10"></div>
      </div>

      {/* Primary search & grid column */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters */}
        <div className="lg:col-span-1">
          <FilterPanel
            filters={filterConfig}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </div>

        {/* Listings */}
        <div className="lg:col-span-3 space-y-6">
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
            <div className="text-sm font-bold text-gray-500 px-3 py-2 bg-gray-100 border border-gray-150 rounded-xl whitespace-nowrap text-center">
              Campaigns: {totalRecords}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-750 font-bold text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <SkeletonGrid count={3} />
          ) : hackathons.length === 0 ? (
            <EmptyState
              icon={FaCalendarAlt}
              title="No Hackathons Found"
              message="No hackathons match your search queries or filter details. Try clearing filters or adding other words."
            />
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {hackathons.map((h) => (
                  <div
                    key={h._id}
                    className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 group"
                  >
                    {/* Header Banner Image */}
                    <div className="relative h-44 bg-gray-100 flex-shrink-0">
                      {h.bannerImage ? (
                        <img
                          src={`http://localhost:5099${h.bannerImage}`}
                          alt={h.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-indigo-50 to-indigo-100/50 flex items-center justify-center text-indigo-400 text-sm font-bold uppercase tracking-wider p-4 text-center">
                          {h.theme}
                        </div>
                      )}
                      {/* Format Badge */}
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-gray-800 px-2.5 py-1 rounded-lg text-[10px] font-extrabold shadow-xs uppercase tracking-wider">
                        {h.mode}
                      </span>
                      {/* Status Badge */}
                      <span
                        className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-extrabold shadow-xs uppercase tracking-wider ${
                          h.status === 'Registration Open'
                            ? 'bg-emerald-500 text-white shadow-emerald-100'
                            : h.status === 'Completed'
                            ? 'bg-gray-700 text-white'
                            : 'bg-indigo-600 text-white shadow-indigo-100'
                        }`}
                      >
                        {h.status}
                      </span>
                    </div>

                    {/* Content details */}
                    <div className="p-5 flex-grow flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block">
                          Theme: {h.theme}
                        </span>
                        <h3 className="text-base font-bold text-gray-900 mt-1 line-clamp-1 group-hover:text-indigo-650 transition-colors">
                          {h.title}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-2 line-clamp-2 leading-relaxed">
                          {h.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Stats icons */}
                      <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-gray-500">
                          <FaTrophy className="text-amber-500 h-3.5 w-3.5" />
                          <div className="leading-none">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block">Prize Pool</span>
                            <span className="text-xs font-bold text-gray-800">${h.prizePool?.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <FaUserFriends className="text-indigo-500 h-3.5 w-3.5" />
                          <div className="leading-none">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block">Team Limit</span>
                            <span className="text-xs font-bold text-gray-800">{h.maxTeamSize} Members</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 text-xs font-bold text-gray-400 flex items-center gap-1.5">
                        <FaCalendarAlt /> Deadline: {new Date(h.registrationDeadline).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Bottom Actions footer */}
                    <div className="px-5 pb-5 pt-0">
                      {h.status === 'Completed' ? (
                        <button
                          onClick={() => navigate(`/leaderboard/${h._id}`)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-sm shadow-emerald-150 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          🥇 View Leaderboard &rarr;
                        </button>
                      ) : h.status === 'Registration Open' ? (
                        <button
                          onClick={() => handleRegisterClick(h._id, h.title)}
                          className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm shadow-indigo-150 transition-all cursor-pointer"
                        >
                          Enroll Now
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full bg-gray-100 text-gray-400 font-bold py-2 px-4 rounded-xl text-xs cursor-not-allowed border border-gray-150"
                        >
                          Enroll Closed
                        </button>
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
      </div>
    </div>
  );
};

export default Home;
