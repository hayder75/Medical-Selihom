import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import PatientQueue from '../../components/doctor/PatientQueue';
import PatientHistory from '../../components/doctor/PatientHistory';
import ComprehensivePatientHistory from '../../components/doctor/ComprehensivePatientHistory';
import ResultsQueue from '../../components/doctor/ResultsQueue';
import UnifiedQueue from '../../components/doctor/UnifiedQueue';
import MedicalCertificates from './MedicalCertificates';
import ReferralPage from './ReferralPage';
import InternationalMedicalCertificatePage from './InternationalMedicalCertificatePage';
import DoctorDailyWork from './DoctorDailyWork';
import toast from 'react-hot-toast';
import api from '../../services/api';
import {
  Stethoscope,
  FileText,
  Users,
  Activity,
  Clock,
  CheckCircle,
  X,
  AlertTriangle
} from 'lucide-react';

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    waitingPatients: 0,
    completedVisits: 0,
    pendingOrders: 0,
    todayAppointments: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompleteAllModal, setShowCompleteAllModal] = useState(false);
  const [completingAll, setCompletingAll] = useState(false);
  const [completeAllCount, setCompleteAllCount] = useState(0);
  const [fetchingCompleteCount, setFetchingCompleteCount] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, activityResponse] = await Promise.all([
        api.get('/doctors/dashboard-stats'),
        api.get('/doctors/recent-activity?limit=4')
      ]);

      setStats(statsResponse.data);
      setRecentActivity(activityResponse.data.activities || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleCompleteAllClick = async () => {
    console.log("[CompleteAll] Button clicked, fetching count...");
    try {
      setFetchingCompleteCount(true);
      const res = await api.get('/doctors/dashboard-stats');
      const waitingCount = res.data.waitingPatients || 0;
      console.log("[CompleteAll] Waiting count:", waitingCount);
      if (waitingCount === 0) {
        toast.success('No active visits to complete');
        return;
      }
      setCompleteAllCount(waitingCount);
      setShowCompleteAllModal(true);
      console.log("[CompleteAll] Modal shown, count:", waitingCount);
    } catch (err) {
      console.error("[CompleteAll] API error:", err.response?.data || err.message);
      toast.error("Failed to check active visits");
    } finally {
      setFetchingCompleteCount(false);
    }
  };

  const confirmCompleteAll = async () => {
    console.log("[CompleteAll] Confirm clicked, posting to API...");
    try {
      setCompletingAll(true);
      const res = await api.post('/doctors/bulk-complete-active-visits');
      console.log("[CompleteAll] API success:", res.data);
      if (res.data.skipped > 0) {
        toast.success(res.data.message || 'All visits completed successfully', { duration: 5000 });
        toast('Skipped ' + res.data.skipped + ' patient(s) with active bed admissions', { icon: '⚠️', duration: 5000 });
      } else {
        toast.success(res.data.message || 'All visits completed successfully');
      }
      setShowCompleteAllModal(false);
      setCompleteAllCount(0);
      fetchDashboardData();
    } catch (err) {
      console.error("[CompleteAll] API error:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || 'Failed to complete visits');
    } finally {
      setCompletingAll(false);
    }
  };

  const closeCompleteAllModal = () => {
    setShowCompleteAllModal(false);
    setCompleteAllCount(0);
  };

  const statCards = [
    {
      title: 'Waiting Patients',
      value: stats.waitingPatients,
      icon: Users,
      color: '#2e13d1',
      description: 'Patients waiting for consultation'
    },
    {
      title: 'Completed Today',
      value: stats.completedVisits,
      icon: CheckCircle,
      color: '#10B981',
      description: 'Visits completed today'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: FileText,
      color: '#F59E0B',
      description: 'Lab/radiology orders pending'
    },
    {
      title: 'Appointments',
      value: stats.todayAppointments,
      icon: Clock,
      color: '#EA2E00',
      description: 'Scheduled appointments today'
    }
  ];

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const DashboardOverview = () => {
    const navigate = useNavigate();

    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="card hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 rounded-lg shadow-sm" style={{ backgroundColor: stat.color }}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium" style={{ color: '#2e13d1' }}>{stat.title}</p>
                  {loading ? (
                    <div className="animate-pulse h-8 w-16 bg-gray-200 rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-semibold" style={{ color: '#0C0E0B' }}>{stat.value}</p>
                  )}
                  <p className="text-xs" style={{ color: '#2e13d1' }}>{stat.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Complete All Active Visits */}
        <div className="card border-2 border-dashed border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg shadow-sm" style={{ backgroundColor: '#DC2626' }}>
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#991B1B' }}>Complete All Active Visits</p>
                <p className="text-xs" style={{ color: '#B91C1C' }}>Finish all your pending patients so they can be discharged or create new visits</p>
              </div>
            </div>
            <button
              onClick={handleCompleteAllClick}
              disabled={fetchingCompleteCount}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold text-sm hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              {fetchingCompleteCount ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Checking...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Complete All
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-medium mb-4" style={{ color: '#0C0E0B' }}>Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/doctor/queue')}
                className="w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-md"
                style={{ borderColor: '#2e13d1', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F8FAFC'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <div className="flex items-center">
                  <Stethoscope className="h-5 w-5 mr-3" style={{ color: '#2e13d1' }} />
                  <div>
                    <p className="font-medium" style={{ color: '#0C0E0B' }}>Patient Queue</p>
                    <p className="text-sm" style={{ color: '#2e13d1' }}>View unified patient queue with priority</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate('/doctor/history')}
                className="w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-md"
                style={{ borderColor: '#2e13d1', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F8FAFC'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-3" style={{ color: '#2e13d1' }} />
                  <div>
                    <p className="font-medium" style={{ color: '#0C0E0B' }}>Comprehensive Patient History</p>
                    <p className="text-sm" style={{ color: '#2e13d1' }}>Complete visit details with all data</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate('/doctor/referrals')}
                className="w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-md"
                style={{ borderColor: '#2e13d1', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F8FAFC'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <div className="flex items-center">
                  <Activity className="h-5 w-5 mr-3" style={{ color: '#2e13d1' }} />
                  <div>
                    <p className="font-medium" style={{ color: '#0C0E0B' }}>Refer Patient</p>
                    <p className="text-sm" style={{ color: '#2e13d1' }}>Refer patient to other hospitals</p>
                  </div>
                </div>
              </button>
              <button onClick={() => navigate('/doctor/daily-work')} className="w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-md" style={{ borderColor: '#2e13d1', backgroundColor: 'transparent' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#F8FAFC'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-3" style={{ color: '#EA2E00' }} />
                  <div>
                    <p className="font-medium" style={{ color: '#0C0E0B' }}>Daily Work Report</p>
                    <p className="text-sm" style={{ color: '#2e13d1' }}>Calendar, selected-day details, and print</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium mb-4" style={{ color: '#0C0E0B' }}>Recent Activity</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#2e13d1' }}></div>
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => {
                  const timeAgo = getTimeAgo(activity.timestamp);
                  return (
                    <div key={index} className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#E5E7EB' }}>
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full mr-3" style={{ backgroundColor: activity.color }}></div>
                        <span className="text-sm" style={{ color: '#0C0E0B' }}>{activity.message}</span>
                      </div>
                      <span className="text-xs" style={{ color: '#2e13d1' }}>{timeAgo}</span>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-sm" style={{ color: '#6B7280' }}>
                No recent activity
              </div>
            )}
          </div>
        </div>
        {/* Complete All Active Visits Modal */}
        {showCompleteAllModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full relative shadow-2xl">
              <button onClick={closeCompleteAllModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#FEE2E2' }}>
                  <CheckCircle className="h-5 w-5" style={{ color: '#DC2626' }} />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: '#0C0E0B' }}>Complete All Active Visits</h3>
              </div>

              <p className="text-sm mb-2" style={{ color: '#4B5563' }}>
                You are about to complete <strong>{completeAllCount}</strong> active patient visit(s). This will move all your pending patients forward in the workflow.
              </p>

              <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA' }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#EA580C' }} />
                  <p className="text-xs" style={{ color: '#9A3412' }}>
                    This action cannot be undone. All pending consultations will be marked as completed.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeCompleteAllModal}
                  disabled={completingAll}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCompleteAll}
                  disabled={completingAll}
                  className="flex-1 px-4 py-2.5 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#DC2626' }}
                >
                  {completingAll ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Completing...
                    </>
                  ) : (
                    'Confirm Complete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Routes>
      <Route path="/" element={<DashboardOverview />} />
      <Route path="/queue" element={<UnifiedQueue />} />
      <Route path="/legacy-queue" element={<PatientQueue />} />
      <Route path="/legacy-results" element={<ResultsQueue />} />
      <Route path="/history" element={<ComprehensivePatientHistory />} />
      <Route path="/legacy-history" element={<PatientHistory />} />
      <Route path="/medical-certificates" element={<MedicalCertificates />} />
      <Route path="/daily-work" element={<DoctorDailyWork />} />
      <Route path="/referrals" element={<ReferralPage />} />
      <Route path="/international-certificates" element={<InternationalMedicalCertificatePage />} />
    </Routes>
  );
};

export default DoctorDashboard;
