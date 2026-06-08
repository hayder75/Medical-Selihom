import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Printer, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatCurrency = (value) => `ETB ${Number(value || 0).toLocaleString()}`;

const formatCategory = (value) => {
  const text = String(value || '').trim();
  if (!text) return 'Service';
  return text
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
};

const DoctorDailyWork = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [monthlyData, setMonthlyData] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [dayDetails, setDayDetails] = useState(null);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);

  const monthName = useMemo(() => new Date(year, month, 1).toLocaleString('en-US', { month: 'long' }), [year, month]);
  const firstWeekday = useMemo(() => new Date(year, month, 1).getDay(), [year, month]);
  const selectedDaySummary = dayDetails?.summary || null;
  const selectedVisits = dayDetails?.visits || [];

  const monthlySummaryItems = useMemo(() => {
    if (!monthlySummary) return [];

    return [
      { label: 'Visits', value: monthlySummary.visits || 0, tone: 'bg-slate-50 border-slate-200 text-slate-800' },
      { label: 'Billed (Visit Date)', value: formatCurrency(monthlySummary.billedAmount || 0), tone: 'bg-blue-50 border-blue-200 text-blue-900' },
      { label: 'Paid (Visit Date)', value: formatCurrency(monthlySummary.paidAmountByVisitDate || 0), tone: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
      { label: 'Collected (Payment Date)', value: formatCurrency(monthlySummary.collectedAmountByPaymentDate || 0), tone: 'bg-amber-50 border-amber-200 text-amber-900' },
      { label: 'Bank Collected', value: formatCurrency(monthlySummary.bankCollectedByPaymentDate || 0), tone: 'bg-violet-50 border-violet-200 text-violet-900' },
      { label: 'Charity Collected', value: formatCurrency(monthlySummary.charityCollectedByPaymentDate || 0), tone: 'bg-rose-50 border-rose-200 text-rose-900' },
    ];
  }, [monthlySummary]);

  const groupedSelectedVisits = useMemo(() => {
    const groupedMap = new Map();

    selectedVisits.forEach((visit, index) => {
      const groupKey = String(visit.patientId || visit.patientName || visit.visitId || `unknown-${index}`);

      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, {
          groupKey,
          patientName: visit.patientName || 'Unknown Patient',
          patientId: visit.patientId || 'N/A',
          visitRefs: [],
          patientGender: visit.patientGender || 'N/A',
          patientAge: visit.patientAge ?? 'N/A',
          billedAmount: 0,
          paidAmountByVisitDate: 0,
          services: [],
        });
      }

      const current = groupedMap.get(groupKey);
      const visitRef = visit.visitUid || visit.visitId || 'N/A';

      if (!current.visitRefs.includes(visitRef)) {
        current.visitRefs.push(visitRef);
      }

      current.billedAmount += Number(visit.billedAmount || 0);
      current.paidAmountByVisitDate += Number(visit.paidAmountByVisitDate || 0);

      if (Array.isArray(visit.services) && visit.services.length > 0) {
        current.services.push(...visit.services);
      }
    });

    return Array.from(groupedMap.values());
  }, [selectedVisits]);

  const fetchMonthly = async () => {
    try {
      setLoadingMonthly(true);
      const response = await api.get(`/doctors/daily-work/monthly?year=${year}&month=${month}`);
      const dailyData = response.data?.dailyData || [];
      setMonthlyData(dailyData);
      setMonthlySummary(response.data?.summary || null);

      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const firstActiveDay =
        dailyData.find((item) => item.date === selectedDate) ||
        dailyData.find((item) => item.date === todayKey) ||
        dailyData.find((item) => item.visits > 0 || item.billedAmount > 0 || item.collectedAmountByPaymentDate > 0) ||
        dailyData[0];

      if (firstActiveDay?.date) {
        setSelectedDate(firstActiveDay.date);
      }
    } catch (error) {
      console.error('Error fetching doctor daily work monthly:', error);
      toast.error('Failed to load monthly daily work report');
    } finally {
      setLoadingMonthly(false);
    }
  };

  const fetchDayDetails = async (date) => {
    if (!date) return;
    try {
      setLoadingDay(true);
      const response = await api.get(`/doctors/daily-work/day-details?date=${date}`);
      setDayDetails(response.data || null);
    } catch (error) {
      console.error('Error fetching doctor day details:', error);
      toast.error('Failed to load day details');
      setDayDetails(null);
    } finally {
      setLoadingDay(false);
    }
  };

  useEffect(() => {
    fetchMonthly();
  }, [year, month]);

  useEffect(() => {
    if (selectedDate) {
      fetchDayDetails(selectedDate);
    }
  }, [selectedDate]);

  const moveMonth = (direction) => {
    if (direction === 'prev') {
      if (month === 0) {
        setMonth(11);
        setYear((prev) => prev - 1);
      } else {
        setMonth((prev) => prev - 1);
      }
      return;
    }

    if (month === 11) {
      setMonth(0);
      setYear((prev) => prev + 1);
    } else {
      setMonth((prev) => prev + 1);
    }
  };

  const calendarCells = useMemo(() => {
    const placeholders = Array.from({ length: firstWeekday }, (_, index) => ({ kind: 'empty', id: `empty-${index}` }));
    const days = monthlyData.map((day) => ({ kind: 'day', ...day }));
    return [...placeholders, ...days];
  }, [firstWeekday, monthlyData]);

  const printDayReport = () => {
    if (!dayDetails) return;

    const summaryHtml = `
      <div class="summary-grid">
        <div class="summary-box"><span>Visits</span><strong>${selectedDaySummary?.visits || 0}</strong></div>
        <div class="summary-box"><span>Patients</span><strong>${selectedDaySummary?.patients || 0}</strong></div>
        <div class="summary-box"><span>Billed</span><strong>${formatCurrency(selectedDaySummary?.billedAmount || 0)}</strong></div>
        <div class="summary-box"><span>Paid By Visit Date</span><strong>${formatCurrency(selectedDaySummary?.paidAmountByVisitDate || 0)}</strong></div>
        <div class="summary-box"><span>Collected By Payment Date</span><strong>${formatCurrency(selectedDaySummary?.collectedAmountByPaymentDate || 0)}</strong></div>
        <div class="summary-box"><span>Cash Collected</span><strong>${formatCurrency(selectedDaySummary?.cashCollectedByPaymentDate || 0)}</strong></div>
      </div>
    `;

    const visitBlocks = selectedVisits.length > 0
      ? selectedVisits.map((visit, index) => {
          const serviceRows = (visit.services || []).length > 0
            ? visit.services.map((service) => `
                <tr>
                  <td>${formatCategory(service.category)}</td>
                  <td>${service.serviceName || 'Service'}</td>
                  <td>${service.quantity || 1}</td>
                  <td>${formatCurrency(service.unitPrice || 0)}</td>
                  <td>${formatCurrency(service.totalPrice || 0)}</td>
                </tr>
              `).join('')
            : '<tr><td colspan="5">No services found for this visit.</td></tr>';

          return `
            <section class="visit-block">
              <div class="visit-header">
                <div>
                  <h3>${index + 1}. ${visit.patientName || 'Unknown Patient'}</h3>
                  <p>ID: ${visit.patientId || 'N/A'} | Visit: ${visit.visitUid || visit.visitId || 'N/A'} | Gender: ${visit.patientGender || 'N/A'} | Age: ${visit.patientAge ?? 'N/A'}</p>
                </div>
                <div class="visit-totals">
                  <div><span>Billed</span><strong>${formatCurrency(visit.billedAmount || 0)}</strong></div>
                  <div><span>Paid</span><strong>${formatCurrency(visit.paidAmountByVisitDate || 0)}</strong></div>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Service</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>${serviceRows}</tbody>
              </table>
            </section>
          `;
        }).join('')
      : '<p class="empty-state">No patient visits recorded for this day.</p>';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Doctor Daily Work - ${dayDetails.date}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; background: #f8fafc; }
            .page { max-width: 1100px; margin: 0 auto; background: white; padding: 24px; }
            .header { border-bottom: 3px solid #1d4ed8; padding-bottom: 14px; margin-bottom: 18px; }
            .header h1 { margin: 0; font-size: 28px; color: #0f172a; }
            .header p { margin: 4px 0 0; color: #475569; font-size: 13px; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 18px 0; }
            .summary-box { border: 1px solid #cbd5e1; background: #f8fafc; padding: 12px; border-radius: 10px; }
            .summary-box span { display: block; font-size: 12px; color: #475569; margin-bottom: 6px; }
            .summary-box strong { font-size: 18px; color: #0f172a; }
            .section-title { margin: 20px 0 10px; font-size: 18px; color: #0f172a; }
            .visit-block { margin-bottom: 18px; border: 1px solid #dbeafe; border-radius: 12px; overflow: hidden; }
            .visit-header { background: #eff6ff; padding: 14px 16px; display: flex; justify-content: space-between; gap: 20px; }
            .visit-header h3 { margin: 0; font-size: 18px; color: #1d4ed8; }
            .visit-header p { margin: 6px 0 0; font-size: 12px; color: #475569; }
            .visit-totals { display: grid; grid-template-columns: repeat(2, minmax(120px, 1fr)); gap: 10px; }
            .visit-totals div { background: white; border: 1px solid #bfdbfe; border-radius: 10px; padding: 10px; }
            .visit-totals span { display: block; font-size: 11px; color: #475569; margin-bottom: 4px; }
            .visit-totals strong { font-size: 14px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 12px; vertical-align: top; }
            th { background: #f8fafc; color: #334155; }
            .empty-state { padding: 16px; border: 1px dashed #cbd5e1; border-radius: 10px; color: #64748b; }
            @media print {
              body { background: white; padding: 0; }
              .page { max-width: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <h1>Selihom Medical Clinic</h1>
              <p>Doctor Daily Work Report</p>
              <p>Date: ${dayDetails.date}</p>
            </div>
            ${summaryHtml}
            <h2 class="section-title">Patient Visit Breakdown</h2>
            ${visitBlocks}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
        <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-blue-100/60 blur-2xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: '#0C0E0B' }}>Doctor Daily Work</h2>
            <p className="mt-2 text-sm md:text-base" style={{ color: '#2e13d1' }}>
              Review your month at a glance, then open a day to inspect every patient and service in detail.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={fetchMonthly} className="btn btn-outline flex items-center gap-2" type="button">
              <RefreshCw className={`h-4 w-4 ${loadingMonthly ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={printDayReport} className="btn btn-primary flex items-center gap-2" type="button" disabled={!dayDetails}>
              <Printer className="h-4 w-4" /> Print Detailed Report
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <button className="btn btn-outline btn-sm" type="button" onClick={() => moveMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-lg font-semibold text-slate-900">
              <Calendar className="h-5 w-5 text-blue-600" /> {monthName} {year}
            </div>
            <p className="mt-2 text-xs text-slate-500">Click a date to open patient-by-patient service details.</p>
          </div>
          <button className="btn btn-outline btn-sm" type="button" onClick={() => moveMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="rounded-xl bg-slate-100 py-2 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarCells.map((cell) => {
            if (cell.kind === 'empty') {
              return <div key={cell.id} className="min-h-[105px] rounded-2xl border border-dashed border-slate-100 bg-slate-50/40" />;
            }

            const isSelected = cell.date === selectedDate;
            const hasActivity = cell.visits > 0 || cell.billedAmount > 0 || cell.collectedAmountByPaymentDate > 0;

            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => setSelectedDate(cell.date)}
                className={`min-h-[105px] rounded-2xl border p-3 text-left transition-all ${isSelected
                  ? 'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : hasActivity
                    ? 'border-blue-200 bg-gradient-to-br from-white to-blue-50 hover:border-blue-400 hover:shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <div className={`text-xs font-semibold ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>Day {cell.day}</div>
                <div className={`mt-2 text-lg font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{cell.visits}</div>
                <div className={`text-[11px] ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>visits</div>
                <div className={`mt-3 text-[11px] ${isSelected ? 'text-blue-50' : 'text-slate-600'}`}>Billed: {formatCurrency(cell.billedAmount || 0)}</div>
                <div className={`mt-1 text-[11px] ${isSelected ? 'text-blue-50' : 'text-slate-600'}`}>Collected: {formatCurrency(cell.collectedAmountByPaymentDate || 0)}</div>
              </button>
            );
          })}
        </div>
      </div>

      {monthlySummaryItems.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
            {monthlySummaryItems.map((item) => (
              <div key={item.label} className={`rounded-xl border px-3 py-2 ${item.tone}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{item.label}</p>
                <p className="mt-1 text-sm md:text-base font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-5">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Selected Day Detail</h3>
            <p className="text-sm text-slate-500">
              {selectedDate || 'Choose a day'}
            </p>
          </div>
          {selectedDaySummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-blue-700">Visits</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{selectedDaySummary.visits || 0}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-emerald-700">Billed</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(selectedDaySummary.billedAmount || 0)}</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-amber-700">Paid</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(selectedDaySummary.paidAmountByVisitDate || 0)}</p>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-violet-700">Collected</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(selectedDaySummary.collectedAmountByPaymentDate || 0)}</p>
              </div>
            </div>
          )}
        </div>

        {loadingDay ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            Loading day details...
          </div>
        ) : !dayDetails ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            No details found for this day.
          </div>
        ) : (
          <div className="space-y-5">
            {groupedSelectedVisits.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                No patient visits recorded for this date.
              </div>
            ) : (
              groupedSelectedVisits.map((visit, index) => (
                <div key={visit.groupKey} className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white to-slate-50 shadow-sm">
                  <div className="border-b border-blue-100 bg-blue-50/70 px-5 py-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Patient {index + 1}</p>
                      <h4 className="mt-1 text-xl font-bold text-slate-900">{visit.patientName}</h4>
                      <p className="mt-1 text-sm text-slate-600">
                        ID: {visit.patientId} | Visits: {visit.visitRefs.join(', ')} | Gender: {visit.patientGender} | Age: {visit.patientAge}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 min-w-[260px]">
                      <div className="rounded-2xl border border-white bg-white px-4 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Total Billed</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(visit.billedAmount)}</p>
                      </div>
                      <div className="rounded-2xl border border-white bg-white px-4 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Total Paid</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(visit.paidAmountByVisitDate)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">Services for this patient</p>
                      <p className="text-xs text-slate-500">{(visit.services || []).length} service(s)</p>
                    </div>

                    {(visit.services || []).length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                        No services found for this patient.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(visit.services || []).map((service, serviceIndex) => (
                          <div key={`${visit.groupKey}-${service.billingId || serviceIndex}-${serviceIndex}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{formatCategory(service.category)}</p>
                              <p className="mt-1 text-base font-semibold text-slate-900">{service.serviceName || 'Service'}</p>
                              <p className="mt-1 text-xs text-slate-500">Billing: {service.billingId || '-'}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-sm min-w-[280px]">
                              <div className="rounded-xl bg-slate-50 px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wide text-slate-500">Qty</p>
                                <p className="mt-1 font-bold text-slate-900">{service.quantity || 1}</p>
                              </div>
                              <div className="rounded-xl bg-slate-50 px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wide text-slate-500">Unit</p>
                                <p className="mt-1 font-bold text-slate-900">{formatCurrency(service.unitPrice || 0)}</p>
                              </div>
                              <div className="rounded-xl bg-slate-50 px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wide text-slate-500">Total</p>
                                <p className="mt-1 font-bold text-slate-900">{formatCurrency(service.totalPrice || 0)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDailyWork;
