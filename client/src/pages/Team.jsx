import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  FaUsers,
  FaArrowLeft,
  FaPlus,
  FaLock,
  FaUnlock,
  FaTrashAlt,
  FaSignOutAlt,
  FaEnvelope,
  FaChevronRight,
  FaShieldAlt,
  FaLink,
} from 'react-icons/fa';
import Loader from '../components/common/Loader';
import { Toast } from '../components/common/ErrorMessage';

const Team = () => {
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

  const [myTeams, setMyTeams] = useState([]);
  const [approvedRegistrations, setApprovedRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Form states
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamHackId, setNewTeamHackId] = useState('');
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [transferMemberId, setTransferMemberId] = useState('');
  const [teamErrors, setTeamErrors] = useState({});
  const [eligibleParticipants, setEligibleParticipants] = useState({});
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState({});

  const fetchEligibleForTeam = async (teamId) => {
    try {
      const res = await api.get(`/teams/${teamId}/eligible-participants`);
      if (res.data?.success) {
        setEligibleParticipants((prev) => ({
          ...prev,
          [teamId]: res.data.participants || [],
        }));
      }
    } catch (err) {
      console.error('Failed to fetch eligible participants:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch my teams
      const teamsRes = await api.get('/teams/my');
      if (teamsRes.data?.success) {
        const teams = teamsRes.data.teams || [];
        setMyTeams(teams);
        for (const t of teams) {
          const isLeader = t.leader?._id
            ? t.leader._id.toString() === user?.id
            : t.leader?.toString() === user?.id;
          if (isLeader) {
            await fetchEligibleForTeam(t._id);
          }
        }
      }

      // 2. Fetch approved registrations to populate Start a Team select
      const registerRes = await api.get('/dashboard/participant');
      if (registerRes.data?.success) {
        const regs = registerRes.data.registrations || [];
        setApprovedRegistrations(regs.filter((r) => r.status === 'Approved'));
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        navigate('/403');
      } else {
        setToast({ type: 'error', message: 'Failed to fetch team details.' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const fetchMyTeamsOnly = async () => {
    setTeamLoading(true);
    try {
      const teamsRes = await api.get('/teams/my');
      if (teamsRes.data?.success) {
        const teams = teamsRes.data.teams || [];
        setMyTeams(teams);
        for (const t of teams) {
          const isLeader = t.leader?._id
            ? t.leader._id.toString() === user?.id
            : t.leader?.toString() === user?.id;
          if (isLeader) {
            await fetchEligibleForTeam(t._id);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to refresh roster.' });
    } finally {
      setTeamLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setTeamErrors({});
    if (!newTeamName.trim()) {
      setTeamErrors({ name: 'Team Name is required' });
      return;
    }
    if (!newTeamHackId) {
      setTeamErrors({ hack: 'Select an approved hackathon registration' });
      return;
    }

    try {
      setTeamLoading(true);
      const res = await api.post('/teams', {
        teamName: newTeamName.trim(),
        hackathon: newTeamHackId,
      });
      if (res.data?.success) {
        setToast({ type: 'success', message: 'Team created successfully!' });
        setNewTeamName('');
        setNewTeamHackId('');
        await fetchMyTeamsOnly();
        // Refresh approved list
        const registerRes = await api.get('/dashboard/participant');
        if (registerRes.data?.success) {
          const regs = registerRes.data.registrations || [];
          setApprovedRegistrations(regs.filter((r) => r.status === 'Approved'));
        }
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to create team.' });
    } finally {
      setTeamLoading(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    setTeamErrors({});
    if (!joinInviteCode.trim()) {
      setTeamErrors({ code: 'Invite Code is required' });
      return;
    }

    try {
      setTeamLoading(true);
      const res = await api.post('/teams/join', { inviteCode: joinInviteCode.trim() });
      if (res.data?.success) {
        setToast({ type: 'success', message: 'Joined team successfully!' });
        setJoinInviteCode('');
        await fetchMyTeamsOnly();
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Invalid invite code or registration.' });
    } finally {
      setTeamLoading(false);
    }
  };

  const handleToggleLockTeam = async (teamId, currentStatus) => {
    try {
      setTeamLoading(true);
      const nextStatus = currentStatus === 'Active' ? 'Locked' : 'Active';
      const res = await api.put(`/teams/${teamId}`, { status: nextStatus });
      if (res.data?.success) {
        setToast({ type: 'success', message: `Team status updated to ${nextStatus}!` });
        await fetchMyTeamsOnly();
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to lock team.' });
    } finally {
      setTeamLoading(false);
    }
  };

  const handleLeaveTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to leave this team?')) return;
    try {
      setTeamLoading(true);
      const res = await api.delete(`/teams/${teamId}/leave`);
      if (res.data?.success) {
        setToast({ type: 'success', message: 'Left team successfully!' });
        await fetchMyTeamsOnly();
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to leave team.' });
    } finally {
      setTeamLoading(false);
    }
  };

  const handleDisbandTeam = async (teamId) => {
    if (!window.confirm('Are you absolutely sure you want to disband this team? All member slots will be deleted.')) return;
    try {
      setTeamLoading(true);
      const res = await api.delete(`/teams/${teamId}`);
      if (res.data?.success) {
        setToast({ type: 'success', message: 'Team disbanded successfully!' });
        await fetchMyTeamsOnly();
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to disband team.' });
    } finally {
      setTeamLoading(false);
    }
  };

  const handleTransferLeadership = async (teamId) => {
    if (!transferMemberId) {
      setToast({ type: 'error', message: 'Select a member to transfer leadership.' });
      return;
    }
    if (!window.confirm('Are you sure you want to transfer team ownership? This cannot be undone.')) return;
    try {
      setTeamLoading(true);
      const res = await api.put(`/teams/${teamId}/transfer-leadership`, { memberId: transferMemberId });
      if (res.data?.success) {
        setToast({ type: 'success', message: 'Leadership transferred successfully!' });
        setTransferMemberId('');
        await fetchMyTeamsOnly();
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to transfer leadership.' });
    } finally {
      setTeamLoading(false);
    }
  };

  const handleAddMember = async (teamId) => {
    const memberId = selectedMemberToAdd[teamId];
    if (!memberId) {
      setToast({ type: 'error', message: 'Please select a participant to add.' });
      return;
    }

    try {
      setTeamLoading(true);
      const res = await api.post(`/teams/${teamId}/add-member`, { memberId });
      if (res.data?.success) {
        setToast({ type: 'success', message: 'Member added to team successfully!' });
        setSelectedMemberToAdd((prev) => ({ ...prev, [teamId]: '' }));
        await fetchMyTeamsOnly();
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to add member.' });
    } finally {
      setTeamLoading(false);
    }
  };

  const handleRemoveMember = async (teamId, memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) return;
    try {
      setTeamLoading(true);
      const res = await api.delete(`/teams/${teamId}/remove-member/${memberId}`);
      if (res.data?.success) {
        setToast({ type: 'success', message: `${memberName} removed from team successfully.` });
        await fetchMyTeamsOnly();
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to remove member.' });
    } finally {
      setTeamLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#edf3f6]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edf3f6] text-slate-950 font-sans py-12">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Header link */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-xs font-black text-[#247d8b] hover:text-[#13444e] transition-colors uppercase tracking-wider cursor-pointer"
          >
            <FaArrowLeft /> Dashboard
          </button>
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-white border border-slate-200 px-3.5 py-1.5 rounded-full select-none shadow-sm">
            Roster: {myTeams.length} {myTeams.length === 1 ? 'Team' : 'Teams'}
          </span>
        </div>

        {teamLoading && (
          <div className="bg-white/80 backdrop-blur-xs border border-slate-200 p-4 rounded-2xl flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Syncing roster...</p>
          </div>
        )}

        {myTeams.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Create Team card */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-650 border border-indigo-150 shadow-sm">
                  <FaPlus className="text-sm" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Start a new squad</h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Create a new squad directory for an approved hackathon registration. You will automatically be assigned as team leader.
              </p>

              <form onSubmit={handleCreateTeam} className="space-y-4 pt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Team Name</label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Coders Guild"
                    className="text-xs rounded-xl border border-slate-200 p-3 bg-slate-50 focus:ring-1 focus:ring-[#247d8b] focus:outline-none font-bold text-slate-800"
                  />
                  {teamErrors.name && <p className="text-[10px] font-bold text-red-650 mt-1">{teamErrors.name}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Approved Hackathon</label>
                  <select
                    value={newTeamHackId}
                    onChange={(e) => setNewTeamHackId(e.target.value)}
                    className="text-xs rounded-xl border border-slate-200 p-3 bg-slate-50 font-bold text-slate-700 focus:ring-1 focus:ring-[#247d8b] focus:outline-none cursor-pointer"
                  >
                    <option value="">Select Option</option>
                    {approvedRegistrations.map((r) => (
                      <option key={r.hackathon?._id} value={r.hackathon?._id}>
                        {r.hackathon?.title}
                      </option>
                    ))}
                  </select>
                  {teamErrors.hack && <p className="text-[10px] font-bold text-red-650 mt-1">{teamErrors.hack}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-950 hover:bg-[#247d8b] text-white font-black py-3 px-4 rounded-xl text-xs shadow-md transition-all cursor-pointer uppercase tracking-widest mt-2"
                >
                  Create Team
                </button>
              </form>
            </div>

            {/* Join Team card */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf3f6] text-[#247d8b] border border-slate-200 shadow-sm">
                  <FaUsers className="text-sm" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Join an existing squad</h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Have an invite code from another team leader? Enter the custom invite token below to enroll instantly in their team.
              </p>

              <form onSubmit={handleJoinTeam} className="space-y-4 pt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Invite Code</label>
                  <input
                    type="text"
                    value={joinInviteCode}
                    onChange={(e) => setJoinInviteCode(e.target.value)}
                    placeholder="JOIN-XXXXXX"
                    className="text-xs rounded-xl border border-slate-200 p-3 bg-slate-50 focus:ring-1 focus:ring-[#247d8b] focus:outline-none font-mono font-bold tracking-wider text-slate-800"
                  />
                  {teamErrors.code && <p className="text-[10px] font-bold text-red-650 mt-1">{teamErrors.code}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#247d8b] hover:bg-[#13444e] text-white font-black py-3 px-4 rounded-xl text-xs shadow-md transition-all cursor-pointer uppercase tracking-widest mt-12"
                >
                  Join Team
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div className="space-y-6">
            {myTeams.map((t) => {
              const isLeader = t.leader?._id
                ? t.leader._id.toString() === user?.id
                : t.leader?.toString() === user?.id;

              const otherMembers = t.members?.filter((m) =>
                m._id ? m._id.toString() !== user?.id : m.toString() !== user?.id
              ) || [];

              return (
                <div key={t._id} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm space-y-6">
                  
                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{t.teamName}</h3>
                      <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase tracking-widest">
                        Challenge: {t.hackathon?.title}
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      t.status === 'Locked'
                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {t.status === 'Locked' ? <FaLock className="text-[8px]" /> : <FaUnlock className="text-[8px]" />}
                      {t.status}
                    </span>
                  </div>

                  {/* Invite Code display */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <FaLink className="text-slate-400" />
                      <p className="text-slate-500">Invite Code:</p>
                    </div>
                    <span className="bg-[#edf3f6] text-[#247d8b] font-bold px-3 py-1 rounded-lg border border-slate-200 select-all font-mono tracking-widest text-xs">
                      {t.inviteCode}
                    </span>
                  </div>

                  {/* Members list */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest"> Roster Members</h4>
                    <div className="divide-y divide-slate-100 bg-slate-50 border border-slate-150 rounded-2xl p-4">
                      {t.members?.map((m) => (
                        <div key={m._id || m} className="py-3 first:pt-0 last:pb-0 flex justify-between items-center text-xs font-semibold">
                          <div>
                            <p className="text-slate-800 font-extrabold">{m.name || 'Anonymous Member'}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{m.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${
                              (m._id || m) === (t.leader?._id || t.leader) ? 'text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md' : 'text-slate-400'
                            }`}>
                              {(m._id || m) === (t.leader?._id || t.leader) ? 'Leader' : 'Member'}
                            </span>
                            {isLeader && (m._id || m) !== (t.leader?._id || t.leader) && (
                              <button
                                onClick={() => handleRemoveMember(t._id, m._id, m.name)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove Member"
                              >
                                <FaTrashAlt className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leader actions */}
                  {isLeader && (
                    <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-5 space-y-4">
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                        <FaShieldAlt className="text-indigo-500" /> Leader Cockpit Controls
                      </h4>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* Lock toggle button */}
                        <button
                          onClick={() => handleToggleLockTeam(t._id, t.status)}
                          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          {t.status === 'Locked' ? (
                            <>
                              <FaUnlock className="text-emerald-500" /> Unlock Team
                            </>
                          ) : (
                            <>
                              <FaLock className="text-rose-500" /> Lock Team
                            </>
                          )}
                        </button>

                        {/* Disband button */}
                        <button
                          onClick={() => handleDisbandTeam(t._id)}
                          className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <FaTrashAlt /> Disband Team
                        </button>
                      </div>

                      {/* Transfer Leadership option */}
                      {otherMembers.length > 0 && (
                        <div className="pt-3 border-t border-indigo-100 flex flex-col sm:flex-row sm:items-center gap-2 max-w-md">
                          <select
                            value={transferMemberId}
                            onChange={(e) => setTransferMemberId(e.target.value)}
                            className="text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none flex-grow cursor-pointer"
                          >
                            <option value="">Select Member to Transfer</option>
                            {otherMembers.map((m) => (
                              <option key={m._id} value={m._id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleTransferLeadership(t._id)}
                            className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer uppercase tracking-wider"
                          >
                            Transfer Lead
                          </button>
                        </div>
                      )}

                      {/* Add Member Directly option */}
                      <div className="pt-3 border-t border-indigo-100 flex flex-col sm:flex-row sm:items-center gap-2 max-w-md">
                        <select
                          value={selectedMemberToAdd[t._id] || ''}
                          onChange={(e) => setSelectedMemberToAdd((prev) => ({ ...prev, [t._id]: e.target.value }))}
                          className="text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none flex-grow cursor-pointer"
                        >
                          <option value="">Select Participant to Add</option>
                          {(eligibleParticipants[t._id] || []).map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name} ({p.email})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAddMember(t._id)}
                          className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer uppercase tracking-wider"
                        >
                          Add Member
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Member action */}
                  {!isLeader && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleLeaveTeam(t._id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-150 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <FaSignOutAlt /> Leave Team
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default Team;
