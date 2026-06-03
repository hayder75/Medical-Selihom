import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import StaffManagement from '../../components/admin/StaffManagement';
import ServiceCatalog from '../../components/admin/ServiceCatalog';
import AuditLogs from '../../components/admin/AuditLogs';
import Reports from '../../components/admin/Reports';
import InsuranceManagement from '../../components/admin/InsuranceManagement';
import InsuranceDetail from '../../components/admin/InsuranceDetail';
import ContinuousInfusionDashboard from '../../components/admin/ContinuousInfusionDashboard';
import DoctorPerformance from '../../components/admin/DoctorPerformance';
import NursePerformance from '../../components/admin/NursePerformance';
import LoanApproval from '../../components/admin/LoanApproval';
import PatientAccounts from '../../components/admin/PatientAccounts';
import PatientManagement from '../../components/admin/PatientManagement';
import InternationalMedicalCertificatePage from '../doctor/InternationalMedicalCertificatePage';
import BedManagement from '../../components/admin/BedManagement';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Users,
  Stethoscope,
  CreditCard,
  TestTube,
  Pill,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Bed
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalNurses: 0,
    pendingBillings: 0,
    pendingLabOrders: 0,
    pendingRadiologyOrders: 0,
    pharmacyQueue: 0,
    todayAppointments: 0,
    totalBeds: 0,
    occupiedBeds: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: Users,
      color: 'bg-blue-500',
      change: null, // Removed static change
      changeType: null
    },
    {
      title: 'Active Doctors',
      value: stats.totalDoctors,
      icon: Stethoscope,
      color: 'bg-green-500',
      change: null,
      changeType: null
    },
    {
      title: 'Active Nurses',
      value: stats.totalNurses,
      icon: Users,
      color: 'bg-purple-500',
      change: null,
      changeType: null
    },
    {
      title: 'Pending Billings',
      value: stats.pendingBillings,
      icon: CreditCard,
      color: 'bg-yellow-500',
      change: null,
      changeType: null
    },
    {
      title: 'Lab Orders',
      value: stats.pendingLabOrders,
      icon: TestTube,
      color: 'bg-indigo-500',
      change: null,
      changeType: null
    },
    {
      title: 'Radiology Orders',
      value: stats.pendingRadiologyOrders,
      icon: TestTube,
      color: 'bg-pink-500',
      change: null,
      changeType: null
    },
    {
      title: 'Pharmacy Queue',
      value: stats.pharmacyQueue,
      icon: Pill,
      color: 'bg-red-500',
      change: null,
      changeType: null
    },
    {
      title: 'Today\'s Appointments',
      value: stats.todayAppointments,
      icon: Calendar,
      color: 'bg-teal-500',
      change: null,
      changeType: null
    },
    {
      title: 'Bed Occupancy',
      value: `${stats.occupiedBeds || 0}/${stats.totalBeds || 0}`,
      icon: Bed,
      color: 'bg-indigo-600',
      change: stats.totalBeds > 0 ? `${Math.round((stats.occupiedBeds / stats.totalBeds) * 100)}%` : '0%',
      changeType: 'neutral'
    }
  ];

  const DashboardOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                {loading ? (
                  <div className="animate-pulse h-8 w-16 bg-gray-200 rounded mt-1"></div>
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium">Add New Staff Member</p>
                  <p className="text-sm text-gray-500">Create doctor, nurse, or technician account</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Stethoscope className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <p className="font-medium">Register New Patient</p>
                  <p className="text-sm text-gray-500">Add patient to the system</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/beds')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Bed className="h-5 w-5 text-indigo-500 mr-3" />
                <div>
                  <p className="font-medium">Manage Hospital Beds</p>
                  <p className="text-sm text-gray-500">Add, edit or update ward beds and rates</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-yellow-500 mr-3" />
                <div>
                  <p className="font-medium">View Pending Billings</p>
                  <p className="text-sm text-gray-500">Review unpaid invoices</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Alerts</h3>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
              <div>
                <p className="font-medium text-yellow-800">Low Inventory Alert</p>
                <p className="text-sm text-yellow-600">5 medications running low</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
              <div>
                <p className="font-medium text-red-800">Emergency Patient</p>
                <p className="text-sm text-red-600">Patient in critical condition</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <p className="font-medium text-green-800">System Health</p>
                <p className="text-sm text-green-600">All systems operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<DashboardOverview />} />
      <Route path="/staff" element={<StaffManagement />} />
      <Route path="/services" element={<ServiceCatalog />} />
      <Route path="/insurances" element={<InsuranceManagement />} />
      <Route path="/insurances/:insuranceId" element={<InsuranceDetail />} />
      <Route path="/audit" element={<AuditLogs />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/doctor-performance" element={<DoctorPerformance />} />
      <Route path="/nurse-performance" element={<NursePerformance />} />
      <Route path="/loan-approval" element={<LoanApproval />} />
      <Route path="/patient-accounts" element={<PatientAccounts />} />
      <Route path="/patients" element={<PatientManagement />} />
      <Route path="/continuous-infusions" element={<ContinuousInfusionDashboard />} />
      <Route path="/international-certificates" element={<InternationalMedicalCertificatePage />} />
      <Route path="/beds" element={<BedManagement />} />
    </Routes>
  );
};

export default AdminDashboard;
