import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  FaCalendarPlus,
  FaUsers,
  FaFolder,
  FaClipboardList,
  FaGavel,
  FaPlus,
  FaAward,
  FaCalendarAlt,
  FaExternalLinkAlt,
  FaEdit,
  FaCheck,
  FaTimes,
  FaSearch,
  FaTrashAlt,
  FaBullhorn,
} from 'react-icons/fa';
import StatCard from '../components/dashboard/StatCard';
import DashboardCard from '../components/dashboard/DashboardCard';
import DashboardTable from '../components/dashboard/DashboardTable';
import QuickActionCard from '../components/dashboard/QuickActionCard';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import FilterPanel from '../components/common/FilterPanel';
import Loader, { SkeletonTable } from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { Toast } from '../components/common/ErrorMessage';

const OrganizerDashboard = () => {
  const navigate = useNavigate();

  // Dashboard Summary states
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHackathon, setSelectedHackathon] = useState('');

  // Toast feedback state
  const [toast, setToast] = useState(null);

  // Modal Open/Close states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRegOpen, setIsRegOpen] = useState(false);
  const [isSubOpen, setIsSubOpen] = useState(false);

  // --- 1. CREATE HACKATHON STATE ---
  const [hackTitle, setHackTitle] = useState('');
  const [hackTheme, setHackTheme] = useState('');
  const [hackMode, setHackMode] = useState('Online');
  const [hackVenue, setHackVenue] = useState('');
  const [hackStart, setHackStart] = useState('');
  const [hackEnd, setHackEnd] = useState('');
  const [hackDeadline, setHackDeadline] = useState('');
  const [hackPrize, setHackPrize] = useState('');
  const [hackTeamSize, setHackTeamSize] = useState('4');
  const [hackDescription, setHackDescription] = useState('');
  const [hackRules, setHackRules] = useState('');
  const [hackCriteria, setHackCriteria] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // --- 2. MANAGE REGISTRATIONS STATE ---
  const [regList, setRegList] = useState([]);
  const [regLoading, setRegLoading] = useState(false);
  const [regHackId, setRegHackId] = useState('');
  const [regStatus, setRegStatus] = useState('');
  const [regPage, setRegPage] = useState(1);
  const [regTotalPages, setRegTotalPages] = useState(1);

  // --- 3. MANAGE SUBMISSIONS STATE ---
  const [subList, setSubList] = useState([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subSearch, setSubSearch] = useState('');
  const [subStatus, setSubStatus] = useState('');
  const [subPage, setSubPage] = useState(1);
  const [subTotalPages, setSubTotalPages] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeStatus, setGradeStatus] = useState('');

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/dashboard/organizer');
      if (res.data?.success) {
        setData(res.data);
        if (res.data.recentHackathons?.length > 0) {
          setSelectedHackathon(res.data.recentHackathons[0]._id);
          setRegHackId(res.data.recentHackathons[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        navigate('/403');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch organizer dashboard details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  // --- FETCH REGISTRATIONS FOR MODAL ---
  const fetchRegistrations = async () => {
    if (!regHackId) return;
    setRegLoading(true);
    try {
      const res = await api.get(`/registrations/hackathon/${regHackId}`, {
        params: { status: regStatus, page: regPage, limit: 5 },
      });
      if (res.data?.success) {
        setRegList(res.data.registrations || []);
        setRegTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to fetch registrations.' });
    } finally {
      setRegLoading(false);
    }
  };

  useEffect(() => {
    if (isRegOpen) {
      fetchRegistrations();
    }
  }, [isRegOpen, regHackId, regStatus, regPage]);

  // --- FETCH SUBMISSIONS FOR MODAL ---
  const fetchSubmissions = async () => {
    setSubLoading(true);
    try {
      const res = await api.get('/submissions', {
        params: {
          search: subSearch,
          status: subStatus,
          page: subPage,
          limit: 5,
        },
      });
      if (res.data?.success) {
        setSubList(res.data.submissions || []);
        setSubTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to fetch submissions.' });
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => {
    if (isSubOpen) {
      fetchSubmissions();
    }
  }, [isSubOpen, subSearch, subStatus, subPage]);

  // --- HANDLERS ---

  const handleNavigateLeaderboard = () => {
    if (!selectedHackathon) {
      alert('Please select a hackathon first.');
      return;
    }
    navigate(`/leaderboard/${selectedHackathon}`);
  };

  // 1. Create hackathon submit
  const validateCreateForm = () => {
    const errs = {};
    if (!hackTitle.trim()) errs.title = 'Title is required';
    if (!hackTheme.trim()) errs.theme = 'Theme is required';
    if (!hackStart) errs.startDate = 'Start date is required';
    if (!hackEnd) errs.endDate = 'End date is required';
    if (!hackDeadline) errs.registrationDeadline = 'Registration deadline is required';

    const parsedSize = Number(hackTeamSize);
    if (!hackTeamSize || isNaN(parsedSize) || parsedSize <= 0) {
      errs.maxTeamSize = 'Maximum team size must be a number greater than 0';
    }

    if (hackDeadline && hackStart && new Date(hackDeadline) >= new Date(hackStart)) {
      errs.registrationDeadline = 'Registration deadline must be before the start date';
    }
    if (hackStart && hackEnd && new Date(hackEnd) <= new Date(hackStart)) {
      errs.endDate = 'End date must be after the start date';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateHackathon = async (e) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    try {
      const res = await api.post('/hackathons', {
        title: hackTitle.trim(),
        theme: hackTheme.trim(),
        mode: hackMode,
        venue: hackMode === 'Offline' ? hackVenue.trim() : '',
        startDate: hackStart,
        endDate: hackEnd,
        registrationDeadline: hackDeadline,
        prizePool: Number(hackPrize || 0),
        maxTeamSize: Number(hackTeamSize),
        description: hackDescription.trim(),
        rules: hackRules.trim(),
        judgingCriteria: hackCriteria.trim(),
      });

      if (res.data?.success) {
        setToast({ type: 'success', message: 'Hackathon created successfully!' });
        setIsCreateOpen(false);
        // Clear inputs
        setHackTitle('');
        setHackTheme('');
        setHackVenue('');
        setHackStart('');
        setHackEnd('');
        setHackDeadline('');
        setHackPrize('');
        setHackTeamSize('4');
        setHackDescription('');
        setHackRules('');
        setHackCriteria('');
        
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to create hackathon.' });
    }
  };

  // 2. Manage registration approve/reject
  const handleUpdateRegistration = async (regId, status) => {
    try {
      const res = await api.put(`/registrations/${regId}/status`, { status });
      if (res.data?.success) {
        setToast({ type: 'success', message: `Registration status updated to ${status}!` });
        fetchRegistrations();
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to update status.' });
    }
  };

  // 3. Manage submission status grade
  const handleGradeSubmissionStatus = async (e) => {
    e.preventDefault();
    if (!selectedSubmission || !gradeStatus) return;

    try {
      const res = await api.put(`/submissions/${selectedSubmission._id}/status`, { status: gradeStatus });
      if (res.data?.success) {
        setToast({ type: 'success', message: 'Project submission graded successfully!' });
        setSelectedSubmission(null);
        fetchSubmissions();
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to update submission status.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-650"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 bg-white border border-red-100 rounded-2xl shadow-sm">
        <p className="text-red-650 font-bold text-lg mb-4">Error loading dashboard</p>
        <p className="text-gray-500 mb-6 font-medium">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-lg shadow-sm transition-all text-sm cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, recentHackathons, recentRegistrations, recentSubmissions } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Organizer Console</h1>
        <p className="text-gray-500 mt-2 text-base">Coordinate registrations, monitor project submissions, assign judges, and announce winners.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <StatCard icon={FaFolder} title="My Hackathons" count={stats?.myHackathons || 0} description="Hackathon campaigns created by you" />
        <StatCard icon={FaClipboardList} title="Registrations Count" count={stats?.registrationCount || 0} description="Competitor sign-ups on your hackathons" />
        <StatCard icon={FaUsers} title="Teams Registered" count={stats?.teamsRegistered || 0} description="Team rosters in your hackathons" />
        <StatCard icon={FaGavel} title="Total Submissions" count={stats?.totalSubmissions || 0} description="Projects submitted for review" />
        <StatCard icon={FaGavel} title="Pending Reviews" count={stats?.pendingReviews || 0} description="Reviews awaiting judge grading" />
        <StatCard icon={FaBullhorn} title="Winners Announced" count={stats?.winnersAnnounced || 0} description="Completed campaigns with published results" />
      </div>

      {/* Quick Actions Panel */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions Panel</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <QuickActionCard
            icon={FaCalendarPlus}
            title="Create Hackathon"
            description="Launch a new hackathon, set registration deadlines, team guidelines, rules, and judging criteria."
            actionText="Launch Creator"
            onClick={() => setIsCreateOpen(true)}
          />
          <QuickActionCard
            icon={FaClipboardList}
            title="View Registrations"
            description="Inspect contestant profiles, approve pending registrations, and manage team lists."
            actionText="Manage Roster"
            onClick={() => setIsRegOpen(true)}
          />

          {/* Leaderboard Jump Card */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-lg bg-indigo-50 text-indigo-605 font-bold">
                  <FaAward className="h-5 w-5" />
                </span>
                <h4 className="text-base font-bold text-gray-900">Publish Results</h4>
              </div>
              <p className="text-sm text-gray-500 mt-2 font-medium">Select a campaign to calculate final scores, assign podium medals, and announce winners.</p>
              
              {recentHackathons?.length > 0 && (
                <div className="mt-4">
                  <label htmlFor="hackathon-selector" className="sr-only">Select Campaign</label>
                  <select
                    id="hackathon-selector"
                    value={selectedHackathon}
                    onChange={(e) => setSelectedHackathon(e.target.value)}
                    className="w-full text-sm rounded-lg border border-gray-200 p-2 text-gray-700 bg-gray-50 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {recentHackathons.map((h) => (
                      <option key={h._id} value={h._id}>{h.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <button
              onClick={handleNavigateLeaderboard}
              disabled={recentHackathons?.length === 0}
              className={`mt-5 w-full font-semibold py-2 px-4 rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                recentHackathons?.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              Go to Leaderboard &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="space-y-10">
        {/* Recent Hackathons Portfolio */}
        <DashboardCard title="Recent Hackathons Portfolio" subtitle="Campaigns created and administered by you">
          <DashboardTable
            headers={['Title', 'Registration Deadline', 'Theme', 'Status', 'Results']}
            data={recentHackathons}
            emptyMessage="You have not created any hackathons yet."
            renderRow={(hack) => (
              <tr key={hack._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {hack.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                  {new Date(hack.registrationDeadline).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                  {hack.theme}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                    hack.status === 'Completed' ? 'bg-gray-150 text-gray-700' : 'bg-green-100 text-green-800'
                  }`}>
                    {hack.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => navigate(`/leaderboard/${hack._id}`)}
                    className="text-indigo-650 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    View Ranks &rarr;
                  </button>
                </td>
              </tr>
            )}
          />
        </DashboardCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Registrations */}
          <DashboardCard
            title="Recent Registrant Applications"
            subtitle="Latest contestant sign-ups across your hackathons"
            action={
              <button
                onClick={() => setIsRegOpen(true)}
                className="text-xs text-indigo-650 hover:underline font-bold cursor-pointer"
              >
                View Roster
              </button>
            }
          >
            <DashboardTable
              headers={['Participant Name', 'Hackathon Title', 'Status']}
              data={recentRegistrations}
              emptyMessage="No registrations are recorded for your hackathons yet."
              renderRow={(reg) => (
                <tr key={reg._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    <div>
                      <p className="font-bold text-gray-950">{reg.participant?.name || 'Unknown User'}</p>
                      <p className="text-xs text-gray-400 font-medium">{reg.participant?.email || ''}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {reg.hackathon?.title || 'Deleted Hackathon'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      reg.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      reg.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {reg.status}
                    </span>
                  </td>
                </tr>
              )}
            />
          </DashboardCard>

          {/* Recent Submissions */}
          <DashboardCard
            title="Recent Project Submissions"
            subtitle="Newest submission file uploads from hackathon teams"
            action={
              <button
                onClick={() => setIsSubOpen(true)}
                className="text-xs text-indigo-650 hover:underline font-bold cursor-pointer"
              >
                View All
              </button>
            }
          >
            <DashboardTable
              headers={['Team Name', 'Project Name', 'Status']}
              data={recentSubmissions}
              emptyMessage="No projects have been submitted for your hackathons yet."
              renderRow={(sub) => (
                <tr key={sub._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {sub.team?.teamName || 'Unknown Team'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {sub.projectName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                      sub.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      sub.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                </tr>
              )}
            />
          </DashboardCard>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE HACKATHON FORM MODAL                                      */}
      {/* ========================================================================= */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Hackathon">
        <form onSubmit={handleCreateHackathon} className="space-y-4 text-left">
          {/* Title and Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Hackathon Title*</label>
              <input
                type="text"
                value={hackTitle}
                onChange={(e) => setHackTitle(e.target.value)}
                placeholder="AI Global Challenge"
                className="text-sm rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
              />
              {formErrors.title && <p className="text-[10px] font-bold text-red-600">{formErrors.title}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Theme / Track*</label>
              <input
                type="text"
                value={hackTheme}
                onChange={(e) => setHackTheme(e.target.value)}
                placeholder="Artificial Intelligence"
                className="text-sm rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
              />
              {formErrors.theme && <p className="text-[10px] font-bold text-red-600">{formErrors.theme}</p>}
            </div>
          </div>

          {/* Mode and Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Mode format*</label>
              <select
                value={hackMode}
                onChange={(e) => setHackMode(e.target.value)}
                className="text-sm rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
              >
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
            {hackMode === 'Offline' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Venue details</label>
                <input
                  type="text"
                  value={hackVenue}
                  onChange={(e) => setHackVenue(e.target.value)}
                  placeholder="Block B Auditorium"
                  className="text-sm rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
                />
              </div>
            )}
          </div>

          {/* Dates: Start, End, Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Register Deadline*</label>
              <input
                type="date"
                value={hackDeadline}
                onChange={(e) => setHackDeadline(e.target.value)}
                className="text-xs rounded-lg border border-gray-200 p-2 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold text-gray-700"
              />
              {formErrors.registrationDeadline && <p className="text-[9px] font-bold text-red-600 leading-tight">{formErrors.registrationDeadline}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Start Date*</label>
              <input
                type="date"
                value={hackStart}
                onChange={(e) => setHackStart(e.target.value)}
                className="text-xs rounded-lg border border-gray-200 p-2 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold text-gray-700"
              />
              {formErrors.startDate && <p className="text-[9px] font-bold text-red-600 leading-tight">{formErrors.startDate}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">End Date*</label>
              <input
                type="date"
                value={hackEnd}
                onChange={(e) => setHackEnd(e.target.value)}
                className="text-xs rounded-lg border border-gray-200 p-2 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold text-gray-700"
              />
              {formErrors.endDate && <p className="text-[9px] font-bold text-red-600 leading-tight">{formErrors.endDate}</p>}
            </div>
          </div>

          {/* Prize and Team size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Prize Pool ($)</label>
              <input
                type="number"
                value={hackPrize}
                onChange={(e) => setHackPrize(e.target.value)}
                placeholder="5000"
                className="text-sm rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Max Team Size*</label>
              <input
                type="number"
                value={hackTeamSize}
                onChange={(e) => setHackTeamSize(e.target.value)}
                placeholder="4"
                className="text-sm rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
              />
              {formErrors.maxTeamSize && <p className="text-[10px] font-bold text-red-600">{formErrors.maxTeamSize}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Brief Description</label>
            <textarea
              value={hackDescription}
              onChange={(e) => setHackDescription(e.target.value)}
              placeholder="Provide a comprehensive summary..."
              rows={2}
              className="text-sm rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
            />
          </div>

          {/* Rules and criteria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Rules</label>
              <textarea
                value={hackRules}
                onChange={(e) => setHackRules(e.target.value)}
                placeholder="1. Plagiarism is prohibited..."
                rows={2}
                className="text-sm rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Judging Criteria</label>
              <textarea
                value={hackCriteria}
                onChange={(e) => setHackCriteria(e.target.value)}
                placeholder="Innovation (30%), Feasibility (30%)..."
                rows={2}
                className="text-sm rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-150 flex gap-3 justify-end mt-4">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-550 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Create Hackathon
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: MANAGE REGISTRATIONS PANEL                                       */}
      {/* ========================================================================= */}
      <Modal isOpen={isRegOpen} onClose={() => setIsRegOpen(false)} title="Manage Participant Roster">
        <div className="space-y-4 text-left">
          {/* Scoped selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Select Hackathon</label>
              <select
                value={regHackId}
                onChange={(e) => {
                  setRegHackId(e.target.value);
                  setRegPage(1);
                }}
                className="text-sm rounded-lg border border-gray-200 p-2 bg-gray-50 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                {recentHackathons?.map((h) => (
                  <option key={h._id} value={h._id}>{h.title}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Registration Status</label>
              <select
                value={regStatus}
                onChange={(e) => {
                  setRegStatus(e.target.value);
                  setRegPage(1);
                }}
                className="text-sm rounded-lg border border-gray-200 p-2 bg-gray-50 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* List display */}
          {regLoading ? (
            <SkeletonTable rows={4} cols={3} />
          ) : regList.length === 0 ? (
            <EmptyState title="No Registrations" message="No participants have signed up matching these parameters." />
          ) : (
            <div className="border border-gray-150 rounded-xl overflow-hidden shadow-xs bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {regList.map((r) => (
                      <tr key={r._id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-gray-900">
                          <div>
                            <p>{r.participant?.name || 'Deleted User'}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{r.participant?.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            r.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            r.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {r.status === 'Pending' ? (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleUpdateRegistration(r._id, 'Approved')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded-lg text-[10px] transition-all shadow-xs cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateRegistration(r._id, 'Rejected')}
                                className="bg-red-50 hover:bg-red-100 text-red-650 border border-red-150 font-bold px-2 py-1 rounded-lg text-[10px] transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={regPage} totalPages={regTotalPages} onPageChange={(p) => setRegPage(p)} />
            </div>
          )}
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: MANAGE SUBMISSIONS PANEL                                         */}
      {/* ========================================================================= */}
      <Modal isOpen={isSubOpen} onClose={() => setIsSubOpen(false)} title="Track Submission Roster">
        <div className="space-y-4 text-left">
          {/* Query controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchBar
              value={subSearch}
              onChange={(val) => {
                setSubSearch(val);
                setSubPage(1);
              }}
              placeholder="Search by project name..."
              onClear={() => setSubSearch('')}
            />
            <select
              value={subStatus}
              onChange={(e) => {
                setSubStatus(e.target.value);
                setSubPage(1);
              }}
              className="text-xs rounded-lg border border-gray-200 p-2 bg-gray-50 font-bold text-gray-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer w-full sm:w-44"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Details Grading overlay */}
          {selectedSubmission && (
            <div className="bg-indigo-50/50 border border-indigo-150 rounded-xl p-4 space-y-3 relative animate-in fade-in duration-200">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg cursor-pointer"
              >
                <FaTimes />
              </button>
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Evaluate Submission</h4>
              <div className="text-xs space-y-1">
                <p><span className="font-bold text-gray-700">Project:</span> {selectedSubmission.projectName}</p>
                <p><span className="font-bold text-gray-700">Team:</span> {selectedSubmission.team?.teamName}</p>
                <p><span className="font-bold text-gray-700">GitHub:</span> <a href={selectedSubmission.githubRepository} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{selectedSubmission.githubRepository}</a></p>
                {selectedSubmission.techStack?.length > 0 && (
                  <p><span className="font-bold text-gray-700">Stack:</span> {selectedSubmission.techStack.join(', ')}</p>
                )}
              </div>
              <form onSubmit={handleGradeSubmissionStatus} className="flex gap-2 items-center pt-2">
                <select
                  value={gradeStatus}
                  onChange={(e) => setGradeStatus(e.target.value)}
                  className="text-xs rounded-lg border border-gray-200 p-2 bg-white font-bold text-gray-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="">Select Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <button
                  type="submit"
                  disabled={!gradeStatus}
                  className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-lg text-xs shadow-xs transition-all cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Apply Grade
                </button>
              </form>
            </div>
          )}

          {/* List display */}
          {subLoading ? (
            <SkeletonTable rows={4} cols={3} />
          ) : subList.length === 0 ? (
            <EmptyState title="No Submissions" message="No projects have been uploaded matching these filters." />
          ) : (
            <div className="border border-gray-150 rounded-xl overflow-hidden shadow-xs bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Project Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Team / Hackathon</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-20">Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {subList.map((s) => (
                      <tr key={s._id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-gray-900">
                          {s.projectName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 font-medium">
                          <div>
                            <p className="font-bold text-gray-700">{s.team?.teamName || 'Unknown Team'}</p>
                            <p className="text-[10px] text-gray-400 truncate max-w-xs">{s.hackathon?.title}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            s.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            s.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            s.status === 'Under Review' ? 'bg-amber-100 text-amber-800' : 'bg-blue-105 text-blue-800'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <button
                            onClick={() => {
                              setSelectedSubmission(s);
                              setGradeStatus(s.status);
                            }}
                            className="p-1.5 text-indigo-650 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Grade Status"
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={subPage} totalPages={subTotalPages} onPageChange={(p) => setSubPage(p)} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default OrganizerDashboard;
