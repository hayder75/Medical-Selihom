import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Heart, Shield, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Fetch users for login
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await api.get('/auth/login-users');
        setUsers(response.data.users || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Could not connect to backend to fetch users. Please check if the server is running.');
        // Don't show error, just allow manual username entry
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setFormData({
      ...formData,
      username: user.username
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate user selection if users are available
    if (users.length > 0 && !selectedUser) {
      toast.error('Please select a user from the dropdown');
      return;
    }

    // Validate that username is filled
    if (!formData.username) {
      toast.error('Please select a user or enter username');
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData);

      if (result.success) {
        toast.success('Login successful!');
        navigate('/');
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Medical Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 border-2 border-blue-300 rounded-full"></div>
          <div className="absolute top-32 right-20 w-24 h-24 border-2 border-blue-300 rounded-full"></div>
          <div className="absolute bottom-20 left-32 w-20 h-20 border-2 border-blue-300 rounded-full"></div>
          <div className="absolute bottom-32 right-10 w-28 h-28 border-2 border-blue-300 rounded-full"></div>
        </div>

        {/* Medical Icons */}
        <div className="absolute top-20 left-20">
          <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
            <Heart className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="absolute top-40 right-32">
          <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-green-500" />
          </div>
        </div>

        <div className="absolute bottom-40 left-16">
          <div className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center">
            <Users className="w-7 h-7 text-blue-500" />
          </div>
        </div>

        {/* Main Medical Illustration */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            {/* Selihom Logo */}
            <div className="relative mb-8">
              <img
                src="/selihom.jpg"
                alt="Selihom Medical Clinic"
                className="w-64 h-64 mx-auto rounded-full object-cover shadow-2xl border-4 border-white"
              />
            </div>

            {/* Text Content */}
            <div className="text-white space-y-4">
              <h3 className="text-3xl font-bold">Welcome to</h3>
              <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Selihom Medical Clinic
              </h2>
              <p className="text-xl text-gray-600 max-w-md mx-auto">
                We are committed to providing exceptional healthcare services with compassion and excellence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Sign In
            </h2>
            <p className="text-xl font-medium text-gray-700">
              Access your Selihom Medical Clinic account
            </p>
          </div>

          {/* Login Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* User Selection Dropdown */}
              <div>
                <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Account {users.length > 0 && `(${users.length} users)`}
                </label>
                {loadingUsers ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-center text-gray-500">
                    Loading users...
                  </div>
                ) : users.length > 0 ? (
                  <select
                    id="user-select"
                    name="user-select"
                    value={selectedUser?.id || ''}
                    onChange={(e) => {
                      const user = users.find(u => u.id === e.target.value);
                      if (user) {
                        handleSelectUser(user);
                      } else {
                        setSelectedUser(null);
                        setFormData({
                          ...formData,
                          username: ''
                        });
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                    required
                  >
                    <option value="">-- Select your account --</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullname || user.username} {user.role === 'ADMIN' ? '- 🔑 Admin' : `- ${user.role}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>

              {/* Show selected user info */}
              {selectedUser && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">
                    Logging in as: {selectedUser.fullname || selectedUser.username}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">{selectedUser.role}</div>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || (users.length > 0 && !selectedUser)}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Sign In'
                )}
              </button>
              {users.length > 0 && !selectedUser && (
                <p className="text-xs text-red-500 mt-2 text-center">Please select a user first</p>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
