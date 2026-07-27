import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import SearchBar from '../components/common/SearchBar';
import FilterPanel from '../components/common/FilterPanel';
import Pagination from '../components/common/Pagination';
import Loader, { SkeletonTable } from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { Toast } from '../components/common/ErrorMessage';
import { FaUsers, FaArrowLeft, FaBan, FaCheck } from 'react-icons/fa';

const AdminUserManagement = () => {
  const navigate = useNavigate();

  // User list state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filters state
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({ role: '', isBlocked: '' });
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // feedback toasts
  const [toast, setToast] = useState(null);

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 8,
        search,
        role: activeFilters.role,
        isBlocked: activeFilters.isBlocked,
      };

      const res = await api.get('/users', { params });
      if (res.data?.success) {
        setUsers(res.data.users || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalRecords(res.data.totalRecords || 0);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        navigate('/403');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch user directory.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, activeFilters]);

  // Handle blocking/unblocking a user
  const handleToggleBlock = async (userId, isCurrentlyBlocked, userName) => {
    try {
      const res = await api.put(`/users/${userId}/block`);
      if (res.data?.success) {
        setToast({
          type: 'success',
          message: `User "${userName}" has been ${isCurrentlyBlocked ? 'unblocked' : 'blocked'} successfully!`,
        });
        // Reload list
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to update user block status.';
      setToast({ type: 'error', message: errMsg });
    }
  };

  const handleFilterChange = (name, value) => {
    setActiveFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1); // reset to first page
  };

  const handleResetFilters = () => {
    setActiveFilters({ role: '', isBlocked: '' });
    setSearch('');
    setPage(1);
  };

  // Filters configurations for FilterPanel
  const filterConfig = [
    {
      name: 'role',
      label: 'Role',
      options: ['Admin', 'Organizer', 'Participant', 'Judge'],
    },
    {
      name: 'isBlocked',
      label: 'Status',
      options: [
        { label: 'Active Only', value: 'false' },
        { label: 'Blocked Only', value: 'true' },
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-gray-500 hover:text-indigo-650 font-semibold text-sm transition-colors flex items-center gap-2 mb-3 cursor-pointer"
          >
            <FaArrowLeft className="text-xs" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <FaUsers className="text-indigo-600 h-8 w-8" /> User Directory Manager
          </h1>
          <p className="text-gray-500 mt-2 text-sm font-semibold">
            Search, filter, page, and coordinate block overrides for registered system user accounts.
          </p>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Panel column */}
        <div className="lg:col-span-1">
          <FilterPanel
            filters={filterConfig}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </div>

        {/* Directory Listings column */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <SearchBar
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search by name or email address..."
              onClear={() => setSearch('')}
            />
            <div className="text-sm font-bold text-gray-500 px-3 py-2 bg-gray-100/60 border border-gray-150 rounded-xl whitespace-nowrap text-center">
              Total Records: {totalRecords}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-750 font-bold text-sm">
              {error}
            </div>
          )}

          {/* Table list */}
          {loading ? (
            <SkeletonTable rows={6} cols={4} />
          ) : users.length === 0 ? (
            <EmptyState
              icon={FaUsers}
              title="No Users Found"
              message="Adjust your keywords or reset filters to view system user directory records."
            />
          ) : (
            <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        User Profile
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        System Role
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                        Action Override
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          <div>
                            <p className="font-bold text-gray-950">{u.name}</p>
                            <p className="text-xs text-gray-400 font-medium">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-bold">
                          {u.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              u.isBlocked
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {u.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <button
                            onClick={() => handleToggleBlock(u._id, u.isBlocked, u.name)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 mx-auto ${
                              u.isBlocked
                                ? 'bg-emerald-550 hover:bg-emerald-600 text-white hover:shadow-md'
                                : 'bg-red-50 hover:bg-red-100 text-red-650 border border-red-200'
                            }`}
                          >
                            {u.isBlocked ? (
                              <>
                                <FaCheck /> Unblock
                              </>
                            ) : (
                              <>
                                <FaBan /> Block
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination section */}
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;
