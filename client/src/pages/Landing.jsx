import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import EmptyState from '../components/common/EmptyState';
import {
  FaArrowRight,
  FaCalendarAlt,
  FaTrophy,
  FaUserFriends,
  FaCode,
  FaUsers,
  FaLock,
  FaAward,
  FaChartLine,
  FaClipboardList,
  FaQuoteLeft,
  FaRocket,
  FaCheckCircle,
} from 'react-icons/fa';

const Landing = () => {
  const navigate = useNavigate();

  // Authentication status
  const [user] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Featured hackathons state
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/hackathons', { params: { limit: 3 } });
        if (res.data?.success) {
          setFeatured(res.data.hackathons.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch featured hackathons:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleCTA = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const platformHighlights = [
    {
      icon: FaUsers,
      title: 'Team Collaboration',
      text: 'Form squads, distribute roles, share codes, and manage your team invites via a dedicated, secure roster workspace.',
    },
    {
      icon: FaClipboardList,
      title: 'Online Registration',
      text: 'Submit participant logs, select format modes, and register for active events instantly with organizer reviews.',
    },
    {
      icon: FaLock,
      title: 'Secure Authentication',
      text: 'Token-based session authentication that keeps developer accounts, portfolios, and evaluation rubrics secured.',
    },
    {
      icon: FaAward,
      title: 'Judge Evaluation',
      text: 'Review project stack specs, view demo links, and submit score cards using custom judging criteria matrices.',
    },
    {
      icon: FaChartLine,
      title: 'Live Leaderboard',
      text: 'Calculate rank listings in real-time. Publish podium standings and award project badges dynamically.',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Sign Up',
      desc: 'Create your developer profile, choose your role, and set up your skills portfolio.',
    },
    {
      step: '02',
      title: 'Join Hackathon',
      desc: 'Browse open campaigns, review challenge rules, and submit enrollment requests.',
    },
    {
      step: '03',
      title: 'Build with Team',
      desc: 'Assemble your dream roster, collaborate securely, and organize tasks.',
    },
    {
      step: '04',
      title: 'Submit Project',
      desc: 'Upload code repositories, input tech stacks, and add product video demos.',
    },
    {
      step: '05',
      title: 'Judges Evaluate',
      desc: 'Assigned expert panels grade submissions across multiple score dimensions.',
    },
    {
      step: '06',
      title: 'Winners Announced',
      desc: 'Results sync live to the podium scoreboard with custom prize payouts.',
    },
  ];

  const testimonials = [
    {
      quote: "I joined the Summer Code Sprint and found my team within hours. The workspace dashboard was super smooth and tracking submissions was a breeze!",
      author: "Sarah Jenkins",
      role: "Full-Stack Developer",
      avatarBg: "bg-indigo-100 text-indigo-700",
    },
    {
      quote: "We ran a 500-dev event on this platform. The automated judging rubrics and live leaderboards saved us days of manual grading. Highly recommend!",
      author: "Marcus Chen",
      role: "Tech Innovation Lead",
      avatarBg: "bg-emerald-100 text-emerald-700",
    },
    {
      quote: "The project submission cards and inline demo videos made it incredibly easy to score entries quickly. The grading matrix was highly structured.",
      author: "Dr. Aris Thorne",
      role: "Hackathon Judge & Researcher",
      avatarBg: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <div className="min-h-screen bg-[#edf3f6] text-slate-950 font-sans pb-16">
      
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-24">
        
        {/* Section 1: Hero Section Mockup Frame */}
        <section className="relative overflow-hidden rounded-[2.5rem] sm:rounded-[3.2rem] border-3 border-[#0b1b1e] bg-gradient-to-br from-[#13444e] via-[#247d8b] to-[#f4c3ab] shadow-2xl flex flex-col justify-between min-h-[640px] md:min-h-[700px] transition-all">
          <div className="absolute inset-0 hero-grid opacity-15 pointer-events-none" />
          
          <div className="relative z-10 w-full px-6 sm:px-10 lg:px-12 pt-12 md:pt-16 pb-20 flex-grow grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            
            {/* Left copy text */}
            <div className="flex flex-col text-white max-w-xl">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-4 py-1 text-xs font-black uppercase text-white shadow-sm">
                  <FaRocket className="text-[#f5cbb6] text-xs" />
                  SaaS Hackathon Platform
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1 text-xs font-black uppercase text-emerald-300 shadow-sm">
                  <FaCheckCircle className="text-emerald-400 text-xs" />
                  v1.0 Live
                </span>
              </div>

              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.04] tracking-tight text-white">
                Your next big idea starts here
              </h1>
              <p className="mt-5 text-sm sm:text-base leading-relaxed text-white/90 font-medium">
                Circle is the ultimate framework to manage all aspects of hackathons, teams, and projects. Form squads, deploy submission guidelines, judge entries, and publish podium leaderboards.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={handleCTA}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f5cbb6] hover:bg-[#e8b59e] px-8 py-3.5 text-xs font-black text-[#13444e] shadow-lg shadow-black/10 tracking-widest uppercase transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  Get Started <FaArrowRight />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (user) {
                      navigate('/hackathons');
                    } else {
                      navigate('/login');
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 px-8 py-3.5 text-xs font-black text-white shadow-lg tracking-widest uppercase transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  Explore Hackathons
                </button>
              </div>

              {/* Sponsor Logos */}
              <div className="mt-14 pt-8 border-t border-white/15">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-white/70 select-none">
                  <div className="flex items-center font-bold tracking-tight text-sm">
                    <span className="text-base font-black mr-1 flex items-center justify-center border border-white/40 rounded-sm w-4 h-4 text-xs font-sans">⇿</span> 
                    <span>TransferWise</span>
                  </div>
                  <div className="font-extrabold tracking-widest text-xs uppercase">
                    Woo Commerce
                  </div>
                  <div className="flex items-center font-black tracking-tight text-sm italic">
                    <span className="font-black text-indigo-300">Pay</span>Pal
                  </div>
                  <div className="flex items-center font-semibold text-sm">
                    Pay<span className="w-2.5 h-2.5 rounded-full bg-white border border-[#13444e] mx-0.5 inline-block"></span>neer
                  </div>
                </div>
              </div>
            </div>

            {/* Right vector illustration */}
            <div className="relative w-full flex justify-center">
              <svg viewBox="0 0 500 400" className="w-full h-auto max-w-[430px] select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Orbit */}
                <g className="float-orbit">
                  <circle cx="80" cy="90" r="16" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3"/>
                  <circle cx="80" cy="90" r="3" fill="#f4c3ab"/>
                  <line x1="80" y1="90" x2="105" y2="70" stroke="#102c30" strokeWidth="1.2"/>
                  <circle cx="105" cy="70" r="6" fill="#13444e" stroke="#102c30" strokeWidth="1.2"/>
                  <circle cx="65" cy="110" r="8" fill="#ffffff" stroke="#102c30" strokeWidth="1.2"/>
                </g>
                
                {/* Airplane */}
                <g className="float-airplane">
                  <path d="M410,120 L445,95 L430,135 L422,128 Z" fill="#ffffff" stroke="#102c30" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M410,120 L430,135 L445,95" stroke="#102c30" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M422,128 L422,136 L426,132" fill="#f4c3ab" stroke="#102c30" strokeWidth="1.5" strokeLinejoin="round"/>
                </g>
                
                {/* Floor */}
                <line x1="50" y1="340" x2="450" y2="340" stroke="#102c30" strokeWidth="2" strokeLinecap="round"/>
                
                {/* Table */}
                <path d="M140,260 L140,340" stroke="#102c30" strokeWidth="2"/>
                <path d="M110,260 L170,260" stroke="#102c30" strokeWidth="2" strokeLinecap="round"/>
                <path d="M130,260 L130,248 C130,246 132,244 135,244 L145,244 C148,244 150,246 150,248 L150,260 Z" fill="#ffffff" stroke="#102c30" strokeWidth="1.5"/>
                <path d="M150,248 C153,248 155,250 155,252 C155,254 153,256 150,256" stroke="#102c30" strokeWidth="1.5"/>
                
                {/* Plants */}
                <g transform="translate(80, 270)">
                  <path d="M20,70 L40,70 L45,45 L15,45 Z" fill="#ffffff" stroke="#102c30" strokeWidth="1.7"/>
                  <path d="M18,45 Q10,20 16,5 Q24,25 22,45" fill="#f4c3ab" stroke="#102c30" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M26,45 Q36,10 32,-8 Q30,12 28,45" fill="#ffffff" stroke="#102c30" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M34,45 Q44,22 41,10 Q37,25 35,45" fill="#13444e" stroke="#102c30" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M22,45 Q26,30 25,20" stroke="#102c30" strokeWidth="1"/>
                  <path d="M30,45 Q31,25 29,15" stroke="#102c30" strokeWidth="1"/>
                </g>
                <g transform="translate(370, 240)">
                  <path d="M20,100 L30,100 L33,70 C33,65 29,60 25,60 C21,60 17,65 17,70 Z" fill="#ffffff" stroke="#102c30" strokeWidth="1.7"/>
                  <line x1="25" y1="60" x2="25" y2="100" stroke="#102c30" strokeWidth="1.5"/>
                  <path d="M25,60 C23,45 10,35 5,30" stroke="#102c30" strokeWidth="1.5"/>
                  <path d="M25,60 C25,40 35,30 45,25" stroke="#102c30" strokeWidth="1.5"/>
                  <path d="M25,60 Q25,35 20,20" stroke="#102c30" strokeWidth="1.5"/>
                  <circle cx="5" cy="30" r="3.5" fill="#f4c3ab" stroke="#102c30" strokeWidth="1"/>
                  <circle cx="45" cy="25" r="3.5" fill="#f4c3ab" stroke="#102c30" strokeWidth="1"/>
                  <circle cx="20" cy="20" r="3.5" fill="#ffffff" stroke="#102c30" strokeWidth="1"/>
                </g>
                
                {/* Chair */}
                <path d="M290,340 L290,290 L260,265 M290,340 L320,340 M290,340 L260,340" stroke="#102c30" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M230,225 C230,265 255,275 295,270 C310,268 322,250 322,230 L328,190 C328,175 315,165 300,165 L260,165 C240,165 230,180 230,205 Z" fill="#ffffff" stroke="#102c30" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M245,225 C245,215 270,215 285,215 C295,215 295,228 290,240" fill="none" stroke="#102c30" strokeWidth="2"/>

                {/* Character */}
                <path d="M275,268 L240,268 L235,325" stroke="#102c30" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M275,268 L240,268 L235,325" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M228,325 C222,325 218,328 220,332 L240,332 C242,332 242,325 238,325 Z" fill="#ffffff" stroke="#102c30" strokeWidth="1.8"/>
                <path d="M285,190 L275,268" stroke="#102c30" strokeWidth="10" strokeLinecap="round"/>
                <path d="M285,190 L275,268" stroke="#f4c3ab" strokeWidth="7" strokeLinecap="round"/>
                <line x1="280" y1="200" x2="274" y2="255" stroke="#102c30" strokeWidth="1.5"/>
                
                {/* Laptop */}
                <path d="M165,225 L215,225" stroke="#102c30" strokeWidth="3" strokeLinecap="round"/>
                <path d="M165,225 L158,190 C157,185 160,182 165,182 L200,182" fill="none" stroke="#102c30" strokeWidth="2"/>
                <path d="M167,222 L161,192 C160,187 163,185 167,185 L195,185" fill="#ffffff"/>
                <path d="M275,200 C240,205 220,210 205,215" fill="none" stroke="#102c30" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M205,215 Q195,215 190,222" stroke="#102c30" strokeWidth="2" strokeLinecap="round"/>
                
                {/* Head */}
                <path d="M288,190 L288,175" stroke="#102c30" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M288,175 C288,170 282,150 295,145 C300,143 304,148 304,152 C304,165 298,175 288,175 Z" fill="#ffffff" stroke="#102c30" strokeWidth="1.8" strokeLinejoin="round"/>
                <circle cx="295" cy="155" r="1" fill="#102c30"/>
                <path d="M292,162 C294,164 296,164 297,162" stroke="#102c30" strokeWidth="1" fill="none"/>
                <path d="M298,144 C304,144 308,149 308,154 C308,157 302,159 300,157 C296,155 292,150 292,146 C292,143 294,144 298,144 Z" fill="#102c30"/>
              </svg>
            </div>
          </div>

          {/* Stats bar panel */}
          <div className="relative z-10 w-full bg-white text-[#13444e] rounded-t-[2.2rem] sm:rounded-t-[2.8rem] px-6 py-8 sm:py-9 border-t border-slate-100 flex flex-col md:flex-row items-center justify-around gap-6 select-none shadow-[0_-15px_35px_rgba(11,27,30,0.04)]">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="w-3 h-3 rounded-full border-2 border-[#13444e] mb-2 block bg-white opacity-85"></span>
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#13444e] font-display">.200+</span>
              <span className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">Events Launched</span>
            </div>
            <div className="hidden md:block w-px h-12 bg-slate-100" />
            <div className="flex flex-col items-center justify-center text-center">
              <span className="w-3 h-3 rounded-full border-2 border-[#13444e] mb-2 block bg-white opacity-85"></span>
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#13444e] font-display">.150+</span>
              <span className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">Solutions Devised</span>
            </div>
            <div className="hidden md:block w-px h-12 bg-slate-100" />
            <div className="flex flex-col items-center justify-center text-center">
              <span className="w-3 h-3 rounded-full border-2 border-[#13444e] mb-2 block bg-white opacity-85"></span>
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#13444e] font-display">.10k+</span>
              <span className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">Developers Engaged</span>
            </div>
          </div>
        </section>

        {/* Section 2: Why Choose This Platform */}
        <section id="platform-highlights" className="space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest select-none">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
              Why Choose Our Platform?
            </h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              We provide the underlying workspace engine to host hackathons at scale, supporting team forming, submissions, and scoring rubrics.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {platformHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-lg shadow-slate-200/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#247d8b]"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-[#f5cbb6] shadow-lg group-hover:-rotate-3 group-hover:scale-105 transition-all">
                    <Icon className="text-base" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900 tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-slate-500">{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Featured Hackathons */}
        <section className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="bg-emerald-50 border border-emerald-150 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest select-none">
                Live Challenges
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
                Featured Hackathons
              </h2>
              <p className="text-slate-500 text-sm font-medium max-w-xl">
                Ready to build? Enroll in these hot campaigns and test your prototype skills.
              </p>
            </div>
            <button
              onClick={() => {
                if (user) {
                  navigate('/hackathons');
                } else {
                  navigate('/login');
                }
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 text-white hover:bg-[#247d8b] px-6 py-3 text-xs font-black uppercase tracking-widest transition-all cursor-pointer select-none"
            >
              All Events <FaArrowRight />
            </button>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white border border-slate-200 rounded-3xl h-80 animate-pulse" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <EmptyState
              icon={FaCalendarAlt}
              title="No Hackathons Found"
              message="No hackathons are currently listed. Please check back later."
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {featured.map((h) => (
                <div
                  key={h._id}
                  onClick={() => {
                    if (user) {
                      navigate(`/hackathons/${h._id}`);
                    } else {
                      navigate('/login');
                    }
                  }}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-[#247d8b]"
                >
                  {/* Image banner */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    {h.bannerImage ? (
                      <img
                        src={`http://127.0.0.1:5099${h.bannerImage}`}
                        alt={h.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="relative h-full w-full bg-gradient-to-br from-[#13444e] to-[#247d8b] flex items-center justify-center p-5 text-white">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 border border-white/20 text-white shadow-xl">
                          <FaCode className="text-xs" />
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />
                    
                    {/* Status Badge */}
                    <span
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[9px] font-black shadow-md uppercase tracking-wider text-white ${
                        h.status === 'Registration Open'
                          ? 'bg-emerald-600'
                          : h.status === 'Completed'
                          ? 'bg-gray-750'
                          : 'bg-cyan-700'
                      }`}
                    >
                      {h.status}
                    </span>
                  </div>

                  {/* Content details */}
                  <div className="p-6 space-y-4">
                    <div>
                      <span className="text-[10px] font-black text-[#247d8b] uppercase tracking-widest block">
                        {h.theme}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 mt-1 line-clamp-1 tracking-tight group-hover:text-[#247d8b] transition-colors">
                        {h.title}
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <FaTrophy className="text-amber-500" />
                        <span>Pool: <strong className="text-slate-800">${h.prizePool?.toLocaleString()}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaCalendarAlt />
                        <span>{new Date(h.registrationDeadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 4: How It Works */}
        <section className="space-y-12 bg-white border border-slate-200 rounded-[2.5rem] p-8 sm:p-12 shadow-sm">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="bg-[#f5cbb6]/30 text-[#13444e] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest select-none">
              Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
              How It Works
            </h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Step-by-step roadmap to navigate hackathons from signup to podium results.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 relative">
            {workflowSteps.map((item, index) => (
              <div key={item.title} className="relative space-y-3">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-black text-[#247d8b] opacity-25 font-display">{item.step}</span>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">{item.title}</h3>
                </div>
                <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-500">{item.desc}</p>
                {index < 5 && (
                  <div className="hidden lg:block absolute -right-4 top-2 text-slate-200 font-bold select-none text-sm font-display">➔</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Platform Statistics */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
              Platform Growth In Numbers
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              We continue to scale and invite thousands of builders to solve problems.
            </p>
          </div>

          <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Total Hackathons', value: '45+', color: 'text-indigo-650 bg-indigo-50 border-indigo-100' },
              { title: 'Active Participants', value: '12,000+', color: 'text-emerald-650 bg-emerald-50 border-emerald-100' },
              { title: 'Teams Assembled', value: '1,500+', color: 'text-cyan-650 bg-cyan-50 border-cyan-100' },
              { title: 'Winners Podiums', value: '120+', color: 'text-amber-600 bg-amber-50 border-amber-100' },
            ].map((stat) => (
              <div
                key={stat.title}
                className={`rounded-3xl border p-6 flex flex-col items-center justify-center text-center shadow-sm bg-white ${stat.color.split(' ')[2]}`}
              >
                <span className={`text-3xl sm:text-4xl font-black tracking-tight font-display ${stat.color.split(' ')[0]}`}>
                  {stat.value}
                </span>
                <span className="text-[10px] font-black uppercase text-slate-400 mt-2 tracking-wider">
                  {stat.title}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6: Testimonials */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="bg-amber-50 border border-amber-150 text-amber-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest select-none">
              Stories
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
              What Our Builders Say
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.author}
                className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm relative group hover:border-[#247d8b] transition-colors"
              >
                <FaQuoteLeft className="text-slate-200 text-3xl absolute top-6 right-6 opacity-60" />
                <div className="space-y-4 relative z-10">
                  <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-600">
                    "{t.quote}"
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-3 border-t border-slate-100 pt-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${t.avatarBg}`}>
                    {t.author[0]}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-950">{t.author}</h4>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 7: Call To Action (CTA) */}
        <section className="relative overflow-hidden rounded-[2rem] bg-[#0b1220] p-8 sm:p-12 text-center text-white border border-white/10 shadow-2xl">
          <div className="absolute inset-0 hero-grid opacity-20 pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-[#f5cbb6]">
              Launch Your Next Prototype Today
            </h2>
            <p className="text-slate-350 text-sm font-medium leading-relaxed">
              Sign up today, form your squad, select your challenges, submit project codes, and present winners through our clean visual cockpit dashboard.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={handleCTA}
                className="bg-[#f5cbb6] hover:bg-[#e8b59e] text-[#13444e] font-black px-8 py-3.5 rounded-full text-xs shadow-lg uppercase tracking-widest transition-all cursor-pointer"
              >
                Sign Up Now
              </button>
              <button
                onClick={() => {
                  if (user) {
                    navigate('/hackathons');
                  } else {
                    navigate('/login');
                  }
                }}
                className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-black px-8 py-3.5 rounded-full text-xs shadow-lg uppercase tracking-widest transition-all cursor-pointer"
              >
                Browse Hackathons
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Landing;
