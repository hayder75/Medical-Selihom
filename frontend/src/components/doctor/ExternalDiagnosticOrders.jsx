import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Edit2, FilePlus2, Printer, Save, Trash2, X } from 'lucide-react';
import api from '../../services/api';

const buildInitialForm = (requestedByName = '') => ({
  requestedByName,
  examinations: [''],
  relevantClinicalData: '',
  diagnosis: ''
});

const normalizeRequestedBy = (currentUser) => {
  return String(currentUser?.fullname || currentUser?.username || '').trim();
};

const calculateAge = (dob) => {
  if (!dob) return 'N/A';
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return 'N/A';

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
};

const getDoctorQualificationLabel = (doctorData) => {
  const role = String(doctorData?.role || '').toUpperCase();
  const qualifications = Array.isArray(doctorData?.qualifications)
    ? doctorData.qualifications
    : [];
  const normalizedQualifications = qualifications.map((q) => String(q || '').toUpperCase());

  const isHealthOfficer =
    role.includes('HEALTH_OFFICER') ||
    role === 'HO' ||
    normalizedQualifications.some((q) => q.includes('HEALTH OFFICER') || q.includes('HEALTH_OFFICER') || q === 'HO');

  if (isHealthOfficer) return 'Health Officer (HO)';

  if (role.includes('DERM') || normalizedQualifications.some((q) => q.includes('DERM'))) {
    return 'Dermato-venereologist';
  }

  return qualifications.join(', ') || 'General Practitioner';
};

