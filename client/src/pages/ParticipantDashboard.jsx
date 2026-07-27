import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  FaSignature,
  FaUsers,
  FaFileUpload,
  FaAward,
  FaCalendarAlt,
  FaLaptopCode,
  FaWrench,
  FaExternalLinkAlt,
  FaChevronRight,
  FaPlus,
  FaLock,
  FaUnlock,
  FaSignOutAlt,
  FaTrashAlt,
  FaLink,
} from 'react-icons/fa';
import StatCard from '../components/dashboard/StatCard';
import DashboardCard from '../components/dashboard/DashboardCard';
import DashboardTable from '../components/dashboard/DashboardTable';
import QuickActionCard from '../components/dashboard/QuickActionCard';
import Modal from '../components/common/Modal';
import Loader, { SkeletonTable } from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { Toast } from '../components/common/ErrorMessage';

const ParticipantDashboard = () => {
  const navigate = useNavigate();

  // Summary states
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Toast feedback
  const [toast, setToast] = useState(null);

  // Modal control states
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [isSubOpen, setIsSubOpen] = useState(false);

  // --- 1. TEAM HUB STATES ---
  const [myTeams, setMyTeams] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamHackId, setNewTeamHackId] = useState('');
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [transferMemberId, setTransferMemberId] = useState('');
  const [teamErrors, setTeamErrors] = useState({});

  // --- 2. PROJECT SUBMISSION STATES ---
  const [subProjName, setSubProjName] = useState('');
  const [subProblem, setSubProblem] = useState('');
  const [subSolution, setSubSolution] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subGithub, setSubGithub] = useState('');
  const [subLive, setSubLive] = useState('');
  const [subStack, setSubStack] = useState('');
  const [subVideo, setSubVideo] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [activeSubmissionId, setActiveSubmissionId] = useState('');
  const [subErrors, setSubErrors] = useState({});

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/dashboard/participant');
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

  // --- FETCH MY TEAMS FOR HUB ---
  const fetchMyTeams = async () => {
    setTeamLoading(true);
    try {
      const res = await api.get('/teams/my');
      if (res.data?.success) {
        setMyTeams(res.data.teams || []);
        if (res.data.teams?.length > 0) {
          setSelectedTeamId(res.data.teams[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to fetch team listings.' });
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    if (isTeamOpen) {
      fetchMyTeams();
    }
  }, [isTeamOpen]);

  // --- FETCH SUBMISSION DETAILS FOR MODAL (PREFILL IF EXISTS) ---
  const fetchActiveSubmission = async () => {
    try {
      const res = await api.get('/submissions/my');
      if (res.data?.success && res.data.submission) {
        const s = res.data.submission;
        setActiveSubmissionId(s._id);
        setSubProjName(s.projectName || '');
        setSubProblem(s.problemStatement || '');
        setSubSolution(s.solution || '');
        setSubDesc(s.description || '');
        setSubGithub(s.githubRepository || '');
        setSubLive(s.liveDemo || '');
        setSubStack(s.techStack ? s.techStack.join(', ') : '');
        setSubVideo(s.demoVideo || '');
        if (s.team?._id) setSelectedTeamId(s.team._id);
      }
    } catch (err) {
      // If 404 is returned, no submission exists yet (normal workflow)
      setActiveSubmissionId('');
      setSubProjName('');
      setSubProblem('');
      setSubSolution('');
      setSubDesc('');
      setSubGithub('');
      setSubLive('');
      setSubStack('');
      setSubVideo('');
    }
  };

  useEffect(() => {
    if (isSubOpen) {
      fetchActiveSubmission();
    }
  }, [isSubOpen]);

  // --- TEAM HUB ACTIONS ---

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      setTeamErrors({ name: 'Team Name is required' });
      return;
    }
    if (!newTeamHackId) {
      setTeamErrors({ hack: 'Select a hackathon registration' });
      return;
    }

    try {
      const res = await api.post('/teams', {
        teamName: newTeamName.trim(),
        hackathon: newTeamHackId,
      });
      if (res.data?.success) {
        setToast({ type: 'success', message: 'Team created successfully!' });
        setNewTeamName('');
        setNewTeamHackId('');
        fetchMyTeams();
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to create team.' });
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!joinInviteCode.trim()) {
      setTeamErrors({ code: 'Invite Code is required' });
      return;
    }

    try {
      const res = await api.post('/teams/join', { inviteCode: joinInviteCode.trim() });
      if (res.data?.success) {
        setToast({ type: 'success', message: 'Joined team successfully!' });
        setJoinInviteCode('');
        fetchMyTeams();
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Invalid invite code or registration.' });
    }
  };

  const handleToggleLockTeam = async (teamId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'Active' ? 'Locked' : 'Active';
      const res = await api.put(`/teams/${teamId}`, { status: nextStatus });
      if (res.data?.success) {
        setToast({ type: 'success', message: `Team status updated to ${nextStatus}!` });
        fetchMyTeams();
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to lock team.' });
    }
  };

  const handleLeaveTeam = async (teamId) => {
    try {
      const res = await api.delete(`/teams/${teamId}/leave`);
      if (res.data?.success) {
        setToast({ type: 'success', message: 'Left team successfully!' });
        fetchMyTeams();
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to leave team.' });
    }
  };

  const handleDisbandTeam = async (teamId) => {
    if (!window.confirm('Are you absolutely sure you want to disband this team?')) return;
    try {
      const res = await api.delete(`/teams/${teamId}`);
      if (res.data?.success) {
        setToast({ type: 'success', message: 'Team disbanded successfully!' });
        fetchMyTeams();
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to disband team.' });
    }
  };

  const handleTransferLeadership = async (teamId) => {
    if (!transferMemberId) return;
    try {
      const res = await api.put(`/teams/${teamId}/transfer-leadership`, { memberId: transferMemberId });
      if (res.data?.success) {
        setToast({ type: 'success', message: 'Leadership transferred successfully!' });
        setTransferMemberId('');
        fetchMyTeams();
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to transfer leadership.' });
    }
  };

  // --- PROJECT SUBMISSION ACTIONS ---

  const validateSubmission = () => {
    const errs = {};
    if (!subProjName.trim()) errs.projectName = 'Project name is required';
    if (!subProblem.trim()) errs.problemStatement = 'Problem statement is required';
    if (!subSolution.trim()) errs.solution = 'Solution description is required';
    if (!subStack.trim()) errs.techStack = 'Tech stack is required';

    const gitHubRegex = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/?.*$/i;
    if (!subGithub.trim()) {
      errs.githubRepository = 'GitHub URL is required';
    } else if (!gitHubRegex.test(subGithub)) {
      errs.githubRepository = 'Invalid GitHub repository URL';
    }

    const urlRegex = /^(https?:\/\/)/i;
    if (subLive && !urlRegex.test(subLive)) {
      errs.liveDemo = 'Invalid Live Demo URL (Must start with http:// or https://)';
    }
    if (subVideo && !urlRegex.test(subVideo)) {
      errs.demoVideo = 'Invalid Video URL (Must start with http:// or https://)';
    }

    setSubErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    if (!validateSubmission()) return;

    const payload = {
      projectName: subProjName.trim(),
      problemStatement: subProblem.trim(),
      solution: subSolution.trim(),
      description: subDesc.trim(),
      githubRepository: subGithub.trim(),
      liveDemo: subLive.trim(),
      techStack: subStack,
      demoVideo: subVideo.trim(),
    };

    try {
      let res;
      if (activeSubmissionId) {
        res = await api.put(`/submissions/${activeSubmissionId}`, payload);
      } else {
        res = await api.post('/submissions', payload);
      }

      if (res.data?.success) {
        setToast({ type: 'success', message: 'Project details uploaded successfully!' });
        setIsSubOpen(false);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to submit project solution.' });
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
        <p className="text-red-650 font-bold text-lg mb-4">Error loading workspace</p>
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

  // Find user details from localStorage
  const currentLocalUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  })();

  // Filter approved hackathons that this participant belongs to, for creating a team
  const approvedRegistrations = recentRegistrations?.filter((r) => r.status === 'Approved') || [];

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
            onClick={() => setIsTeamOpen(true)}
          />
          <QuickActionCard
            icon={FaWrench}
            title="Edit Submission"
            description="Modify your uploaded GitHub repos, tech stack, screenshots, and solutions."
            actionText="Update Uploads"
            onClick={() => setIsSubOpen(true)}
          />
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="space-y-10">
        {/* Registrations List */}
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

          {/* Leaderboards position */}
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

      {/* ========================================================================= */}
      {/* MODAL 1: TEAM HUB PANEL                                                   */}
      {/* ========================================================================= */}
      <Modal isOpen={isTeamOpen} onClose={() => setIsTeamOpen(false)} title="Team Hub Roster">
        <div className="space-y-6 text-left">
          {teamLoading ? (
            <Loader />
          ) : myTeams.length === 0 ? (
            <div className="space-y-6">
              {/* Not in any team: Create or Join layout */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs font-semibold text-amber-850">
                You do not currently belong to any team for upcoming hackathons. Create a team or enter a join code.
              </div>

              {/* Create Team Form */}
              <form onSubmit={handleCreateTeam} className="space-y-3 pt-3 border-t border-gray-150">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Start a Team</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500">Team Name</label>
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Coders Guild"
                      className="text-xs rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
                    />
                    {teamErrors.name && <p className="text-[9px] font-bold text-red-650">{teamErrors.name}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500">Hackathon</label>
                    <select
                      value={newTeamHackId}
                      onChange={(e) => setNewTeamHackId(e.target.value)}
                      className="text-xs rounded-lg border border-gray-200 p-2 bg-gray-50 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Option</option>
                      {approvedRegistrations.map((r) => (
                        <option key={r.hackathon?._id} value={r.hackathon?._id}>
                          {r.hackathon?.title}
                        </option>
                      ))}
                    </select>
                    {teamErrors.hack && <p className="text-[9px] font-bold text-red-650">{teamErrors.hack}</p>}
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                >
                  Create Team
                </button>
              </form>

              {/* Join Team Form */}
              <form onSubmit={handleJoinTeam} className="space-y-3 pt-6 border-t border-gray-150">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Join via Invite Code</h4>
                <div className="flex gap-2">
                  <div className="flex flex-col gap-1 flex-grow">
                    <input
                      type="text"
                      value={joinInviteCode}
                      onChange={(e) => setJoinInviteCode(e.target.value)}
                      placeholder="JOIN-XXXXXX"
                      className="text-xs rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
                    />
                    {teamErrors.code && <p className="text-[9px] font-bold text-red-650">{teamErrors.code}</p>}
                  </div>
                  <button
                    type="submit"
                    className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-5 rounded-xl text-xs shadow-xs transition-all cursor-pointer h-[38px]"
                  >
                    Join
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              {myTeams.map((t) => {
                const isLeader = t.leader?._id
                  ? t.leader._id.toString() === currentLocalUser?.id
                  : t.leader?.toString() === currentLocalUser?.id;

                const otherMembers = t.members?.filter((m) =>
                  m._id ? m._id.toString() !== currentLocalUser?.id : m.toString() !== currentLocalUser?.id
                ) || [];

                return (
                  <div key={t._id} className="border border-gray-200 rounded-xl p-5 shadow-xs bg-white space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-gray-900">{t.teamName}</h4>
                        <span className="text-[10px] text-gray-400 font-bold block mt-1 uppercase">
                          Hackathon: {t.hackathon?.title}
                        </span>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        t.status === 'Locked' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    {/* Invite details */}
                    <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center text-xs font-semibold">
                      <p className="text-gray-500">Invite Code:</p>
                      <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg border border-indigo-100 select-all font-mono tracking-wider">
                        {t.inviteCode}
                      </span>
                    </div>

                    {/* Members List */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Roster Members</p>
                      <div className="divide-y divide-gray-100">
                        {t.members?.map((m) => (
                          <div key={m._id || m} className="py-2.5 flex justify-between items-center text-xs font-semibold">
                            <div>
                              <p className="text-gray-800 font-bold">{m.name || 'Anonymous'}</p>
                              <p className="text-[10px] text-gray-400 font-medium">{m.email}</p>
                            </div>
                            <span className={`text-[10px] font-extrabold uppercase ${
                              (m._id || m) === (t.leader?._id || t.leader) ? 'text-indigo-650' : 'text-gray-400'
                            }`}>
                              {(m._id || m) === (t.leader?._id || t.leader) ? 'Leader' : 'Member'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
                      {isLeader ? (
                        <>
                          {/* Toggle Lock status */}
                          <button
                            onClick={() => handleToggleLockTeam(t._id, t.status)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            {t.status === 'Active' ? (
                              <>
                                <FaLock className="text-[10px]" /> Lock Team
                              </>
                            ) : (
                              <>
                                <FaUnlock className="text-[10px]" /> Unlock Team
                              </>
                            )}
                          </button>

                          {/* Leader transfer dropdown and submit */}
                          {otherMembers.length > 0 && (
                            <div className="flex gap-1.5 items-center">
                              <select
                                value={transferMemberId}
                                onChange={(e) => setTransferMemberId(e.target.value)}
                                className="text-xs rounded-xl border border-gray-200 p-1.5 bg-gray-50 font-bold text-gray-700 focus:outline-none"
                              >
                                <option value="">Transfer To</option>
                                {otherMembers.map((m) => (
                                  <option key={m._id} value={m._id}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleTransferLeadership(t._id)}
                                disabled={!transferMemberId}
                                className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-2 py-1.5 rounded-xl text-xs shadow-xs transition-colors cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                              >
                                Go
                              </button>
                            </div>
                          )}

                          {/* Disband team */}
                          <button
                            onClick={() => handleDisbandTeam(t._id)}
                            className="bg-red-50 hover:bg-red-100 text-red-650 border border-red-150 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <FaTrashAlt className="text-[10px]" /> Disband
                          </button>
                        </>
                      ) : (
                        /* Member leave team */
                        <button
                          onClick={() => handleLeaveTeam(t._id)}
                          className="bg-red-50 hover:bg-red-100 text-red-650 border border-red-150 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <FaSignOutAlt className="text-[10px]" /> Leave Team
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: PROJECT SUBMISSION / EDIT FORM                                   */}
      {/* ========================================================================= */}
      <Modal isOpen={isSubOpen} onClose={() => setIsSubOpen(false)} title="Project Solution Workspace">
        {myTeams.length === 0 ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs font-bold text-red-800 text-left">
            You must belong to an active, locked team to upload or manage submission projects. Check your Team Hub.
          </div>
        ) : (
          <form onSubmit={handleSubmitProject} className="space-y-4 text-left">
            {/* Title */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Project Name*</label>
              <input
                type="text"
                value={subProjName}
                onChange={(e) => setSubProjName(e.target.value)}
                placeholder="Healthify Tracker"
                className="text-sm rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
              />
              {subErrors.projectName && <p className="text-[10px] font-bold text-red-600">{subErrors.projectName}</p>}
            </div>

            {/* Problem Statement and Solution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Problem Statement*</label>
                <textarea
                  value={subProblem}
                  onChange={(e) => setSubProblem(e.target.value)}
                  placeholder="Summarize the core target issue..."
                  rows={2}
                  className="text-sm rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
                />
                {subErrors.problemStatement && <p className="text-[10px] font-bold text-red-600">{subErrors.problemStatement}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Our Solution*</label>
                <textarea
                  value={subSolution}
                  onChange={(e) => setSubSolution(e.target.value)}
                  placeholder="Describe how your prototype addresses it..."
                  rows={2}
                  className="text-sm rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
                />
                {subErrors.solution && <p className="text-[10px] font-bold text-red-600">{subErrors.solution}</p>}
              </div>
            </div>

            {/* GitHub Repository */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">GitHub Repository URL*</label>
              <input
                type="text"
                value={subGithub}
                onChange={(e) => setSubGithub(e.target.value)}
                placeholder="https://github.com/user/repo"
                className="text-sm rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium font-mono text-gray-700"
              />
              {subErrors.githubRepository && <p className="text-[10px] font-bold text-red-600">{subErrors.githubRepository}</p>}
            </div>

            {/* Live Demo and Demo Video Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Live Demo Link (URL)</label>
                <input
                  type="text"
                  value={subLive}
                  onChange={(e) => setSubLive(e.target.value)}
                  placeholder="https://demo.example.com"
                  className="text-sm rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium font-mono text-gray-750"
                />
                {subErrors.liveDemo && <p className="text-[10px] font-bold text-red-600">{subErrors.liveDemo}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Demo Video Link (URL)</label>
                <input
                  type="text"
                  value={subVideo}
                  onChange={(e) => setSubVideo(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="text-sm rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium font-mono text-gray-750"
                />
                {subErrors.demoVideo && <p className="text-[10px] font-bold text-red-600">{subErrors.demoVideo}</p>}
              </div>
            </div>

            {/* Tech Stack */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Tech Stack (comma separated)*</label>
              <input
                type="text"
                value={subStack}
                onChange={(e) => setSubStack(e.target.value)}
                placeholder="React, Node.js, MongoDB, Tailwind"
                className="text-sm rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
              />
              {subErrors.techStack && <p className="text-[10px] font-bold text-red-600">{subErrors.techStack}</p>}
            </div>

            {/* Description details */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Project Description</label>
              <textarea
                value={subDesc}
                onChange={(e) => setSubDesc(e.target.value)}
                placeholder="Explain the features, architecture, and installation..."
                rows={2}
                className="text-sm rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
              />
            </div>

            <div className="pt-3 border-t border-gray-150 flex gap-3 justify-end mt-4">
              <button
                type="button"
                onClick={() => setIsSubOpen(false)}
                className="px-4 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-550 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {activeSubmissionId ? 'Save Changes' : 'Upload Solution'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ParticipantDashboard;
