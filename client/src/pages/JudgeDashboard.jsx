import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  FaGavel,
  FaFolder,
  FaTasks,
  FaCheckCircle,
  FaAward,
  FaEdit,
  FaPlus,
  FaExternalLinkAlt,
  FaChevronRight,
  FaCheck,
  FaStar,
} from 'react-icons/fa';
import StatCard from '../components/dashboard/StatCard';
import DashboardCard from '../components/dashboard/DashboardCard';
import DashboardTable from '../components/dashboard/DashboardTable';
import QuickActionCard from '../components/dashboard/QuickActionCard';
import Modal from '../components/common/Modal';
import Loader, { SkeletonTable } from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { Toast } from '../components/common/ErrorMessage';

const JudgeDashboard = () => {
  const navigate = useNavigate();

  // Summary states
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Toast feedback
  const [toast, setToast] = useState(null);

  // Modal control states
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // --- REVIEW CRITERIA STATES ---
  const [innovation, setInnovation] = useState(5);
  const [technicalComplexity, setTechnicalComplexity] = useState(5);
  const [userInterface, setUserInterface] = useState(5);
  const [functionality, setFunctionality] = useState(5);
  const [scalability, setScalability] = useState(5);
  const [documentation, setDocumentation] = useState(5);
  const [presentation, setPresentation] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [reviewStatus, setReviewStatus] = useState('Pending');
  const [formErrors, setFormErrors] = useState({});
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/dashboard/judge');
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

  // Open evaluate modal and load existing review draft if present
  const handleOpenReview = async (project) => {
    setSelectedProject(project);
    setIsReviewOpen(true);
    setFormErrors({});

    if (project.reviewId) {
      try {
        const res = await api.get(`/reviews/submission/${project._id}`);
        if (res.data?.success && res.data.reviews?.length > 0) {
          const rev = res.data.reviews[0];
          setInnovation(rev.innovation ?? 5);
          setTechnicalComplexity(rev.technicalComplexity ?? 5);
          setUserInterface(rev.userInterface ?? 5);
          setFunctionality(rev.functionality ?? 5);
          setScalability(rev.scalability ?? 5);
          setDocumentation(rev.documentation ?? 5);
          setPresentation(rev.presentation ?? 5);
          setFeedback(rev.feedback || '');
          setReviewStatus(rev.status || 'Pending');
        }
      } catch (err) {
        console.error('Error fetching existing review draft:', err);
      }
    } else {
      // Default initial states
      setInnovation(5);
      setTechnicalComplexity(5);
      setUserInterface(5);
      setFunctionality(5);
      setScalability(5);
      setDocumentation(5);
      setPresentation(5);
      setFeedback('');
      setReviewStatus('Pending');
    }
  };

  const validateReview = () => {
    const errs = {};
    if (!feedback.trim()) {
      errs.feedback = 'Descriptive feedback is required for this evaluation';
    }

    const checkRange = (val, name) => {
      const num = Number(val);
      if (isNaN(num) || num < 0 || num > 10) {
        errs[name] = 'Score must be between 0 and 10';
      }
    };

    checkRange(innovation, 'innovation');
    checkRange(technicalComplexity, 'technicalComplexity');
    checkRange(userInterface, 'userInterface');
    checkRange(functionality, 'functionality');
    checkRange(scalability, 'scalability');
    checkRange(documentation, 'documentation');
    checkRange(presentation, 'presentation');

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!validateReview() || !selectedProject) return;

    setReviewSubmitting(true);
    const payload = {
      submissionId: selectedProject._id,
      innovation: Number(innovation),
      technicalComplexity: Number(technicalComplexity),
      userInterface: Number(userInterface),
      functionality: Number(functionality),
      scalability: Number(scalability),
      documentation: Number(documentation),
      presentation: Number(presentation),
      feedback: feedback.trim(),
      status: reviewStatus,
    };

    try {
      let res;
      if (selectedProject.reviewId) {
        res = await api.put(`/reviews/${selectedProject.reviewId}`, payload);
      } else {
        res = await api.post('/reviews', payload);
      }

      if (res.data?.success) {
        setToast({
          type: 'success',
          message: `Evaluation scorecard saved successfully as ${
            reviewStatus === 'Completed' ? 'Final' : 'Draft'
          }!`,
        });
        setIsReviewOpen(false);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to submit project evaluation.' });
    } finally {
      setReviewSubmitting(false);
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

  const { stats, assignedProjectsList } = data || {};

  // Find the first pending/unreviewed project to evaluate
  const firstUnreviewed = assignedProjectsList?.find(
    (p) => p.status === 'Not Started' || p.status === 'Pending'
  );

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
            onClick={() => {
              if (firstUnreviewed) {
                handleOpenReview(firstUnreviewed);
              } else {
                setToast({ type: 'success', message: 'You have evaluated all assigned projects!' });
              }
            }}
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
                  project.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-105 text-gray-600'
                }`}>
                  {project.status === 'Pending' ? 'Draft' : project.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-extrabold">
                {project.score !== null ? project.score : <span className="text-gray-300 font-normal">-</span>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {project.status === 'Completed' ? (
                  <span className="text-green-600 font-semibold text-xs flex items-center gap-1">
                    <FaCheck className="text-[10px]" /> Finished
                  </span>
                ) : (
                  <button
                    onClick={() => handleOpenReview(project)}
                    className="text-indigo-650 hover:underline font-bold text-xs cursor-pointer flex items-center gap-1"
                  >
                    Evaluate &rarr;
                  </button>
                )}
              </td>
            </tr>
          )}
        />
      </DashboardCard>

      {/* ========================================================================= */}
      {/* EVALUATION MODAL                                                          */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title={`Evaluate: "${selectedProject?.projectName || 'Project'}"`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4 text-left">
          {/* Subheading details */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 text-xs text-gray-600 font-semibold space-y-0.5">
            <p><span className="font-bold text-gray-800">Team Name:</span> {selectedProject?.teamName}</p>
            <p><span className="font-bold text-gray-800">Campaign:</span> {selectedProject?.hackathonTitle}</p>
          </div>

          {/* Criteria Sliders (0 - 10) */}
          <div className="space-y-3.5 pt-2 max-h-[40vh] overflow-y-auto pr-1">
            {[
              { label: 'Innovation & Novelty', value: innovation, setter: setInnovation, name: 'innovation' },
              { label: 'Technical Complexity', value: technicalComplexity, setter: setTechnicalComplexity, name: 'technicalComplexity' },
              { label: 'User Interface / Usability', value: userInterface, setter: setUserInterface, name: 'userInterface' },
              { label: 'Functionality & Performance', value: functionality, setter: setFunctionality, name: 'functionality' },
              { label: 'Scalability / Architecture', value: scalability, setter: setScalability, name: 'scalability' },
              { label: 'Documentation / Structure', value: documentation, setter: setDocumentation, name: 'documentation' },
              { label: 'Pitch Presentation', value: presentation, setter: setPresentation, name: 'presentation' },
            ].map((c) => (
              <div key={c.name} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-700">{c.label}</span>
                  <span className="bg-indigo-50 text-indigo-750 px-2 py-0.5 rounded-lg border border-indigo-100 font-bold font-mono">
                    {c.value}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={c.value}
                  onChange={(e) => c.setter(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                />
              </div>
            ))}
          </div>

          {/* Feedback Description */}
          <div className="flex flex-col gap-1.5 pt-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Constructive Feedback*</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What did you like? What can be improved? Elaborate on architectural or tech aspects..."
              rows={3}
              className={`text-sm rounded-lg border p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium ${
                formErrors.feedback ? 'border-red-300 bg-red-50/20' : 'border-gray-200'
              }`}
            />
            {formErrors.feedback && (
              <p className="text-[10px] font-bold text-red-650">{formErrors.feedback}</p>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Evaluation Status</label>
            <select
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value)}
              className="text-sm rounded-lg border border-gray-200 p-2.5 bg-gray-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium cursor-pointer"
            >
              <option value="Pending">Draft Scorecard (Pending)</option>
              <option value="Completed">Final Submission (Lock Scores)</option>
            </select>
            <p className="text-[10px] text-gray-400 font-semibold leading-normal">
              Selecting "Final Submission" locks the scorecard. You won't be able to change scores after submitting.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-gray-150 flex gap-3 justify-end mt-4">
            <button
              type="button"
              onClick={() => setIsReviewOpen(false)}
              className="px-4 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-550 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reviewSubmitting}
              className="px-4 py-2 text-xs font-bold bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              {reviewSubmitting ? (
                <div className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <FaStar /> Save Review
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default JudgeDashboard;
