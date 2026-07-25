import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaTrophy, FaMedal, FaLock, FaAward, FaUsers, FaExclamationTriangle, FaBullhorn, FaRedo, FaCheck } from 'react-icons/fa';
import axios from 'axios';

const Leaderboard = () => {
  const { hackathonId } = useParams();
  const navigate = useNavigate();

  // State management
  const [leaderboard, setLeaderboard] = useState([]);
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // User auth state from localStorage
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch hackathon details and leaderboard data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Hackathon details
      try {
        const hackathonRes = await axios.get(`http://localhost:5099/api/hackathons/${hackathonId}`, { headers });
        if (hackathonRes.data?.success) {
          setHackathon(hackathonRes.data.hackathon);
        }
      } catch (err) {
        console.warn('Could not fetch hackathon details, proceeding with leaderboard.', err);
      }

      // 2. Fetch Leaderboard
      const leaderboardRes = await axios.get(`http://localhost:5099/api/leaderboard/${hackathonId}`, { headers });
      if (leaderboardRes.data?.success) {
        setLeaderboard(leaderboardRes.data.leaderboard || []);
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to fetch leaderboard data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hackathonId]);

  // Actions for Organizers / Admins
  const handleGenerateLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`http://localhost:5099/api/leaderboard/${hackathonId}/generate`, {}, { headers });
      if (res.data?.success) {
        alert('Leaderboard generated successfully!');
        fetchData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate leaderboard.';
      alert(msg);
      setError(msg);
      setLoading(false);
    }
  };

  const handlePublishResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.put(`http://localhost:5099/api/leaderboard/${hackathonId}/publish`, {}, { headers });
      if (res.data?.success) {
        alert('Results published and winners announced successfully!');
        fetchData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to publish results.';
      alert(msg);
      setError(msg);
      setLoading(false);
    }
  };

  // Check roles for Organizer/Admin control visibility
  const isOrganizerOrAdmin = user && (user.role === 'Organizer' || user.role === 'Admin');

  // Separating Podium and Table elements
  const podiumWinners = leaderboard.slice(0, 3);
  const remainingTeams = leaderboard.slice(3);

  // Re-order podium for classic display: [2nd, 1st, 3rd]
  const orderedPodium = [];
  if (podiumWinners[1]) orderedPodium.push(podiumWinners[1]); // 2nd Place
  if (podiumWinners[0]) orderedPodium.push(podiumWinners[0]); // 1st Place
  if (podiumWinners[2]) orderedPodium.push(podiumWinners[2]); // 3rd Place

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Back & Refresh Headers */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-indigo-600 font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer"
        >
          &larr; Back
        </button>
        <button
          onClick={fetchData}
          className="text-gray-500 hover:text-indigo-600 font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer"
          title="Refresh Data"
        >
          <FaRedo className="text-xs" /> Refresh
        </button>
      </div>

      {/* Hero Title Area */}
      <div className="text-center mb-12">
        <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
          Results Module
        </span>
        <h1 className="mt-3 text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
          {hackathon?.title || 'Hackathon'} Leaderboard
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500">
          Rankings are calculated based on the average scores of all completed judge evaluations.
        </p>
        {hackathon?.theme && (
          <p className="mt-1 text-sm text-gray-400">Theme: {hackathon.theme}</p>
        )}
      </div>

      {/* Organizer / Admin Admin Controls Panel */}
      {isOrganizerOrAdmin && (
        <div className="bg-white border border-indigo-100 shadow-sm rounded-xl p-6 mb-10">
          <h2 className="text-base font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <FaAward className="text-indigo-600" /> Organizer Console
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {leaderboard.length === 0 && !loading && (
              <button
                onClick={handleGenerateLeaderboard}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-sm transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <FaTrophy /> Generate Leaderboard
              </button>
            )}
            {leaderboard.length > 0 && !leaderboard[0]?.published && !loading && (
              <button
                onClick={handlePublishResults}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-sm transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <FaBullhorn /> Publish Results & Announce Winners
              </button>
            )}
            {leaderboard.length > 0 && leaderboard[0]?.published && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg p-3 text-sm font-medium flex items-center gap-2">
                <FaCheck className="text-emerald-600" /> Results are published. Winners are announced publicly.
              </div>
            )}
            {leaderboard.length > 0 && !leaderboard[0]?.published && (
              <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-lg p-3 text-sm font-medium flex items-center gap-2">
                <FaLock className="text-amber-600" /> Results are in draft mode and visible only to Organizer/Admin.
              </div>
            )}
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="space-y-6">
          {/* Skeleton podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mt-12 mb-8">
            <div className="bg-gray-100 rounded-2xl h-56 animate-pulse hidden md:block"></div>
            <div className="bg-gray-100 rounded-2xl h-64 animate-pulse"></div>
            <div className="bg-gray-100 rounded-2xl h-48 animate-pulse hidden md:block"></div>
          </div>
          {/* Skeleton table */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-pulse">
            <div className="h-14 bg-gray-50 border-b border-gray-100"></div>
            <div className="p-4 space-y-4">
              <div className="h-10 bg-gray-100 rounded-md"></div>
              <div className="h-10 bg-gray-100 rounded-md"></div>
              <div className="h-10 bg-gray-100 rounded-md"></div>
            </div>
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="bg-white border border-red-100 shadow-lg rounded-2xl p-8 max-w-xl mx-auto text-center my-12">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 text-red-600 mb-6">
            <FaExclamationTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Access Restrained</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            {isOrganizerOrAdmin && leaderboard.length === 0 && (
              <button
                onClick={handleGenerateLeaderboard}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-sm transition-all text-sm cursor-pointer"
              >
                Generate Leaderboard
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-5 rounded-lg transition-all text-sm cursor-pointer"
            >
              Go Home
            </button>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && leaderboard.length === 0 && (
        <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-12 max-w-xl mx-auto text-center my-12">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-indigo-50 text-indigo-600 mb-6">
            <FaTrophy className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Leaderboard Yet</h3>
          <p className="text-gray-500 mb-8">
            The leaderboard will become available as soon as evaluations are completed by the judges and generated by the organizers.
          </p>
          {isOrganizerOrAdmin ? (
            <button
              onClick={handleGenerateLeaderboard}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-sm transition-all text-sm cursor-pointer inline-flex items-center gap-2"
            >
              <FaTrophy /> Generate Leaderboard Now
            </button>
          ) : (
            <p className="text-sm text-gray-400 italic">Please check back later.</p>
          )}
        </div>
      )}

      {/* CONTENT PRESENT */}
      {!loading && !error && leaderboard.length > 0 && (
        <div>
          {/* PODIUM (TOP 3 VISUALIZATION) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mt-6 mb-12">
            {orderedPodium.map((winner, idx) => {
              // Styling constants based on positions
              const isGold = winner.position === '1st Place';
              const isSilver = winner.position === '2nd Place';
              const isBronze = winner.position === '3rd Place';

              let cardBg = 'bg-white border-gray-200';
              let ringColor = '';
              let medalIcon = '🥇';
              let badgeBg = 'bg-amber-100 text-amber-800 border border-amber-200';
              let height = 'h-64';

              if (isGold) {
                cardBg = 'bg-gradient-to-b from-amber-50 to-white border-amber-300 shadow-amber-100/50 shadow-lg';
                ringColor = 'ring-4 ring-amber-100';
                medalIcon = '🥇';
                badgeBg = 'bg-amber-500 text-white';
                height = 'h-72 md:scale-105 z-10';
              } else if (isSilver) {
                cardBg = 'bg-gradient-to-b from-slate-50 to-white border-slate-300 shadow-slate-100/50 shadow-md';
                ringColor = 'ring-4 ring-slate-100';
                medalIcon = '🥈';
                badgeBg = 'bg-slate-500 text-white';
                height = 'h-64';
              } else if (isBronze) {
                cardBg = 'bg-gradient-to-b from-orange-50 to-white border-orange-200 shadow-orange-100/50 shadow-md';
                ringColor = 'ring-4 ring-orange-100';
                medalIcon = '🥉';
                badgeBg = 'bg-orange-600 text-white';
                height = 'h-56';
              }

              return (
                <div
                  key={winner.rank}
                  className={`border rounded-2xl flex flex-col justify-between p-6 transition-all duration-300 hover:shadow-xl ${cardBg} ${height}`}
                >
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <span className={`inline-flex items-center justify-center text-3xl h-14 w-14 rounded-full ${ringColor} bg-white`}>
                        {medalIcon}
                      </span>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${badgeBg}`}>
                      {winner.position}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {winner.team}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium truncate mt-1">
                      {winner.project}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                    <span className="text-xs text-gray-400 font-semibold block uppercase">Average Score</span>
                    <span className="text-2xl font-black text-gray-900">{winner.score}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DETAILED LEADERBOARD TABLE */}
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FaUsers className="text-gray-500" /> Rankings Summary
              </h3>
              <span className="text-sm text-gray-500 font-medium">
                {leaderboard.length} {leaderboard.length === 1 ? 'Team' : 'Teams'} Registered
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                      Rank
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Team Name
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-center w-36">
                      Average Score
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-center w-36">
                      Award Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {leaderboard.map((item) => {
                    const isGold = item.rank === 1;
                    const isSilver = item.rank === 2;
                    const isBronze = item.rank === 3;

                    let rowStyle = 'hover:bg-gray-50/70 transition-colors';
                    let rankBadge = '';
                    let scoreBadgeStyle = 'text-gray-900 font-bold';

                    if (isGold) {
                      rowStyle = 'bg-amber-50/30 hover:bg-amber-50/50 transition-colors';
                      rankBadge = '🥇';
                      scoreBadgeStyle = 'text-amber-800 font-black';
                    } else if (isSilver) {
                      rowStyle = 'bg-slate-50/30 hover:bg-slate-50/50 transition-colors';
                      rankBadge = '🥈';
                      scoreBadgeStyle = 'text-slate-800 font-black';
                    } else if (isBronze) {
                      rowStyle = 'bg-orange-50/20 hover:bg-orange-50/40 transition-colors';
                      rankBadge = '🥉';
                      scoreBadgeStyle = 'text-orange-950 font-black';
                    }

                    return (
                      <tr key={item.rank} className={rowStyle}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          <div className="flex items-center gap-1.5 font-bold">
                            {rankBadge && <span className="text-lg">{rankBadge}</span>}
                            <span>{item.rank}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-950">
                          {item.team}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                          {item.project}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className={`text-base px-2.5 py-1 rounded-lg ${scoreBadgeStyle}`}>
                            {item.score}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          {item.position ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isGold ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              isSilver ? 'bg-slate-100 text-slate-800 border border-slate-200' :
                              'bg-orange-100 text-orange-850 border border-orange-200'
                            }`}>
                              {item.position}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs italic font-medium">Participant</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
