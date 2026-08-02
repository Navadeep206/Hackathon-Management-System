import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  FaArrowLeft,
  FaFileUpload,
  FaGithub,
  FaLink,
  FaVideo,
  FaTools,
  FaClipboardList,
} from 'react-icons/fa';
import Loader from '../components/common/Loader';
import { Toast } from '../components/common/ErrorMessage';

const Submission = () => {
  const navigate = useNavigate();

  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Form states
  const [subProjName, setSubProjName] = useState('');
  const [subProblem, setSubProblem] = useState('');
  const [subSolution, setSubSolution] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subGithub, setSubGithub] = useState('');
  const [subLive, setSubLive] = useState('');
  const [subStack, setSubStack] = useState('');
  const [subVideo, setSubVideo] = useState('');
  const [activeSubmissionId, setActiveSubmissionId] = useState('');
  const [subErrors, setSubErrors] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch my teams
      const teamsRes = await api.get('/teams/my');
      if (teamsRes.data?.success) {
        setMyTeams(teamsRes.data.teams || []);
      }

      // 2. Fetch my active submission (prefill if exists)
      try {
        const subRes = await api.get('/submissions/my');
        if (subRes.data?.success && subRes.data.submission) {
          const s = subRes.data.submission;
          setActiveSubmissionId(s._id);
          setSubProjName(s.projectName || '');
          setSubProblem(s.problemStatement || '');
          setSubSolution(s.solution || '');
          setSubDesc(s.description || '');
          setSubGithub(s.githubRepository || '');
          setSubLive(s.liveDemo || '');
          setSubStack(s.techStack ? s.techStack.join(', ') : '');
          setSubVideo(s.demoVideo || '');
        }
      } catch (err) {
        // If 404, no submission exists yet (normal participant flow)
        setActiveSubmissionId('');
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        navigate('/403');
      } else {
        setToast({ type: 'error', message: 'Failed to fetch submission details.' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

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
      setSubLoading(true);
      let res;
      if (activeSubmissionId) {
        res = await api.put(`/submissions/${activeSubmissionId}`, payload);
      } else {
        res = await api.post('/submissions', payload);
      }

      if (res.data?.success) {
        setToast({ type: 'success', message: 'Project solution uploaded successfully!' });
        if (res.data.submission?._id) {
          setActiveSubmissionId(res.data.submission._id);
        }
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to upload project solution.' });
    } finally {
      setSubLoading(false);
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Back Link */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-xs font-black text-[#247d8b] hover:text-[#13444e] transition-colors uppercase tracking-wider cursor-pointer"
          >
            <FaArrowLeft /> Dashboard
          </button>
          {activeSubmissionId && (
            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-full select-none shadow-sm flex items-center gap-1.5">
              <FaFileUpload className="text-xs" /> Submission Active
            </span>
          )}
        </div>

        {myTeams.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 text-center shadow-md space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center mx-auto">
              <FaFileUpload className="text-lg" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Roster team required</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              You must belong to an active, locked team to upload or manage submission projects. Please form a team or join one first.
            </p>
            <button
              onClick={() => navigate('/team')}
              className="bg-slate-950 hover:bg-[#247d8b] text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer inline-block"
            >
              Configure Team Hub
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 sm:p-10 shadow-lg space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-650 border border-indigo-150">
                <FaFileUpload className="text-sm" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Project Solution Workspace</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                  Team: {myTeams[0]?.teamName}
                </p>
              </div>
            </div>

            {subLoading && (
              <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-2xl flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Syncing project to server...</p>
              </div>
            )}

            <form onSubmit={handleSubmitProject} className="space-y-5 text-sm font-medium">
              
              {/* Project Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Project Title*</label>
                <input
                  type="text"
                  value={subProjName}
                  onChange={(e) => setSubProjName(e.target.value)}
                  placeholder="Healthify Tracker"
                  className="text-xs rounded-xl border border-slate-200 p-3 bg-slate-50 focus:ring-1 focus:ring-[#247d8b] focus:outline-none font-bold text-slate-800"
                />
                {subErrors.projectName && <p className="text-[10px] font-bold text-red-650 mt-1">{subErrors.projectName}</p>}
              </div>

              {/* Problem Statement and Solution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Problem Statement*</label>
                  <textarea
                    value={subProblem}
                    onChange={(e) => setSubProblem(e.target.value)}
                    placeholder="Summarize the core target issue..."
                    rows={3}
                    className="text-xs rounded-xl border border-slate-200 p-3 bg-slate-50 focus:ring-1 focus:ring-[#247d8b] focus:outline-none font-bold text-slate-800"
                  />
                  {subErrors.problemStatement && <p className="text-[10px] font-bold text-red-650 mt-1">{subErrors.problemStatement}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Our Solution*</label>
                  <textarea
                    value={subSolution}
                    onChange={(e) => setSubSolution(e.target.value)}
                    placeholder="Describe how your prototype addresses it..."
                    rows={3}
                    className="text-xs rounded-xl border border-slate-200 p-3 bg-slate-50 focus:ring-1 focus:ring-[#247d8b] focus:outline-none font-bold text-slate-800"
                  />
                  {subErrors.solution && <p className="text-[10px] font-bold text-red-650 mt-1">{subErrors.solution}</p>}
                </div>
              </div>

              {/* GitHub Repository */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
                  <FaGithub className="text-slate-450 text-xs" /> GitHub Repository URL*
                </label>
                <input
                  type="text"
                  value={subGithub}
                  onChange={(e) => setSubGithub(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="text-xs rounded-xl border border-slate-200 p-3 bg-slate-50 focus:ring-1 focus:ring-[#247d8b] focus:outline-none font-mono font-bold text-slate-700"
                />
                {subErrors.githubRepository && <p className="text-[10px] font-bold text-red-650 mt-1">{subErrors.githubRepository}</p>}
              </div>

              {/* Live Demo and Demo Video Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
                    <FaLink className="text-slate-450 text-xs" /> Live Demo Link (URL)
                  </label>
                  <input
                    type="text"
                    value={subLive}
                    onChange={(e) => setSubLive(e.target.value)}
                    placeholder="https://demo.example.com"
                    className="text-xs rounded-xl border border-slate-200 p-3 bg-slate-50 focus:ring-1 focus:ring-[#247d8b] focus:outline-none font-mono font-bold text-slate-700"
                  />
                  {subErrors.liveDemo && <p className="text-[10px] font-bold text-red-650 mt-1">{subErrors.liveDemo}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
                    <FaVideo className="text-slate-450 text-xs" /> Demo Video Link (URL)
                  </label>
                  <input
                    type="text"
                    value={subVideo}
                    onChange={(e) => setSubVideo(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="text-xs rounded-xl border border-slate-200 p-3 bg-slate-50 focus:ring-1 focus:ring-[#247d8b] focus:outline-none font-mono font-bold text-slate-700"
                  />
                  {subErrors.demoVideo && <p className="text-[10px] font-bold text-red-650 mt-1">{subErrors.demoVideo}</p>}
                </div>
              </div>

              {/* Tech Stack */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
                  <FaTools className="text-slate-450 text-xs" /> Tech Stack (comma separated)*
                </label>
                <input
                  type="text"
                  value={subStack}
                  onChange={(e) => setSubStack(e.target.value)}
                  placeholder="React, Node.js, MongoDB, Tailwind"
                  className="text-xs rounded-xl border border-slate-200 p-3 bg-slate-50 focus:ring-1 focus:ring-[#247d8b] focus:outline-none font-bold text-slate-800"
                />
                {subErrors.techStack && <p className="text-[10px] font-bold text-red-650 mt-1">{subErrors.techStack}</p>}
              </div>

              {/* Detailed Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
                  <FaClipboardList className="text-slate-450 text-xs" /> Detailed Description
                </label>
                <textarea
                  value={subDesc}
                  onChange={(e) => setSubDesc(e.target.value)}
                  placeholder="Explain the features, architecture, and installation guides..."
                  rows={4}
                  className="text-xs rounded-xl border border-slate-200 p-3 bg-slate-50 focus:ring-1 focus:ring-[#247d8b] focus:outline-none font-bold text-slate-800"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-5 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-5 py-2.5 text-xs font-black uppercase bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-all cursor-pointer select-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subLoading}
                  className="px-5 py-2.5 text-xs font-black uppercase bg-slate-950 hover:bg-[#247d8b] text-white rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 select-none"
                >
                  {activeSubmissionId ? 'Save Changes' : 'Upload Solution'}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default Submission;
