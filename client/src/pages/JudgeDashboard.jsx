import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaGavel, FaFolder, FaTasks, FaCheckCircle, FaAward, FaEdit, FaPlus, FaExternalLinkAlt } from 'react-icons/fa';
import StatCard from '../components/dashboard/StatCard';
import DashboardCard from '../components/dashboard/DashboardCard';
import DashboardTable from '../components/dashboard/DashboardTable';
import QuickActionCard from '../components/dashboard/QuickActionCard';

const JudgeDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('http://localhost:5099/api/dashboard/judge', { headers });
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        navigate('/403');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch judge dashboard details.');
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

  const { stats, assignedProjectsList } = data || {};

  // Find the first pending/unreviewed project to evaluate
  const firstUnreviewed = assignedProjectsList?.find((p) => p.status === 'Not Started' || p.status === 'Pending');

  const handleReviewProject = () => {
    if (!firstUnreviewed) {
      alert('You have evaluated all assigned projects!');
      return;
    }
    alert(`Redirecting to evaluate project: "${firstUnreviewed.projectName}"...`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Judge Panel</h1>
        <p className="text-gray-500 mt-2 text-base">Grade project submissions, update scorecards, and complete your assigned evaluations.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard icon={FaFolder} title="Assigned Hackathons" count={stats?.assignedHackathons || 0} description="Campaigns assigned to you" />
        <StatCard icon={FaTasks} title="Assigned Projects" count={stats?.assignedProjects || 0} description="Roster submissions to review" />
        <StatCard icon={FaGavel} title="Pending Reviews" count={stats?.pendingReviews || 0} description="Awaiting score submissions" />
        <StatCard icon={FaCheckCircle} title="Completed Reviews" count={stats?.completedReviews || 0} description="Finished project scorecards" />
      </div>

      {/* Quick Actions */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Evaluation Tools</h2>
        <div className="max-w-xl">
          <QuickActionCard
            icon={FaEdit}
            title="Review Next Project"
            description={
              firstUnreviewed
                ? `Evaluate next project: "${firstUnreviewed.projectName}" (Team: ${firstUnreviewed.teamName}) in ${firstUnreviewed.hackathonTitle}.`
                : "You have reviewed all projects assigned to you."
            }
            actionText={firstUnreviewed ? 'Start Grading' : 'All Complete!'}
            onClick={handleReviewProject}
          />
        </div>
      </div>

      {/* Detailed Table */}
      <DashboardCard title="Assigned Project List" subtitle="Submissions to evaluate for your hackathons">
        <DashboardTable
          headers={['Project Name', 'Team Name', 'Hackathon Title', 'Status', 'Total Score', 'Action']}
          data={assignedProjectsList}
          emptyMessage="No project submissions are currently assigned to you for evaluation."
          renderRow={(project) => (
            <tr key={project._id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                {project.projectName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                {project.teamName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium truncate max-w-xs">
                {project.hackathonTitle}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                  project.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {project.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-extrabold">
                {project.score !== null ? project.score : <span className="text-gray-300 font-normal">-</span>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {project.status === 'Completed' ? (
                  <span className="text-green-600 font-semibold text-xs flex items-center gap-1">Verified</span>
                ) : (
                  <button
                    onClick={() => alert(`Redirecting to evaluate project ID: ${project._id}`)}
                    className="text-indigo-650 hover:underline font-bold text-xs cursor-pointer"
                  >
                    Evaluate &rarr;
                  </button>
                )}
              </td>
            </tr>
          )}
        />
      </DashboardCard>
    </div>
  );
};

export default JudgeDashboard;
