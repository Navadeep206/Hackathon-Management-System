import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaEnvelope, FaShieldAlt, FaIdCard, FaArrowLeft, FaKey } from 'react-icons/fa';

const Profile = () => {
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#edf3f6]">
        <p className="text-sm font-bold text-red-650">No active user session found. Please log in.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edf3f6] text-slate-950 font-sans py-12">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        
        {/* Back Link */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-black text-[#247d8b] hover:text-[#13444e] transition-colors uppercase tracking-wider cursor-pointer"
          >
            <FaArrowLeft /> Go Back
          </button>
        </div>

        {/* Profile Card Container */}
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-lg p-8 sm:p-10 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col items-center justify-center text-center space-y-4 border-b border-slate-100 pb-8">
            <div className="w-20 h-20 rounded-full bg-slate-950/5 border border-slate-200 flex items-center justify-center text-slate-400">
              <FaUserCircle className="w-16 h-16" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{user.name}</h2>
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                {user.role} Workspace
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-5 text-sm font-medium">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-display mb-2">Account Specifications</h3>

            {/* Email */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-150 p-4 rounded-2xl">
              <FaEnvelope className="text-slate-400 shrink-0 text-base" />
              <div>
                <span className="text-[9px] font-black uppercase text-slate-450 block tracking-wider">Email Address</span>
                <span className="text-xs font-bold text-slate-800">{user.email}</span>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-150 p-4 rounded-2xl">
              <FaShieldAlt className="text-slate-400 shrink-0 text-base" />
              <div>
                <span className="text-[9px] font-black uppercase text-slate-450 block tracking-wider">System Role Privilege</span>
                <span className="text-xs font-bold text-slate-800">{user.role}</span>
              </div>
            </div>

            {/* ID */}
            {user.id && (
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                <FaIdCard className="text-slate-400 shrink-0 text-base" />
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-450 block tracking-wider">Account identifier</span>
                  <span className="text-xs font-mono text-slate-800 select-all font-bold">{user.id}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 text-center">
            <FaKey className="text-slate-350" />
            <span>Account sessions are encrypted and managed via JSON Web Token security standards.</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