const getDoctorDisplayName = (doctorData, fallbackName = '') => {
  const rawName = String(
    doctorData?.fullname || doctorData?.fullName || doctorData?.name || fallbackName || ''
  ).trim();
  if (!rawName) return 'Attending Doctor';

  const role = String(doctorData?.role || '').toUpperCase();
  const qualifications = Array.isArray(doctorData?.qualifications)
    ? doctorData.qualifications
    : [];
  const normalizedQualifications = qualifications.map((q) => String(q || '').toUpperCase());
  const isHealthOfficer =
    role.includes('HEALTH_OFFICER') ||
    role === 'HO' ||
    normalizedQualifications.some((q) => q.includes('HEALTH OFFICER') || q.includes('HEALTH_OFFICER') || q === 'HO');

  if (/^(dr|mr)\.?\s+/i.test(rawName)) return rawName;
  return isHealthOfficer ? `Mr. ${rawName}` : `Dr. ${rawName}`;
};

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const ExternalDiagnosticOrders = ({
  type,
  visitId,
  patient,
  currentUser,
  orders,
  onUpdated,
  disabled = false
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(() => buildInitialForm(normalizeRequestedBy(currentUser)));

  const typeLabel = type === 'RADIOLOGY' ? 'Radiology' : 'Lab';
  const sectionTitle = `External ${typeLabel} Orders`;
  const patientAge = patient?.age || (patient?.dob ? calculateAge(patient.dob) : 'N/A');
  const currentDate = new Date().toLocaleDateString();

  const filteredOrders = useMemo(
    () => (Array.isArray(orders) ? orders.filter((item) => item.type === type) : []),
    [orders, type]
  );

  useEffect(() => {
    if (!editingOrderId) {
      setForm(buildInitialForm(normalizeRequestedBy(currentUser)));
    }
  }, [currentUser, editingOrderId]);

  const resetForm = () => {
    setEditingOrderId(null);
    setForm(buildInitialForm(normalizeRequestedBy(currentUser)));
    setIsFormOpen(false);
  };

  const openCreateForm = () => {
    setEditingOrderId(null);
    setForm(buildInitialForm(normalizeRequestedBy(currentUser)));
    setIsFormOpen(true);
  };

  const openEditForm = (order) => {
    setEditingOrderId(order.id);
    setForm({
      requestedByName: order.requestedByName || normalizeRequestedBy(currentUser),
      examinations: Array.isArray(order.examinations) && order.examinations.length > 0 ? order.examinations : [''],
      relevantClinicalData: order.relevantClinicalData || '',
      diagnosis: order.diagnosis || ''
    });
    setIsFormOpen(true);
  };

  const updateExamLine = (index, value) => {
    setForm((prev) => ({
      ...prev,
      examinations: prev.examinations.map((item, itemIndex) => (itemIndex === index ? value : item))
    }));
  };

  const addExamLine = () => {
    setForm((prev) => ({
      ...prev,
      examinations: [...prev.examinations, '']
    }));
  };

  const removeExamLine = (index) => {
    setForm((prev) => {
      const next = prev.examinations.filter((_, itemIndex) => itemIndex !== index);
      return {
        ...prev,
        examinations: next.length > 0 ? next : ['']
      };
    });
  };

  const submitForm = async (event) => {
    event.preventDefault();

    const examinations = form.examinations.map((item) => item.trim()).filter(Boolean);
    if (!examinations.length) {
      toast.error('Add at least one examination');
      return;
    }

    const payload = {
      type,
      requestedByName: form.requestedByName.trim(),
      examinations,
      relevantClinicalData: form.relevantClinicalData.trim(),
      diagnosis: form.diagnosis.trim()
    };

    if (!payload.requestedByName) {
      toast.error('Requested by is required');
      return;
    }

    try {
      setIsSaving(true);
      if (editingOrderId) {
        await api.patch(`/doctors/external-diagnostic-orders/${editingOrderId}`, payload);
        toast.success(`External ${typeLabel.toLowerCase()} order updated`);
      } else {
        await api.post(`/doctors/visits/${visitId}/external-diagnostic-orders`, payload);
        toast.success(`External ${typeLabel.toLowerCase()} order created`);
      }
      resetForm();
      await onUpdated?.();
    } catch (error) {
      console.error(`Error saving external ${typeLabel.toLowerCase()} order:`, error);
      toast.error(error.response?.data?.error || `Failed to save external ${typeLabel.toLowerCase()} order`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (order) => {
    if (!window.confirm(`Delete this external ${typeLabel.toLowerCase()} order?`)) return;

    try {
      await api.delete(`/doctors/external-diagnostic-orders/${order.id}`);
      toast.success(`External ${typeLabel.toLowerCase()} order deleted`);
      await onUpdated?.();
    } catch (error) {
      console.error(`Error deleting external ${typeLabel.toLowerCase()} order:`, error);
      toast.error(error.response?.data?.error || `Failed to delete external ${typeLabel.toLowerCase()} order`);
    }
  };

  const printOrder = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Unable to open print window');
      return;
    }

    const examLines = (order.examinations || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const patientName = String(patient?.name || '').toUpperCase() || 'N/A';
    const requestedBy = escapeHtml(order.requestedByName || normalizeRequestedBy(currentUser) || 'N/A');
    const doctorData = order?.doctor || currentUser || {};
    const printableDoctorName = getDoctorDisplayName(doctorData, order.requestedByName || normalizeRequestedBy(currentUser));
    const printableDoctorQualification = getDoctorQualificationLabel(doctorData);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>External ${escapeHtml(typeLabel)} Order</title>
          <style>
            @media print { @page { size: A4; margin: 10mm; } }
            body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 0; padding: 16px; color: #1f2937; }
            .header { text-align: center; margin-bottom: 18px; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
            .clinic-name { font-size: 20px; font-weight: 700; color: #1e40af; }
            .form-title { font-size: 15px; margin-top: 4px; }
            .section { margin-bottom: 14px; }
            .section-title { font-size: 13px; font-weight: 700; color: #1e40af; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-bottom: 8px; }
            .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 16px; font-size: 12px; }
            .info-label { font-weight: 600; color: #4b5563; }
            .exam-list { margin: 0; padding-left: 18px; }
            .exam-list li { margin: 6px 0; padding: 6px 8px; background: #f8fafc; border-left: 3px solid #2563eb; list-style: decimal; }
            .text-box { min-height: 70px; padding: 10px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 4px; white-space: pre-wrap; font-size: 12px; }
            .footer { margin-top: 14px; border-top: 1px solid #d1d5db; padding-top: 10px; font-size: 12px; display: flex; justify-content: space-between; gap: 16px; }
            .footer-right { min-width: 120px; text-align: center; }
            .signature-line { border-top: 1px solid #374151; margin-top: 28px; padding-top: 4px; }
            .no-print { text-align: center; margin-top: 20px; }
            .no-print button { padding: 8px 18px; background: #2563eb; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">Selihom Medical Clinic</div>
            <div class="form-title">External ${escapeHtml(typeLabel)} Order Form</div>
          </div>

          <div class="section">
            <div class="section-title">Patient Information</div>
            <div class="info-grid">
              <div><span class="info-label">Name:</span> ${escapeHtml(patientName)}</div>
              <div><span class="info-label">Patient ID:</span> ${escapeHtml(patient?.id || 'N/A')}</div>
              <div><span class="info-label">Age:</span> ${escapeHtml(patientAge)}</div>
              <div><span class="info-label">Sex:</span> ${escapeHtml(patient?.gender || 'N/A')}</div>
              <div><span class="info-label">Requested By:</span> ${requestedBy}</div>
              <div><span class="info-label">Date:</span> ${escapeHtml(new Date(order.createdAt || Date.now()).toLocaleDateString())}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Examinations Required</div>
            <ol class="exam-list">${examLines || '<li>N/A</li>'}</ol>
          </div>

          <div class="section">
            <div class="section-title">Relevant Clinical Data</div>
            <div class="text-box">${escapeHtml(order.relevantClinicalData || '')}</div>
          </div>

          <div class="section">
            <div class="section-title">Diagnosis</div>
            <div class="text-box">${escapeHtml(order.diagnosis || '')}</div>
          </div>

          <div class="footer">
            <div>
              Prescribed by: <strong>${escapeHtml(printableDoctorName)}</strong><br>
              ${escapeHtml(printableDoctorQualification)}
            </div>
            <div class="footer-right">
              <div class="signature-line">Signature</div>
            </div>
          </div>

          <div class="no-print">
            <button onclick="window.print()">Print</button>
            <button onclick="window.close()" style="margin-left:10px;background:#4b5563;">Close</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="border rounded-xl p-4 bg-slate-50 mb-6" style={{ borderColor: '#E5E7EB' }}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h4 className="text-base font-semibold" style={{ color: '#0C0E0B' }}>{sectionTitle}</h4>
          <p className="text-sm text-gray-600">Create, edit, delete, and print external {typeLabel.toLowerCase()} orders without billing.</p>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: '#2563EB' }}
          >
            <FilePlus2 className="h-4 w-4" />
            External
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={submitForm} className="border rounded-xl p-4 bg-white mb-4" style={{ borderColor: '#DBEAFE' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
            <div className="p-3 rounded-lg bg-slate-50 border" style={{ borderColor: '#E5E7EB' }}>
              <span className="font-semibold text-gray-700">Patient Name:</span> <span className="font-bold">{String(patient?.name || 'N/A').toUpperCase()}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border" style={{ borderColor: '#E5E7EB' }}>
              <span className="font-semibold text-gray-700">Patient ID:</span> {patient?.id || 'N/A'}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border" style={{ borderColor: '#E5E7EB' }}>
              <span className="font-semibold text-gray-700">Age:</span> {patientAge}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border" style={{ borderColor: '#E5E7EB' }}>
              <span className="font-semibold text-gray-700">Sex:</span> {patient?.gender || 'N/A'}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border md:col-span-2" style={{ borderColor: '#E5E7EB' }}>
              <span className="font-semibold text-gray-700">Date:</span> {currentDate}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Requested By</label>
            <input
              type="text"
              value={form.requestedByName}
              onChange={(event) => setForm((prev) => ({ ...prev, requestedByName: event.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              style={{ borderColor: '#D1D5DB' }}
              placeholder="Doctor name"
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Examinations Required</label>
              <button
                type="button"
                onClick={addExamLine}
                className="text-sm font-medium text-blue-700 hover:text-blue-900"
              >
                + Add line
              </button>
            </div>
            <div className="space-y-2">
              {form.examinations.map((examination, index) => (
                <div key={`${index}-${editingOrderId || 'new'}`} className="flex gap-2">
                  <input
                    type="text"
                    value={examination}
                    onChange={(event) => updateExamLine(index, event.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg"
                    style={{ borderColor: '#D1D5DB' }}
                    placeholder={`${typeLabel} examination ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeExamLine(index)}
                    className="px-3 py-2 rounded-lg border text-red-700 hover:bg-red-50"
                    style={{ borderColor: '#FECACA' }}
                    disabled={form.examinations.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Relevant Clinical Data</label>
            <textarea
              value={form.relevantClinicalData}
              onChange={(event) => setForm((prev) => ({ ...prev, relevantClinicalData: event.target.value }))}
              className="w-full px-3 py-2 border rounded-lg min-h-[100px]"
              style={{ borderColor: '#D1D5DB' }}
              placeholder="Relevant clinical data"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
            <textarea
              value={form.diagnosis}
              onChange={(event) => setForm((prev) => ({ ...prev, diagnosis: event.target.value }))}
              className="w-full px-3 py-2 border rounded-lg min-h-[100px]"
              style={{ borderColor: '#D1D5DB' }}
              placeholder="Diagnosis"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-60"
              style={{ backgroundColor: '#059669' }}
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : editingOrderId ? 'Update External Order' : 'Save External Order'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-gray-700"
              style={{ borderColor: '#D1D5DB' }}
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </form>
      )}

      {filteredOrders.length === 0 ? (
        <div className="text-sm text-gray-500 italic">No external {typeLabel.toLowerCase()} orders saved for this visit.</div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div key={order.id} className="border rounded-xl bg-white p-4" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">External {typeLabel}</span>
                    <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2"><span className="font-semibold">Requested By:</span> {order.requestedByName || 'N/A'}</p>
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-gray-700">Examinations Required</p>
                    <ul className="mt-1 space-y-1 text-sm text-gray-700 list-disc list-inside">
                      {(order.examinations || []).map((item, index) => (
                        <li key={`${order.id}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  {order.relevantClinicalData && (
                    <p className="text-sm text-gray-700 mb-2"><span className="font-semibold">Relevant Clinical Data:</span> {order.relevantClinicalData}</p>
                  )}
                  {order.diagnosis && (
                    <p className="text-sm text-gray-700"><span className="font-semibold">Diagnosis:</span> {order.diagnosis}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => printOrder(order)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-blue-700 hover:bg-blue-50"
                    style={{ borderColor: '#BFDBFE' }}
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </button>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => openEditForm(order)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-amber-700 hover:bg-amber-50"
                      style={{ borderColor: '#FDE68A' }}
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleDelete(order)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-red-700 hover:bg-red-50"
                      style={{ borderColor: '#FECACA' }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExternalDiagnosticOrders;