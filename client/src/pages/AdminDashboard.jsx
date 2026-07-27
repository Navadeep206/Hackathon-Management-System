import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaUsers, FaUserTie, FaUserGraduate, FaGavel, FaTrophy, FaLayerGroup, FaFileSignature, FaFileUpload, FaClipboardCheck, FaUserCog, FaFolderOpen, FaArrowRight } from 'react-icons/fa';
import StatCard from '../components/dashboard/StatCard';
import DashboardCard from '../components/dashboard/DashboardCard';
import DashboardTable from '../components/dashboard/DashboardTable';
import QuickActionCard from '../components/dashboard/QuickActionCard';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/dashboard/admin');
        if (res.data?.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
        if (err.response?.status === 403 || err.response?.status === 401) {
          navigate('/403');
        } else {
          setError(err.response?.data?.message || 'Failed to fetch admin dashboard details.');
        }
      } finally {
        setLoading(false);
      }
    };

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
          onClick={() => window.location.reload()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-lg shadow-sm transition-all text-sm cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, latestUsers, latestHackathons } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Admin Console</h1>
        <p className="text-gray-500 mt-2 text-base">Global platform overview, registration stats, and system configurations.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <StatCard icon={FaUsers} title="Total Users" count={stats?.totalUsers || 0} description="Aggregated platform membership" />
        <StatCard icon={FaUserTie} title="Organizers" count={stats?.totalOrganizers || 0} description="Hackathon organizers registered" />
        <StatCard icon={FaUserGraduate} title="Participants" count={stats?.totalParticipants || 0} description="Active hackathon competitors" />
        <StatCard icon={FaGavel} title="Judges" count={stats?.totalJudges || 0} description="Assigned evaluation judges" />
        <StatCard icon={FaTrophy} title="Hackathons" count={stats?.totalHackathons || 0} description="Created hackathon campaigns" />
        <StatCard icon={FaLayerGroup} title="Teams" count={stats?.totalTeams || 0} description="Assembled hackathon teams" />
        <StatCard icon={FaFileSignature} title="Registrations" count={stats?.totalRegistrations || 0} description="Competitor registrants enrolled" />
        <StatCard icon={FaFileUpload} title="Submissions" count={stats?.totalSubmissions || 0} description="Project submissions uploaded" />
        <StatCard icon={FaClipboardCheck} title="Reviews" count={stats?.totalReviews || 0} description="Submitted judge evaluation reviews" />
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Settings Shortcuts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <QuickActionCard
            icon={FaUserCog}
            title="Manage Users"
            description="View directory profiles, edit credential details, and block or unblock users."
            actionText="Go to User Manager"
            onClick={() => navigate('/admin/users')}
          />
          <QuickActionCard
            icon={FaFolderOpen}
            title="Manage Hackathons"
            description="Admin oversight of active campaigns, validation workflows, and leaderboard publication overrides."
            actionText="Go to Hackathons Control"
            onClick={() => alert('Redirecting to Admin Hackathons Dashboard...')}
          />
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Latest Users */}
        <div>
          <DashboardCard title="Latest User Directory" subtitle="Recently registered system user accounts">
            <DashboardTable
              headers={['User Name', 'Role', 'Status']}
              data={latestUsers}
              emptyMessage="No users are currently registered on the platform."
              renderRow={(user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    <div>
                      <p className="font-bold text-gray-950">{user.name}</p>
                      <p className="text-xs text-gray-400 font-medium">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {user.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${user.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {user.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                </tr>
              )}
            />
          </DashboardCard>
        </div>

        {/* Latest Hackathons */}
        <div>
          <DashboardCard title="Recently Added Hackathons" subtitle="Newest campaigns uploaded to the directory">
            <DashboardTable
              headers={['Hackathon Name', 'Theme', 'Status']}
              data={latestHackathons}
              emptyMessage="No hackathons have been created yet."
              renderRow={(hack) => (
                <tr key={hack._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    <div>
                      <p className="font-bold text-gray-950 truncate max-w-xs">{hack.title}</p>
                      <p className="text-xs text-gray-400 font-medium">By: {hack.createdBy?.name || 'Deleted Creator'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {hack.theme}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                      hack.status === 'Upcoming' ? 'bg-blue-100 text-blue-800' :
                      hack.status === 'Registration Open' ? 'bg-green-100 text-green-800' :
                      hack.status === 'Completed' ? 'bg-gray-150 text-gray-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {hack.status}
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

export default AdminDashboard;
