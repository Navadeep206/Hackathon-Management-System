import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaEnvelope, FaInfoCircle } from 'react-icons/fa';

const Footer = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        setUser(storedUser ? JSON.parse(storedUser) : null);
      } catch {
        setUser(null);
      }
    };
    fetchUser();
    window.addEventListener('storage', fetchUser);
    return () => window.removeEventListener('storage', fetchUser);
  }, []);

  return (
    <footer className="bg-white border-t border-slate-200 text-slate-500 text-xs py-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Col 1: Brand & Description */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm uppercase tracking-wider">
            <svg className="w-5 h-5 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="4.5" r="2" />
              <circle cx="17.3" cy="6.7" r="2" />
              <circle cx="19.5" cy="12" r="2" />
              <circle cx="17.3" cy="17.3" r="2" />
              <circle cx="12" cy="19.5" r="2" />
              <circle cx="6.7" cy="17.3" r="2" />
              <circle cx="4.5" cy="12" r="2" />
              <circle cx="6.7" cy="6.7" r="2" />
            </svg>
            <span>Circle</span>
          </div>
          <p className="text-slate-450 leading-relaxed font-medium">
            The ideal framework to coordinate hackathons, build squad prototypes, and run visual evaluations.
          </p>
        </div>

        {/* Col 2: Platform directories */}
        <div className="space-y-3 font-semibold">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Platform</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/" className="hover:text-slate-900 transition-colors">Home Page</Link>
            </li>
            {user && (
              <>
                <li>
                  <Link to="/hackathons" className="hover:text-slate-900 transition-colors">Active Hackathons</Link>
                </li>
                <li>
                  <Link to="/leaderboard" className="hover:text-slate-900 transition-colors">podium board</Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Col 3: Legal policies */}
        <div className="space-y-3 font-semibold">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Legal</h4>
          <ul className="space-y-2">
            <li>
              <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-slate-900 transition-colors">Privacy Policy</a>
            </li>
            <li>
              <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-slate-900 transition-colors">Terms of Service</a>
            </li>
          </ul>
        </div>

        {/* Col 4: Support / Social */}
        <div className="space-y-3 font-semibold">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Connect</h4>
          <ul className="space-y-2">
            <li>
              <a href="mailto:support@circle.example.com" className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">
                <FaEnvelope className="text-slate-400" /> Contact Support
              </a>
            </li>
            <li>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">
                <FaGithub className="text-slate-400" /> GitHub Repository
              </a>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 font-bold text-[10px] text-slate-400">
        <p>&copy; {new Date().getFullYear()} Circle Hackathon Hub. All rights reserved.</p>
        <p className="flex items-center gap-1">
          <FaInfoCircle /> Designed for prototype sprint operators and developers.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
