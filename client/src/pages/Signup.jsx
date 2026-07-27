import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { FaUser, FaEnvelope, FaLock, FaUserTag, FaUserPlus } from 'react-icons/fa';
import { Toast } from '../components/common/ErrorMessage';

const Signup = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Participant');

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const validate = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long';
      }
      // Simple strength checks
      const hasNumbers = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      if (!hasNumbers || !hasSpecial) {
        newErrors.password = 'Password should contain at least 1 number and 1 special character';
      }
    }

    if (!role) {
      newErrors.role = 'Please select a profile role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: name.trim(),
        email,
        password,
        role,
      });

      if (res.data?.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        setToast({ type: 'success', message: 'Registration successful! Redirecting...' });

        setTimeout(() => {
          if (role === 'Admin') navigate('/admin/dashboard');
          else if (role === 'Organizer') navigate('/organizer/dashboard');
          else if (role === 'Participant') navigate('/participant/dashboard');
          else if (role === 'Judge') navigate('/judge/dashboard');
          else navigate('/');

          window.dispatchEvent(new Event('storage'));
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Registration failed. Email may already be in use.';
      setToast({ type: 'error', message: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-md w-full space-y-8 bg-white border border-gray-150 p-8 sm:p-10 rounded-2xl shadow-xl">
        <div className="text-center">
          <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            Register
          </span>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900 tracking-tight">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-semibold">
            Join the platform as a participant, organizer, or judge
          </p>
        </div>

        <form className="mt-8 space-y-6 animate-in fade-in duration-300" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Full Name field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="full-name" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FaUser className="h-4 w-4" />
                </div>
                <input
                  id="full-name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium bg-gray-50 transition-all ${
                    errors.name ? 'border-red-300 bg-red-50/20' : 'border-gray-200'
                  }`}
                  placeholder="John Doe"
                />
              </div>
              {errors.name && (
                <p className="text-xs font-semibold text-red-650 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email-address" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FaEnvelope className="h-4 w-4" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium bg-gray-50 transition-all ${
                    errors.email ? 'border-red-300 bg-red-50/20' : 'border-gray-200'
                  }`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-xs font-semibold text-red-655 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Role dropdown field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="role-select" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Select Your Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FaUserTag className="h-4 w-4" />
                </div>
                <select
                  id="role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium bg-gray-50 transition-all ${
                    errors.role ? 'border-red-300 bg-red-50/20' : 'border-gray-200'
                  }`}
                >
                  <option value="Participant">Participant</option>
                  <option value="Organizer">Organizer</option>
                  <option value="Judge">Judge</option>
                </select>
              </div>
              {errors.role && (
                <p className="text-xs font-semibold text-red-655 mt-1">{errors.role}</p>
              )}
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password-input" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FaLock className="h-4 w-4" />
                </div>
                <input
                  id="password-input"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium bg-gray-50 transition-all ${
                    errors.password ? 'border-red-300 bg-red-50/20' : 'border-gray-200'
                  }`}
                  placeholder="Minimum 8 characters"
                />
              </div>
              {errors.password && (
                <p className="text-xs font-semibold text-red-650 mt-1 leading-normal">{errors.password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white shadow-sm shadow-indigo-150 transition-all cursor-pointer ${
                loading ? 'bg-indigo-500 cursor-not-allowed' : 'bg-indigo-650 hover:bg-indigo-700'
              }`}
            >
              {loading ? (
                <div className="h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <FaUserPlus /> Sign Up
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-gray-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:underline font-bold">
              Log in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
