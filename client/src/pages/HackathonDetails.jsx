import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  FaCalendarAlt,
  FaCode,
  FaTrophy,
  FaUserFriends,
  FaArrowLeft,
  FaLaptopCode,
  FaMedal,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import Loader from '../components/common/Loader';
import { Toast } from '../components/common/ErrorMessage';

const HackathonDetails = () => {
  const { id } = useParams();
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

  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchHackathonDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/hackathons/${id}`);
        if (res.data?.success) {
          setHackathon(res.data.hackathon);
        } else {
          setError('Failed to load details.');
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Could not fetch hackathon details.');
      } finally {
        setLoading(false);
      }
    };

    fetchHackathonDetails();
  }, [id]);

  const handleRegister = async () => {
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
      const res = await api.post(`/registrations/${id}`);
      if (res.data?.success) {
        setToast({
          type: 'success',
          message: `Successfully registered for "${hackathon.title}"! Approval pending.`,
        });
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to submit registration request.';
      setToast({ type: 'error', message: msg });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#edf3f6]">
        <Loader />
      </div>
    );
  }

  if (error || !hackathon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#edf3f6] py-12 px-4">
        <div className="max-w-md w-full text-center space-y-4 bg-white border border-slate-200 p-8 rounded-3xl shadow-lg">
          <p className="text-sm font-bold text-red-650">{error || 'Hackathon details not found.'}</p>
          <button
            onClick={() => navigate('/hackathons')}
            className="inline-flex items-center gap-2 text-xs font-black text-indigo-650 hover:underline uppercase tracking-wider cursor-pointer"
          >
            <FaArrowLeft /> Back to Listings
          </button>
        </div>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Back link */}
        <div>
          <button
            onClick={() => navigate('/hackathons')}
            className="inline-flex items-center gap-2 text-xs font-black text-[#247d8b] hover:text-[#13444e] transition-colors uppercase tracking-wider cursor-pointer select-none"
          >
            <FaArrowLeft /> Back to active listings
          </button>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Details Main Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
              
              {/* Banner Area */}
              <div className="relative h-64 sm:h-80 bg-slate-100">
                {hackathon.bannerImage ? (
                  <img
                    src={`http://127.0.0.1:5099${hackathon.bannerImage}`}
                    alt={hackathon.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#13444e] to-[#247d8b] flex items-center justify-center p-5 text-white">
                    <FaLaptopCode className="text-6xl text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
                
                {/* Title Overlay */}
                <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                  <span className="bg-[#f5cbb6] text-[#13444e] text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-wider">
                    {hackathon.theme}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                    {hackathon.title}
                  </h1>
                </div>
              </div>

              {/* Description Content */}
              <div className="p-8 space-y-6">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">About the challenge</h3>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-slate-650 whitespace-pre-line">
                    {hackathon.description || 'No detailed description provided for this hackathon.'}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-display">Challenge Requirements</h3>
                  <ul className="grid gap-3 sm:grid-cols-2 text-xs font-medium text-slate-500 list-disc pl-4 leading-relaxed">
                    <li>Submit fully functioning web prototypes or applications.</li>
                    <li>Roster team size must not exceed the limit.</li>
                    <li>Code repository source link must be public (e.g. GitHub).</li>
                    <li>Submit before the deadline. Late reviews are locked.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary Panel / Action sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight pb-3 border-b border-slate-100">
                Event Specifications
              </h2>

              <div className="space-y-4">
                
                {/* Prize Pool */}
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-500 border border-amber-100">
                    <FaTrophy className="text-sm" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Grand Prize Pool</span>
                    <span className="text-sm font-black text-slate-800">${hackathon.prizePool?.toLocaleString()} USD</span>
                  </div>
                </div>

                {/* Team Limit */}
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <FaUserFriends className="text-sm" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Team Size Limit</span>
                    <span className="text-sm font-black text-slate-800">Max {hackathon.maxTeamSize} Members</span>
                  </div>
                </div>

                {/* Registration Deadline */}
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-500 border border-rose-100">
                    <FaCalendarAlt className="text-sm" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Enrollment Deadline</span>
                    <span className="text-sm font-black text-slate-800">{new Date(hackathon.registrationDeadline).toLocaleString()}</span>
                  </div>
                </div>

                {/* Location / Format Mode */}
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <FaMapMarkerAlt className="text-sm" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Location Format</span>
                    <span className="text-sm font-black text-slate-800">{hackathon.mode} Challenge</span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
                    <FaCode className="text-sm" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Status</span>
                    <span className="text-sm font-black text-slate-800 capitalize">{hackathon.status}</span>
                  </div>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-4 border-t border-slate-100">
                {hackathon.status === 'Completed' ? (
                  <button
                    onClick={() => navigate(`/leaderboard/${hackathon._id}`)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-4 rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-widest"
                  >
                    <FaMedal className="text-xs" /> View Leaderboard
                  </button>
                ) : hackathon.status === 'Registration Open' ? (
                  <button
                    onClick={handleRegister}
                    className="w-full bg-slate-950 hover:bg-[#247d8b] text-white font-black py-3.5 px-4 rounded-xl text-xs shadow-md transition-all cursor-pointer uppercase tracking-widest"
                  >
                    Enroll In Challenge
                  </button>
                ) : (
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                    Enrollment Closed
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HackathonDetails;
