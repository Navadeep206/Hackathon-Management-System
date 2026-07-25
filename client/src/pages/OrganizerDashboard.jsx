import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCalendarPlus, FaUsers, FaFolder, FaClipboardList, FaGavel, FaBullhorn, FaPlus, FaAward, FaCalendarAlt, FaExternalLinkAlt } from 'react-icons/fa';
import StatCard from '../components/dashboard/StatCard';
import DashboardCard from '../components/dashboard/DashboardCard';
import DashboardTable from '../components/dashboard/DashboardTable';
import QuickActionCard from '../components/dashboard/QuickActionCard';

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Selection state for managing leaderboards via quick actions
  const [selectedHackathon, setSelectedHackathon] = useState('');

  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('http://localhost:5099/api/dashboard/organizer', { headers });
      if (res.data?.success) {
        setData(res.data);
        if (res.data.recentHackathons?.length > 0) {
          setSelectedHackathon(res.data.recentHackathons[0]._id);
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

  const handleNavigateLeaderboard = () => {
    if (!selectedHackathon) {
      alert('Please select a hackathon first.');
      return;
    }
    navigate(`/leaderboard/${selectedHackathon}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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

      {/* Quick Actions & Leaderboard Selection */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions Panel</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <QuickActionCard
            icon={FaCalendarPlus}
            title="Create Hackathon"
            description="Launch a new hackathon, set registration deadlines, team guidelines, rules, and judging criteria."
            actionText="Launch Creator"
            onClick={() => alert('Redirecting to Hackathon Creation Page...')}
          />
          <QuickActionCard
            icon={FaClipboardList}
            title="View Registrations"
            description="Inspect contestant profiles, approve pending registrations, and manage team lists."
            actionText="Manage Roster"
            onClick={() => alert('Redirecting to Registration Management Panel...')}
          />

          {/* Special Leaderboard Jump Card */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
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
                    className="w-full text-sm rounded-lg border border-gray-200 p-2 text-gray-700 bg-gray-50 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
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
        {/* Recent Hackathons */}
        <DashboardCard
          title="Recent Hackathons Portfolio"
          subtitle="Campaigns created and administered by you"
          action={
            <button
              onClick={() => alert('Redirecting to complete list...')}
              className="text-xs text-indigo-650 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              View All <FaExternalLinkAlt className="text-[10px]" />
            </button>
          }
        >
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
                    hack.status === 'Completed' ? 'bg-gray-150 text-gray-700' : 'bg-green-100 text-green-850'
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
          <DashboardCard title="Recent Registrant Applications" subtitle="Latest contestant sign-ups across your hackathons">
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
          <DashboardCard title="Recent Project Submissions" subtitle="Newest submission file uploads from hackathon teams">
            <DashboardTable
              headers={['Team Name', 'Project Name', 'Hackathon', 'Status']}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {sub.hackathon?.title || 'Deleted Hackathon'}
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
    </div>
  );
};

export default OrganizerDashboard;
