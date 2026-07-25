import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSignature, FaUsers, FaFileUpload, FaAward, FaCalendarAlt, FaLaptopCode, FaWrench, FaExternalLinkAlt, FaChevronRight } from 'react-icons/fa';
import StatCard from '../components/dashboard/StatCard';
import DashboardCard from '../components/dashboard/DashboardCard';
import DashboardTable from '../components/dashboard/DashboardTable';
import QuickActionCard from '../components/dashboard/QuickActionCard';

const ParticipantDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('http://localhost:5099/api/dashboard/participant', { headers });
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        navigate('/403');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch participant dashboard details.');
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

  const { stats, recentRegistrations, submissionDetails, leaderboardPositions } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Participant Workspace</h1>
        <p className="text-gray-500 mt-2 text-base">Track registered hackathons, manage your team rosters, view project statuses, and check official rankings.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <StatCard icon={FaSignature} title="Registered Hackathons" count={stats?.registeredHackathons || 0} description="Campaign enrollments signed" />
        <StatCard icon={FaUsers} title="My Teams" count={stats?.myTeam || 0} description="Rosters created or joined" />
        <StatCard icon={FaFileUpload} title="Submission Status" count={stats?.submissionStatus || 'No Submissions'} description="Grade status of latest upload" />
        <StatCard icon={FaAward} title="Current Rank" count={stats?.currentRank || 'No Rankings'} description="Highest position in published results" />
        <StatCard icon={FaCalendarAlt} title="Upcoming Hackathons" count={stats?.upcomingHackathons || 0} description="Active sign-up opportunities open" />
      </div>

      {/* Quick Actions */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Contestant Toolbox</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <QuickActionCard
            icon={FaCalendarAlt}
            title="Register for Hackathons"
            description="Find and sign up for new hackathons on the platform page directory."
            actionText="Browse Campaigns"
            onClick={() => navigate('/')}
          />
          <QuickActionCard
            icon={FaUsers}
            title="View Team"
            description="Invite members, update invite codes, disband or locked team rosters."
            actionText="Go to Team Hub"
            onClick={() => alert('Redirecting to Team Management Page...')}
          />
          <QuickActionCard
            icon={FaWrench}
            title="Edit Submission"
            description="Modify your uploaded GitHub repos, tech stack, screenshots, and solutions."
            actionText="Update Uploads"
            onClick={() => alert('Redirecting to Edit Submission Panel...')}
          />
        </div>
      </div>

      {/* Detailed Blocks */}
      <div className="space-y-10">
        {/* Recent Registrations Card */}
        <DashboardCard title="My Registrations" subtitle="Hackathons you have registered for on this platform">
          <DashboardTable
            headers={['Hackathon Title', 'Start Date', 'Registration Date', 'Status']}
            data={recentRegistrations}
            emptyMessage="You have not registered for any hackathons yet."
            renderRow={(reg) => (
              <tr key={reg._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {reg.hackathon?.title || 'Unknown Hackathon'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                  {reg.hackathon?.startDate ? new Date(reg.hackathon.startDate).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                  {new Date(reg.registeredAt).toLocaleDateString()}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Submission Details */}
          <DashboardCard title="Submission Details" subtitle="Projects uploaded by your teams">
            <DashboardTable
              headers={['Project Name', 'Hackathon', 'Status']}
              data={submissionDetails}
              emptyMessage="No project submissions have been uploaded by your teams yet."
              renderRow={(sub) => (
                <tr key={sub._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {sub.projectName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium truncate max-w-xs">
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

          {/* Leaderboard Position */}
          <DashboardCard title="Leaderboard Rankings" subtitle="Your official ranking positions in completed hackathons">
            <DashboardTable
              headers={['Hackathon Title', 'Team Name', 'Score', 'Rank', 'Action']}
              data={leaderboardPositions}
              emptyMessage="No published ranking results are available for your teams yet."
              renderRow={(rank) => (
                <tr key={rank._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 truncate max-w-xs">
                    {rank.hackathon?.title || 'Deleted Hackathon'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {rank.team?.teamName || 'Deleted Team'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-extrabold text-center">
                    {rank.averageScore}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      {rank.position || `#${rank.rank}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => navigate(`/leaderboard/${rank.hackathon?._id}`)}
                      className="text-indigo-650 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      Board <FaChevronRight className="text-[10px]" />
                    </button>
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

export default ParticipantDashboard;
