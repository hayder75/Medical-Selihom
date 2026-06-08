import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import AccountSettings from './AccountSettings';
import SystemSettings from '../admin/SystemSettings';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Menu,
  X,
  User,
  LogOut,
  Bell,
  Settings,
  RefreshCw,
  Home,
  Users,
  Stethoscope,
  Pill,
  FileText,
  Calendar,
  BarChart3,
  CreditCard,
  TestTube,
  Scan,
  ShoppingCart,
  CheckCircle,
  Activity,
  Phone,
  FileCheck,
  Clock,
  Image,
  DollarSign,
  UserPlus,
  UserCheck,
  Package,
  Trash2,
  Printer,
  Building2,
  Bed
} from 'lucide-react';

const Layout = ({ children, title, subtitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [oldPatientModeEnabled, setOldPatientModeEnabled] = useState(false);
  const [togglingOldPatientMode, setTogglingOldPatientMode] = useState(false);
  const [pendingAdvanceRequestCount, setPendingAdvanceRequestCount] = useState(0);
  const [pageRefreshKey, setPageRefreshKey] = useState(0);
  const [isRefreshingPage, setIsRefreshingPage] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [openGroups, setOpenGroups] = useState({});

  const toggleGroup = (groupName) => {
    setOpenGroups(prev => {
      const newState = {};
      // If the clicked group was not open, open it. All others remain closed (implicitly by creating new object)
      // If it was open, it won't be in newState, effectively closing it.
      if (!prev[groupName]) {
        newState[groupName] = true;
      }
      return newState;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePageRefresh = () => {
    setIsRefreshingPage(true);
    window.dispatchEvent(new CustomEvent('app-soft-refresh', {
      detail: {
        path: location.pathname,
        triggeredAt: Date.now()
      }
    }));
    setPageRefreshKey((prev) => prev + 1);
    window.setTimeout(() => setIsRefreshingPage(false), 700);
  };

  const handleNavigation = (href) => {
    navigate(href);
    setSidebarOpen(false);
  };

  const isCurrentPage = (href) => {
    if (href === '/') {
      return location.pathname === '/' || location.pathname === '/admin' || location.pathname === '/nurse' || location.pathname === '/doctor';
    }
    return location.pathname.startsWith(href);
  };

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;

    const fetchOldPatientMode = async () => {
      try {
        const response = await api.get('/admin/system-settings/oldPatientRegistrationMode');
        const value = response.data?.setting?.value;
        setOldPatientModeEnabled(String(value || 'false').toLowerCase() === 'true');
      } catch (error) {
        setOldPatientModeEnabled(false);
      }
    };

    fetchOldPatientMode();
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'BILLING_OFFICER') {
      setPendingAdvanceRequestCount(0);
      return;
    }

    let isMounted = true;

    const fetchPendingAdvanceRequests = async () => {
      try {
        const response = await api.get('/accounts/requests?status=PENDING');
        const pendingCount = (response.data?.requests || []).filter(
          (request) => request.requestType === 'ADD_DEPOSIT'
        ).length;

        if (isMounted) {
          setPendingAdvanceRequestCount(pendingCount);
        }
      } catch (error) {
        if (isMounted) {
          setPendingAdvanceRequestCount(0);
        }
      }
    };

    const handleAdvanceRequestUpdate = (event) => {
      if (typeof event?.detail?.count === 'number') {
        setPendingAdvanceRequestCount(event.detail.count);
        return;
      }

      fetchPendingAdvanceRequests();
    };

    fetchPendingAdvanceRequests();
    window.addEventListener('advance-requests-updated', handleAdvanceRequestUpdate);
    const intervalId = window.setInterval(fetchPendingAdvanceRequests, 30000);

    return () => {
      isMounted = false;
      window.removeEventListener('advance-requests-updated', handleAdvanceRequestUpdate);
      window.clearInterval(intervalId);
    };
  }, [user?.role, location.pathname]);

  const toggleOldPatientMode = async () => {
    if (togglingOldPatientMode) return;
    try {
      setTogglingOldPatientMode(true);
      const nextValue = !oldPatientModeEnabled;
      await api.put('/admin/system-settings/oldPatientRegistrationMode', {
        value: nextValue,
        description: 'Enable old-patient registration mode so billing can waive card registration fee during migration'
      });
      setOldPatientModeEnabled(nextValue);
      toast.success(`Old patient mode ${nextValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling old patient mode:', error);
      toast.error('Failed to update old patient mode');
    } finally {
      setTogglingOldPatientMode(false);
    }
  };

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/', icon: Home },
    ];

    switch (user?.role) {
      case 'ADMIN':
        return [
          ...baseItems,
          { name: 'Staff Management', href: '/admin/staff', icon: Users },
          { name: 'Patient Management', href: '/admin/patients', icon: Users },
          { name: 'Service Management', href: '/admin/services', icon: Package },
          { name: 'Report (Medical Clinc, Doctor, Billing)', href: '/admin/reports', icon: BarChart3 },
          { name: 'Lab Reports', href: '/admin/lab-reports', icon: TestTube },
          { name: 'Nurse Report', href: '/admin/nurse-performance', icon: UserCheck },
          {
            name: 'Disease Reports',
            icon: Activity,
            group: 'disease_reports',
            children: [
              { name: 'Disease Reports', href: '/admin/disease-reports', icon: Activity },
              { name: 'Age-Gender Distribution', href: '/admin/age-gender-disease-distribution', icon: Users },
            ]
          },
          { name: 'Doctor Performance', href: '/admin/doctor-performance', icon: Stethoscope },
          { name: 'Patient Accounts', href: '/admin/patient-accounts', icon: CreditCard },
          { name: 'Bed Management', href: '/admin/beds', icon: Bed },
          { name: 'Audit Logs', href: '/admin/audit', icon: FileText },
          { name: 'Loan Approval', href: '/admin/loan-approval', icon: DollarSign },
        ];

      case 'DOCTOR':
        return [
          ...baseItems,
          { name: 'Patient Queue', href: '/doctor/queue', icon: Stethoscope },
          { name: 'Daily Work', href: '/doctor/daily-work', icon: Calendar },
          { name: 'Bed & Admissions', href: '/doctor/admissions', icon: Bed },
          { name: 'Patient History', href: '/doctor/history', icon: FileText },
          { name: 'Medical Certificate', href: '/doctor/medical-certificates', icon: FileCheck },
          { name: 'International Certificate', href: '/doctor/international-certificates', icon: Activity },
          { name: 'Refer Patient', href: '/doctor/referrals', icon: Building2 },
          { name: 'Appointments', href: '/appointments', icon: Calendar },
          { name: 'Loans', href: '/loans', icon: DollarSign },
        ];

      case 'NURSE':
        return [
          ...baseItems,
          { name: 'Triage Queue', href: '/nurse/queue', icon: Stethoscope },
          { name: 'Bed & Admissions', href: '/nurse/admissions', icon: Bed },
          { name: 'Daily Tasks', href: '/nurse/tasks', icon: Calendar },
          { name: 'Walk-in Services', href: '/nurse/walk-in-services', icon: UserPlus },
          { name: 'Walk-in Orders', href: '/nurse/walk-in-orders', icon: Package },
          { name: 'Continuous Vitals', href: '/nurse/continuous-vitals', icon: Activity },
          { name: 'Patient Gallery', href: '/nurse/gallery', icon: Image },
          { name: 'Appointments', href: '/nurse/appointments', icon: Calendar },
          { name: 'Loans', href: '/loans', icon: DollarSign },
        ];

      case 'RECEPTIONIST':
        return [
          ...baseItems,
          { name: 'Patient Registration', href: '/reception/register', icon: Calendar },
          { name: 'Patient Management', href: '/reception/patients', icon: Users },
          { name: 'Patient Accounts', href: '/reception/patient-accounts', icon: CreditCard },
          { name: 'Prints', href: '/reception/prints', icon: Printer },
          { name: 'Appointments', href: '/reception/appointments', icon: Clock },
          { name: 'Pre-Registration', href: '/reception/pre-registration', icon: Phone },
          { name: 'Doctor Queue Management', href: '/reception/doctor-queue', icon: Stethoscope },
          { name: 'Patient Gallery', href: '/reception/gallery', icon: Image },
          { name: 'Loans', href: '/loans', icon: DollarSign },
        ];

      case 'BILLING_OFFICER':
        return [
          ...baseItems,
          {
            name: 'Billing & Finance',
            icon: CreditCard,
            group: 'billing_finance',
            badgeCount: pendingAdvanceRequestCount,
            children: [
              { name: 'Billing Queue', href: '/billing/queue', icon: CreditCard },
              { name: 'Emergency Billing', href: '/emergency-billing', icon: Activity },
              { name: 'Advance Deposits', href: '/billing/advance-deposits', icon: DollarSign, badgeCount: pendingAdvanceRequestCount },
              { name: 'Patient Accounts', href: '/billing/patient-accounts', icon: CreditCard },
              { name: 'Credit Installments', href: '/billing/credit-accounts', icon: CreditCard },
              { name: 'Cash Management', href: '/cash-management', icon: BarChart3 },
              { name: 'Loans', href: '/loans', icon: DollarSign },
            ]
          },
          {
            name: 'Patient Administration',
            icon: Users,
            group: 'patient_admin',
            children: [
              { name: 'Patient Registration', href: '/billing/register', icon: UserPlus },
              { name: 'Patient Management', href: '/billing/patients', icon: Users },
              { name: 'Pre-Registration', href: '/billing/pre-registration', icon: Phone },
              { name: 'Appointments', href: '/billing/appointments', icon: Calendar },
              { name: 'Doctor Queue', href: '/doctor-queue', icon: Stethoscope },
            ]
          },
          {
            name: 'Clinical & Records',
            icon: FileText,
            group: 'clinical_records',
            children: [
              { name: 'Prints', href: '/billing/prints', icon: Printer },
              { name: 'Walk-In Lab/Radiology', href: '/billing/walk-in-orders', icon: TestTube },
            ]
          },
          { name: 'Patient Gallery', href: '/billing/gallery', icon: Image }
        ];

      case 'PHARMACY_BILLING_OFFICER':
      case 'PHARMACIST':
        return [
          ...baseItems,
          { name: 'Pharmacy Billing', href: '/pharmacy-billing/invoices', icon: CreditCard },
          { name: 'Prescription Queue', href: '/pharmacy/queue', icon: Pill },
          { name: 'Inventory', href: '/pharmacy/inventory', icon: ShoppingCart },
          { name: 'Walk-in Sales', href: '/pharmacy/walk-in-sales', icon: ShoppingCart },
          { name: 'Loans', href: '/loans', icon: DollarSign },
        ];


      case 'RADIOLOGIST':
        return [
          ...baseItems,
          { name: 'Radiology Orders', href: '/radiology/orders', icon: Scan },
          { name: 'Walk-In Orders', href: '/radiology/walk-in', icon: UserPlus },
          { name: 'Loans', href: '/loans', icon: DollarSign },
        ];

      case 'LAB_TECHNICIAN':
        return [
          ...baseItems,
          { name: 'Lab Orders', href: '/lab/orders', icon: TestTube },
          { name: 'Walk-In Orders', href: '/lab/walk-in', icon: UserPlus },
          { name: 'Lab Reports', href: '/lab/reports', icon: BarChart3 },
          { name: 'Loans', href: '/loans', icon: DollarSign },
        ];

      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`} style={{ backgroundColor: 'var(--primary)' }}>
        <div className="flex items-center justify-between h-16 px-4 border-b" style={{ borderColor: 'var(--secondary)' }}>
          <div className="flex items-center">
            <span className="ml-3 text-xl font-bold text-white">Selihom Medical Clinic</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-white hover:bg-opacity-20 hover:bg-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-5 px-2 space-y-1 overflow-y-auto max-h-[calc(100vh-5rem)]">
          {navigationItems.map((item, index) => {
            // If item has children/group, render as dropdown
            if (item.children) {
              const isOpen = openGroups[item.group];
              // Check if any child is active
              const hasActiveChild = item.children.some(child => isCurrentPage(child.href));

              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(item.group)}
                    className={`group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg w-full text-left transition-all duration-200 ${hasActiveChild ? 'bg-white bg-opacity-10 text-white' : 'text-gray-200 hover:text-white hover:bg-opacity-20 hover:bg-white'
                      }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </div>
                    <div className="flex items-center gap-2">
                      {Number(item.badgeCount || 0) > 0 && (
                        <span className="inline-flex min-w-[20px] h-5 px-1.5 items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold">
                          {item.badgeCount > 99 ? '99+' : item.badgeCount}
                        </span>
                      )}
                      <svg
                        className={`ml-2 h-4 w-4 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>

                  {/* Dropdown Content */}
                  {isOpen && (
                    <div className="pl-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                      {item.children.map(child => (
                        <button
                          key={child.name}
                          onClick={() => handleNavigation(child.href)}
                          className={`group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg w-full text-left transition-all duration-200 ${isCurrentPage(child.href)
                            ? 'text-white bg-white bg-opacity-20'
                            : 'text-gray-300 hover:text-white hover:bg-opacity-10'
                            }`}
                        >
                          <div className="flex items-center">
                            <child.icon className={`mr-3 h-4 w-4 transition-colors ${isCurrentPage(child.href) ? 'text-white' : 'text-gray-400 group-hover:text-white'
                              }`} />
                            {child.name}
                          </div>
                          {Number(child.badgeCount || 0) > 0 && (
                            <span className="inline-flex min-w-[20px] h-5 px-1.5 items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold">
                              {child.badgeCount > 99 ? '99+' : child.badgeCount}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Standard item rendering (no children)
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg w-full text-left transition-all duration-200 ${isCurrentPage(item.href)
                  ? 'text-white shadow-lg'
                  : 'text-gray-200 hover:text-white hover:bg-opacity-20 hover:bg-white'
                  }`}
                style={{
                  backgroundColor: isCurrentPage(item.href) ? 'var(--secondary)' : 'transparent'
                }}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 transition-colors ${isCurrentPage(item.href) ? 'text-white' : 'text-gray-300 group-hover:text-white'
                    }`}
                />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="shadow-lg border-b" style={{ backgroundColor: '#FFFFFF', borderColor: 'var(--primary)' }}>
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md transition-colors"
                style={{ color: 'var(--dark)' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="ml-4 lg:ml-0">
                <h1 className="text-xl font-semibold" style={{ color: 'var(--dark)' }}>{title}</h1>
                {subtitle && (
                  <p className="text-sm" style={{ color: 'var(--primary)' }}>{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handlePageRefresh}
                disabled={isRefreshingPage}
                className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${isRefreshingPage ? 'opacity-70 cursor-not-allowed' : ''}`}
                style={{ color: 'var(--dark)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Refresh current page data"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshingPage ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline text-sm font-medium">Refresh</span>
              </button>

              {user?.role === 'ADMIN' && (
                <>
                  <button
                    type="button"
                    onClick={toggleOldPatientMode}
                    disabled={togglingOldPatientMode}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${oldPatientModeEnabled ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'} ${togglingOldPatientMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                    title="Old Patient Registration Mode"
                  >
                    Old Patient: {oldPatientModeEnabled ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => setShowSystemSettings(true)}
                    className="p-2 rounded-md transition-colors"
                    style={{ color: 'var(--dark)' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="System Settings"
                  >
                    <Bell className="h-6 w-6" />
                  </button>
                </>
              )}

              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => setShowAccountSettings(true)}
                      className="h-8 w-8 rounded-full flex items-center justify-center cursor-pointer transition hover:opacity-80"
                      style={{ backgroundColor: 'var(--primary)' }}
                      title="Account Settings"
                    >
                      <User className="h-5 w-5 text-white" />
                    </button>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium" style={{ color: 'var(--dark)' }}>{user?.fullname || user?.username}</p>
                    <p className="text-xs" style={{ color: 'var(--primary)' }}>{user?.role?.toLowerCase().replace('_', ' ')}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-md transition-colors"
                    style={{ color: 'var(--dark)' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--danger)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main key={`${location.pathname}-${pageRefreshKey}`} className="flex-1 overflow-y-auto" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="py-6">
            <div className={(location.pathname.startsWith('/admin') || location.pathname.includes('/doctor/consultation')) ? 'px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Account Settings Modal */}
      <AccountSettings
        isOpen={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
        user={user}
      />

      {showSystemSettings && (
        <SystemSettings onClose={() => setShowSystemSettings(false)} />
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 opacity-75" style={{ backgroundColor: '#2e13d1' }}></div>
        </div>
      )}
    </div>
  );
};

export default Layout;
