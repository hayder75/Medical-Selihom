import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  Download,
  Printer,
  Calendar,
  FlaskConical,
  Scan,
  Wrench,
  HeartPulse,
  CreditCard,
  User,
  Package,
  AlertTriangle,
  Layers,
  TrendingUp,
  Wallet,
  Landmark,
  Receipt
} from 'lucide-react';
import api from '../../services/api';
import { getServerUrl } from '../../utils/imageUrl';
import BankMethodSelect from '../../components/common/BankMethodSelect';

const SERVICE_BUTTON_CONFIG = [
  { key: 'ALL', label: 'All Services', icon: Layers, accent: 'bg-slate-100 text-slate-700 border-slate-200' },
  { key: 'LAB_ORDERED', label: 'Lab (Doctor Ordered)', icon: FlaskConical, accent: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { key: 'LAB_WALKIN', label: 'Lab Walk-in', icon: FlaskConical, accent: 'bg-sky-100 text-sky-700 border-sky-200' },
  { key: 'RADIOLOGY_ORDERED', label: 'Radiology (Doctor Ordered)', icon: Scan, accent: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { key: 'RADIOLOGY_WALKIN', label: 'Radiology Walk-in', icon: Scan, accent: 'bg-violet-100 text-violet-700 border-violet-200' },
  { key: 'PROCEDURE', label: 'Procedure', icon: Wrench, accent: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'NURSE_SERVICES', label: 'Nurse Services', icon: HeartPulse, accent: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: 'CARD_CREATED_GENERAL', label: 'Medical Card Created', icon: CreditCard, accent: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'CARD_CREATED_DERMATOLOGY', label: 'Dermatology Card Created', icon: CreditCard, accent: 'bg-violet-100 text-violet-700 border-violet-200' },
  { key: 'CARD_REACTIVATION_GENERAL', label: 'Medical Card Reactivation', icon: CreditCard, accent: 'bg-sky-100 text-sky-700 border-sky-200' },
  { key: 'CARD_REACTIVATION_DERMATOLOGY', label: 'Dermatology Card Reactivation', icon: CreditCard, accent: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200' },
  { key: 'MATERIAL_NEEDS', label: 'Material Needs', icon: Package, accent: 'bg-orange-100 text-orange-700 border-orange-200' },
  { key: 'EMERGENCY_MEDICATION', label: 'Emergency Medication', icon: AlertTriangle, accent: 'bg-rose-100 text-rose-700 border-rose-200' },
  { key: 'OTHER', label: 'Other Services', icon: Receipt, accent: 'bg-zinc-100 text-zinc-700 border-zinc-200' }
];

const DailyCashManagement = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState('');

  // Patient receipts for transactions tab
  const [patientReceipts, setPatientReceipts] = useState([]);
  const [loadingPatientReceipts, setLoadingPatientReceipts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('name'); // 'name' or 'phone'

  const [acceptedSummary, setAcceptedSummary] = useState({
    date: '',
    currentUser: null,
    totalAcceptedAmount: 0,
    totalTransactions: 0,
    serviceTotals: [],
    myTransactions: []
  });
  const [loadingAcceptedSummary, setLoadingAcceptedSummary] = useState(false);
  const [selectedServiceBucket, setSelectedServiceBucket] = useState('ALL');
  const [showMyDetails, setShowMyDetails] = useState(false);

  // Form states (kept for deposits and expenses tabs)
  const [depositForm, setDepositForm] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    transactionNumber: '',
    notes: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: 'OFFICE_SUPPLIES',
    description: '',
    vendor: ''
  });

  useEffect(() => {
    fetchCurrentSession();
    fetchAcceptedServicesSummary();
    if (activeTab === 'transactions') {
      fetchPatientReceipts();
    }
  }, [activeTab, selectedDate]);

  // Refetch when search changes (with debounce)
  useEffect(() => {
    if (activeTab === 'transactions') {
      const timeoutId = setTimeout(() => {
        fetchPatientReceipts();
      }, 500); // 500ms debounce
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, searchType]);

  const fetchCurrentSession = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cash-management/current-session');
      setSession(response.data.session);
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to fetch current session');
    } finally {
      setLoading(false);
    }
  };

  const fetchAcceptedServicesSummary = async () => {
    try {
      setLoadingAcceptedSummary(true);
      const dateParam = selectedDate || getLocalDateInputValue();
      const response = await api.get(`/cash-management/accepted-services-summary?date=${dateParam}`);

      if (response.data?.success) {
        setAcceptedSummary({
          date: response.data.date,
          currentUser: response.data.currentUser || null,
          totalAcceptedAmount: response.data.totalAcceptedAmount || 0,
          totalTransactions: response.data.totalTransactions || 0,
          serviceTotals: response.data.serviceTotals || [],
          myTransactions: response.data.myTransactions || []
        });
      }
    } catch (error) {
      console.error('Error fetching accepted services summary:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch accepted services summary');
    } finally {
      setLoadingAcceptedSummary(false);
    }
  };


  const handleAddDeposit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/cash-management/add-deposit', {
        ...depositForm,
        amount: parseFloat(depositForm.amount)
      });

      toast.success('Bank deposit recorded successfully');
      setDepositForm({
        amount: '',
        bankName: '',
        accountNumber: '',
        transactionNumber: '',
        notes: ''
      });
      fetchCurrentSession();
    } catch (error) {
      console.error('Error adding deposit:', error);
      toast.error(error.response?.data?.error || 'Failed to record deposit');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/cash-management/add-expense', {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount)
      });

      toast.success('Expense recorded successfully');
      setExpenseForm({
        amount: '',
        category: 'OFFICE_SUPPLIES',
        description: '',
        vendor: ''
      });
      fetchCurrentSession();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error(error.response?.data?.error || 'Failed to record expense');
    }
  };


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getLocalDateInputValue = () => {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0];
  };

  const serviceTotalMap = useMemo(() => {
    const map = new Map();
    (acceptedSummary.serviceTotals || []).forEach((serviceTotal) => {
      map.set(serviceTotal.key, serviceTotal);
    });
    return map;
  }, [acceptedSummary.serviceTotals]);

  const filteredMyTransactions = useMemo(() => {
    return (acceptedSummary.myTransactions || []).filter((item) => {
      if (selectedServiceBucket === 'ALL') {
        return true;
      }

      return item.allocations.some((allocation) => allocation.key === selectedServiceBucket);
    });
  }, [acceptedSummary.myTransactions, selectedServiceBucket]);

  // Filter transactions by selected date
  const filteredTransactions = useMemo(() => {
    if (!session || !session.transactions) return [];
    if (!selectedDate) return session.transactions;

    const filterDate = new Date(selectedDate);
    filterDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return session.transactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= filterDate && transactionDate < nextDay;
    });
  }, [session, selectedDate]);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    // Create CSV content (Excel can open CSV)
    const headers = ['Date & Time', 'Description', 'Type', 'Payment Method', 'Patient', 'Amount'];
    const rows = filteredTransactions.map(t => [
      new Date(t.createdAt).toLocaleString(),
      t.description,
      t.type.replace('_', ' '),
      t.paymentMethod,
      t.patient ? t.patient.name : '-',
      `${t.type === 'PAYMENT_RECEIVED' ? '+' : '-'}${formatCurrency(t.amount)}`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions-${selectedDate || 'all'}-${getLocalDateInputValue()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Transactions exported to Excel');
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    try {
      const response = await api.post('/cash-management/export-transactions-pdf', {
        transactions: filteredTransactions,
        date: selectedDate || getLocalDateInputValue()
      });

      const link = document.createElement('a');
      link.href = `${getServerUrl()}${response.data.filePath}`;
      link.download = response.data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  // Fetch patient receipts
  const fetchPatientReceipts = async () => {
    try {
      setLoadingPatientReceipts(true);
      const dateParam = selectedDate || getLocalDateInputValue();
      let url = `/cash-management/patient-receipts?date=${dateParam}`;

      // Add search parameters if search query exists
      if (searchQuery && searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}&searchType=${searchType}`;
      }

      const response = await api.get(url);
      if (response.data.success) {
        setPatientReceipts(response.data.patients || []);
      }
    } catch (error) {
      console.error('Error fetching patient receipts:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch patient receipts');
    } finally {
      setLoadingPatientReceipts(false);
    }
  };

  // Print individual receipt for a single patient
  const printPatientReceipt = (patientData) => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const { patient, services, totalAmount } = patientData;

    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${patient?.name || 'Patient'}</title>
          <style>
            @media print {
              @page { 
                size: A6;
                margin: 0;
              }
              body { 
                margin: 0; 
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: flex-start;
              }
              .no-print { display: none; }
              .receipt-container {
                width: 105mm;
                height: 148mm;
                margin: 0;
                padding: 8mm;
                border: none;
                box-shadow: none;
              }
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px;
              color: #333;
              line-height: 1.3;
              background: #f3f4f6;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .no-print {
              text-align: center;
              padding: 15px;
              background: #fff;
              margin-bottom: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              width: 100%;
              max-width: 400px;
            }
            .no-print button {
              background: #2563eb;
              color: white;
              border: none;
              padding: 10px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
              transition: background 0.2s;
            }
            .no-print button:hover {
              background: #1d4ed8;
            }
            .receipt-container {
              width: 105mm;
              min-height: 148mm;
              background: white;
              padding: 8mm;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
              border-radius: 2px;
              position: relative;
              box-sizing: border-box;
            }
            .header { 
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-bottom: 8px; 
              margin-bottom: 12px; 
              border-bottom: 2px solid #2563eb;
            }
            .header-left {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .logo {
              width: 45px;
              height: 45px;
              object-fit: contain;
            }
            .clinic-info {
              text-align: left;
            }
            .clinic-name { 
              font-size: 16px; 
              font-weight: 800; 
              margin: 0;
              color: #1e40af;
              letter-spacing: -0.3px;
            }
            .clinic-tagline {
              font-size: 9px;
              color: #64748b;
              margin: 0;
              font-style: italic;
            }
            .header-right {
              text-align: right;
            }
            .report-title { 
              font-size: 14px; 
              font-weight: 700; 
              margin: 0;
              color: #0f172a;
              text-transform: uppercase;
            }
            .report-info {
              font-size: 9px;
              color: #64748b;
              margin-top: 1px;
            }
            .patient-section {
              margin: 8px 0;
              padding: 6px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 4px;
            }
            .patient-name {
              font-size: 12px;
              font-weight: 700;
              color: #1e293b;
            }
            .services-section {
              margin: 12px 0;
            }
            .services-section h3 {
              font-size: 11px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              margin-bottom: 6px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 2px;
            }
            .service-item { 
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              margin-bottom: 4px;
              color: #334155;
            }
            .service-name {
              flex: 1;
            }
            .service-price {
              font-weight: 600;
              margin-left: 10px;
            }
            .total-section {
              margin-top: 15px;
              padding-top: 8px;
              border-top: 2px solid #e2e8f0;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-weight: 800;
              font-size: 14px;
              color: #0f172a;
            }
            .signature-area { 
              margin-top: 25px;
              display: flex;
              justify-content: flex-end;
            }
            .signature-box { 
              width: 120px; 
              border-top: 1px solid #334155; 
              padding-top: 4px; 
              text-align: center; 
              font-size: 9px; 
              font-weight: 600;
              color: #64748b;
            }
            .print-footer {
              text-align: center;
              font-size: 8px;
              color: #94a3b8;
              margin-top: 20px;
              position: absolute;
              bottom: 8mm;
              left: 0;
              right: 0;
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button onclick="window.print()">Print Receipt</button>
          </div>
          
          <div class="receipt-container">
            <div class="header">
              <div class="header-left">
                <img src="/selihom.jpg" alt="Clinic Logo" class="logo" onerror="this.style.display='none'">
                <div class="clinic-info">
                  <h1 class="clinic-name">Selihom Medical Clinic</h1>
                  <p class="clinic-tagline">Quality Healthcare You Can Trust</p>
                </div>
              </div>
              <div class="header-right">
                <h2 class="report-title">Receipt</h2>
                <div class="report-info">
                  Date: ${currentDate}<br>
                  Time: ${currentTime}
                </div>
              </div>
            </div>
            
            <div class="patient-section">
              <div class="patient-name">Patient: ${patient?.name || 'N/A'}</div>
            </div>
            
            <div class="services-section">
              <h3>Services Rendered</h3>
              ${services.map((service, index) => `
                <div class="service-item">
                  <span class="service-name">${index + 1}. ${service.name}</span>
                  <span class="service-price">${service.totalPrice.toFixed(2)} ETB</span>
                </div>
              `).join('')}
            </div>
            
            <div class="total-section">
              <div class="total-row">
                <span>Total Amount:</span>
                <span>${totalAmount.toFixed(2)} ETB</span>
              </div>
            </div>
            
            <div class="signature-area">
              <div class="signature-box">
                Cashier Signature
              </div>
            </div>

            <div class="print-footer">
              Selihom Medical Clinic - Generated on ${new Date().toLocaleString()}
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Print transactions
  const handlePrintTransactions = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    const totalAmount = filteredTransactions.reduce((sum, t) => {
      return sum + (t.type === 'PAYMENT_RECEIVED' ? t.amount : -t.amount);
    }, 0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Transactions Report</title>
          <style>
            @media print {
              @page { margin: 20mm; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              font-size: 9px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .clinic-name {
              font-size: 15px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .report-title {
              font-size: 12px;
              color: #666;
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .total-row {
              font-weight: bold;
              background-color: #f9f9f9;
            }
            .positive { color: #059669; }
            .negative { color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">Selihom Medical Clinic</div>
            <div class="report-title">Daily Cash Transactions Report</div>
            <div>Date: ${selectedDate ? new Date(selectedDate).toLocaleDateString() : new Date().toLocaleDateString()}</div>
            <div>Generated: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Description</th>
                <th>Type</th>
                <th>Payment Method</th>
                <th>Patient</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(t => `
                <tr>
                  <td>${new Date(t.createdAt).toLocaleString()}</td>
                  <td>${t.description}</td>
                  <td>${t.type.replace('_', ' ')}</td>
                  <td>${t.paymentMethod}</td>
                  <td>${t.patient ? t.patient.name : '-'}</td>
                  <td class="${t.type === 'PAYMENT_RECEIVED' ? 'positive' : 'negative'}">
                    ${t.type === 'PAYMENT_RECEIVED' ? '+' : '-'}${formatCurrency(t.amount)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="5" style="text-align: right;">Total:</td>
                <td>${formatCurrency(totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
          <div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #000;">
            <div style="margin-bottom: 20px;">
              <div style="border-top: 1px solid #000; width: 200px; margin-bottom: 5px;"></div>
              <div style="font-size: 11px; margin-bottom: 5px;">Signature: _________________________</div>
              <div style="font-size: 11px;">Date: _________________________</div>
            </div>
            <div style="text-align: center; font-size: 10px; color: #666; margin-top: 20px;">
              <div>Selihom Medical Clinic</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      case 'RESET': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No active session found</p>
      </div>
    );
  }

  const { calculatedTotals } = session;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Cash Management</h1>
            <p className="text-gray-600">Session Date: {new Date(session.sessionDate).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>{session.status}</span>
            {session.isReset && <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">RESET</span>}
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50 to-teal-50 p-5">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Accepted / Processed Services</h2>
              <p className="text-sm text-slate-600">Track what billing accepted for {acceptedSummary.date ? new Date(acceptedSummary.date).toLocaleDateString() : 'today'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Total Accepted: <span className="font-bold text-slate-900">{formatCurrency(acceptedSummary.totalAcceptedAmount || 0)}</span></div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Transactions: <span className="font-bold text-slate-900">{acceptedSummary.totalTransactions || 0}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {SERVICE_BUTTON_CONFIG.map((serviceButton) => {
              const Icon = serviceButton.icon;
              const serviceStat = serviceTotalMap.get(serviceButton.key);
              const amount = serviceButton.key === 'ALL' ? (acceptedSummary.totalAcceptedAmount || 0) : (serviceStat?.amount || 0);
              const transactionsCount = serviceButton.key === 'ALL' ? (acceptedSummary.totalTransactions || 0) : (serviceStat?.transactions || 0);
              const isActive = selectedServiceBucket === serviceButton.key;

              return (
                <button
                  key={serviceButton.key}
                  onClick={() => setSelectedServiceBucket(serviceButton.key)}
                  className={`rounded-xl border p-3 text-left transition-all ${isActive ? 'ring-2 ring-offset-1 ring-blue-300 border-blue-300 bg-white' : `${serviceButton.accent} hover:shadow-sm`}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-semibold">{transactionsCount} tx</span>
                  </div>
                  <div className="text-sm font-semibold">{serviceButton.label}</div>
                  <div className="mt-1 text-lg font-bold">{formatCurrency(amount)}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">My Processed Payments {acceptedSummary.currentUser?.name ? `- ${acceptedSummary.currentUser.name}` : ''}</h3>
                <p className="text-xs text-slate-500">Only your own processed money is shown here.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMyDetails((prev) => !prev)}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {showMyDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            {loadingAcceptedSummary ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-700"></div>
              </div>
            ) : !showMyDetails ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Click "Show Details" to view your daily processed transactions.</div>
            ) : filteredMyTransactions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No processed payments found for your selected service/date.</div>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {filteredMyTransactions.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900">{item.patientName}</div>
                        <div className="text-xs text-slate-500">{item.patientId || 'No Patient ID'} • {new Date(item.createdAt).toLocaleTimeString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{formatCurrency(item.amount)}</div>
                        <div className="text-xs text-slate-500">{item.paymentMethod}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.allocations.map((allocation) => (
                        <span key={`${item.id}-${allocation.key}`} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">
                          {allocation.label}: {formatCurrency(allocation.amount)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs font-medium text-blue-600">Starting Cash</div>
            <div className="text-xl font-bold text-blue-900">{formatCurrency(session.startingCash)}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-xs font-medium text-green-600">Total Received</div>
            <div className="text-xl font-bold text-green-900">{formatCurrency(calculatedTotals.totalReceived)}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-xs font-medium text-red-600">Total Expenses</div>
            <div className="text-xl font-bold text-red-900">{formatCurrency(calculatedTotals.totalExpenses)}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-xs font-medium text-purple-600">Current Cash</div>
            <div className="text-xl font-bold text-purple-900">{formatCurrency(calculatedTotals.currentCash)}</div>
          </div>
        </div>

        <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border-2 border-indigo-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Cash Reconciliation</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-700 font-medium">Starting Cash</span>
              <span className="text-lg font-semibold text-blue-900">+ {formatCurrency(session.startingCash)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-700 font-medium">Total Money Received Today</span>
              <span className="text-lg font-semibold text-green-700">+ {formatCurrency(calculatedTotals.totalReceived)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-700 font-medium">Total Expenses</span>
              <span className="text-lg font-semibold text-red-700">- {formatCurrency(calculatedTotals.totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b-2 border-gray-300">
              <span className="text-gray-700 font-medium">Bank Deposits</span>
              <span className="text-lg font-semibold text-yellow-700">- {formatCurrency(calculatedTotals.totalBankDeposit)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 bg-white rounded-lg px-4 py-3 shadow-sm">
              <span className="text-xl font-bold text-gray-900">Expected Cash in Drawer</span>
              <span className="text-3xl font-bold text-purple-900">
                {formatCurrency(session.startingCash + calculatedTotals.totalReceived - calculatedTotals.totalExpenses - calculatedTotals.totalBankDeposit)}
              </span>
            </div>
            <div className="mt-3 text-sm text-gray-600 bg-white p-3 rounded border-l-4 border-indigo-500">
              <strong>Formula:</strong> Starting Cash + Money Received - Expenses - Bank Deposits = Expected Cash
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600">Session Created By</div>
            <div className="text-lg font-semibold text-gray-900">{session.createdBy.fullname}</div>
          </div>
          {session.resetBy && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600">Reset By</div>
              <div className="text-lg font-semibold text-gray-900">{session.resetBy.fullname}</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4">
            {[
              { id: 'overview', name: 'Overview', icon: TrendingUp },
              { id: 'transactions', name: 'Transactions', icon: Wallet },
              { id: 'deposits', name: 'Bank Deposits', icon: Landmark },
              { id: 'expenses', name: 'Expenses', icon: Receipt }
            ].map((tab) => {
              const TabIcon = tab.icon;

              return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl border px-4 py-3 text-sm transition ${activeTab === tab.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <TabIcon className="h-6 w-6" />
                  <span className="font-semibold">{tab.name}</span>
                </div>
              </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Transactions */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                  <div className="space-y-2">
                    {session.transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-sm text-gray-500">
                            {transaction.type.replace('_', ' ')} • {transaction.paymentMethod}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${transaction.type === 'PAYMENT_RECEIVED' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {transaction.type === 'PAYMENT_RECEIVED' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(transaction.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Expenses */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Expenses</h3>
                  <div className="space-y-2">
                    {session.expenses.slice(0, 5).map((expense) => (
                      <div key={expense.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{expense.description}</div>
                          <div className="text-sm text-gray-500">
                            {expense.category.replace('_', ' ')} • {expense.vendor || 'No vendor'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-red-600">
                            -{formatCurrency(expense.amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(expense.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab - Patient Receipts */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              {/* Header with Date Filter and Search */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Filter by Date:</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => setSelectedDate('')}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Clear
                    </button>
                  </div>
                  <button
                    onClick={fetchPatientReceipts}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Refresh
                  </button>
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Search:</label>
                  <select
                    value={searchType}
                    onChange={(e) => {
                      setSearchType(e.target.value);
                      setSearchQuery('');
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="name">By Name</option>
                    <option value="phone">By Phone</option>
                  </select>
                  <input
                    type="text"
                    placeholder={`Search ${searchType === 'name' ? 'by patient name' : 'by phone number'}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Patient Receipts List */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Patient Receipts {selectedDate && `(${new Date(selectedDate).toLocaleDateString()})`}
                </h3>

                {loadingPatientReceipts ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  (() => {
                    // Backend handles search filtering now, so use patientReceipts directly
                    const filteredReceipts = patientReceipts;

                    if (filteredReceipts.length === 0) {
                      return (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                          <p className="text-gray-500">
                            {searchQuery ? 'No patient receipts found matching your search' : 'No patient receipts found for the selected date'}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {filteredReceipts.map((patientData, index) => (
                          <div key={patientData.patient.id || index} className="bg-white rounded-lg shadow overflow-hidden">
                            {/* Patient Header */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">{patientData.patient.name}</h4>
                                  <div className="mt-1 text-sm text-gray-600">
                                    {patientData.patient.mobile && `Phone: ${patientData.patient.mobile}`}
                                    {patientData.patient.mobile && patientData.patient.id && ' • '}
                                    {patientData.patient.id && `ID: ${patientData.patient.id}`}
                                    {patientData.visitCount > 0 && ` • ${patientData.visitCount} visit(s)`}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(patientData.totalAmount)}
                                  </div>
                                  <button
                                    onClick={() => printPatientReceipt(patientData)}
                                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                                  >
                                    <Printer className="h-4 w-4" />
                                    Print Receipt
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Services List */}
                            <div className="px-6 py-4">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {patientData.services.map((service, serviceIndex) => (
                                    <tr key={serviceIndex} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{serviceIndex + 1}</td>
                                      <td className="px-4 py-3 text-sm text-gray-900">{service.name}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{service.code}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{service.quantity}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(service.unitPrice)}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">{formatCurrency(service.totalPrice)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                  <tr>
                                    <td colSpan="5" className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                                      Total Amount:
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                                      {formatCurrency(patientData.totalAmount)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}

          {/* Bank Deposits Tab */}
          {activeTab === 'deposits' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Deposit Form */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Record Bank Deposit</h3>
                  <form onSubmit={handleAddDeposit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={depositForm.amount}
                        onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                      <BankMethodSelect
                        value={depositForm.bankName}
                        onChange={(e) => setDepositForm({ ...depositForm, bankName: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Account Number (Optional)</label>
                      <input
                        type="text"
                        value={depositForm.accountNumber}
                        onChange={(e) => setDepositForm({ ...depositForm, accountNumber: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Transaction Number (Optional)</label>
                      <input
                        type="text"
                        value={depositForm.transactionNumber}
                        onChange={(e) => setDepositForm({ ...depositForm, transactionNumber: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                      <textarea
                        value={depositForm.notes}
                        onChange={(e) => setDepositForm({ ...depositForm, notes: e.target.value })}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-lg"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Record Deposit
                    </button>
                  </form>
                </div>

                {/* Deposit List */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Bank Deposits</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {session.bankDeposits.map((deposit) => (
                      <div key={deposit.id} className="flex justify-between items-center p-3 bg-white border rounded">
                        <div>
                          <div className="font-medium">{deposit.bankName}</div>
                          <div className="text-sm text-gray-500">
                            {deposit.accountNumber && `Account: ${deposit.accountNumber}`}
                          </div>
                          {deposit.transactionNumber && (
                            <div className="text-xs text-blue-600">
                              TXN: {deposit.transactionNumber}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(deposit.amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(deposit.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Expense Form */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Record Expense</h3>
                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        value={expenseForm.category}
                        onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-lg"
                      >
                        <option value="OFFICE_SUPPLIES">Office Supplies</option>
                        <option value="MEDICAL_SUPPLIES">Medical Supplies</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="UTILITIES">Utilities</option>
                        <option value="FOOD_BEVERAGE">Food & Beverage</option>
                        <option value="TRANSPORTATION">Transportation</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <input
                        type="text"
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vendor (Optional)</label>
                      <input
                        type="text"
                        value={expenseForm.vendor}
                        onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-lg"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Record Expense
                    </button>
                  </form>
                </div>

                {/* Expense List */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Expenses</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {session.expenses.map((expense) => (
                      <div key={expense.id} className="flex justify-between items-center p-3 bg-white border rounded">
                        <div>
                          <div className="font-medium">{expense.description}</div>
                          <div className="text-sm text-gray-500">
                            {expense.category.replace('_', ' ')} • {expense.vendor || 'No vendor'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-red-600">
                            -{formatCurrency(expense.amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(expense.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DailyCashManagement;
