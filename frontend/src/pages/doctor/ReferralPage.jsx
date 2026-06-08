import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Plus, Trash2, Building2, User, Info, Calendar, Printer, Edit2, ChevronRight } from 'lucide-react';
import api from '../../services/api';

const ReferralPage = () => {
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Patient search state
    const [patientSearchQuery, setPatientSearchQuery] = useState('');
    const [patientResults, setPatientResults] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isSearchingPatient, setIsSearchingPatient] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        id: null,
        patientId: '',
        visitId: '',
        referralReason: '',
        diagnosis: '',
        facilityName: '',
        doctorDetails: '',
        urgency: 'NORMAL',
        clinicalHistory: '',
        physicalExam: '',
        labInvestigation: '',
        imaging: '',
        treatmentGiven: '',
        region: '',
        zone: '',
        woreda: '',
        kebele: ''
    });

    const fetchReferrals = async () => {
        try {
            setLoading(true);
            const response = await api.get('/referrals/my');
            setReferrals(response.data.referrals || []);
        } catch (error) {
            console.error('Error fetching referrals:', error);
            toast.error('Failed to fetch referrals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReferrals();
    }, []);

    // Search patients as doctor types
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (patientSearchQuery.length >= 2) {
                searchPatients();
            } else {
                setPatientResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [patientSearchQuery]);

    const searchPatients = async () => {
        try {
            setIsSearchingPatient(true);
            const response = await api.get(`/patients/search?query=${patientSearchQuery}`);
            setPatientResults(response.data.patients || []);
        } catch (error) {
            console.error('Error searching patients:', error);
        } finally {
            setIsSearchingPatient(false);
        }
    };

    const handlePatientSelect = async (patient) => {
        setSelectedPatient(patient);
        setPatientSearchQuery(patient.name);
        setPatientResults([]);
        setFormData(prev => ({
            ...prev,
            patientId: patient.id,
            region: patient.region || '',
            zone: patient.zone || '',
            woreda: patient.woreda || '',
            kebele: patient.kebele || ''
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/referrals/${formData.id}`, formData);
                toast.success('Referral updated successfully');
            } else {
                await api.post('/referrals', formData);
                toast.success('Referral created successfully');
            }
            resetForm();
            fetchReferrals();
        } catch (error) {
            console.error('Error saving referral:', error);
            toast.error(error.response?.data?.message || 'Failed to save referral');
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setIsEditing(false);
        setSelectedPatient(null);
        setPatientSearchQuery('');
        setFormData({
            id: null,
            patientId: '',
            visitId: '',
            referralReason: '',
            diagnosis: '',
            facilityName: '',
            doctorDetails: '',
            urgency: 'NORMAL',
            clinicalHistory: '',
            physicalExam: '',
            labInvestigation: '',
            imaging: '',
            treatmentGiven: '',
            region: '',
            zone: '',
            woreda: '',
            kebele: ''
        });
    };

    const handleEdit = (referral) => {
        setSelectedPatient(referral.patient);
        setPatientSearchQuery(referral.patient.name);
        setFormData({
            id: referral.id,
            patientId: referral.patientId,
            visitId: referral.visitId || '',
            referralReason: referral.referralReason || '',
            diagnosis: referral.diagnosis || '',
            facilityName: referral.facilityName || '',
            doctorDetails: referral.doctorDetails || '',
            urgency: referral.urgency || 'NORMAL',
            clinicalHistory: referral.clinicalHistory || '',
            physicalExam: referral.physicalExam || '',
            labInvestigation: referral.labInvestigation || '',
            imaging: referral.imaging || '',
            treatmentGiven: referral.treatmentGiven || '',
            region: referral.region || referral.patient.region || '',
            zone: referral.zone || referral.patient.zone || '',
            woreda: referral.woreda || referral.patient.woreda || '',
            kebele: referral.kebele || referral.patient.kebele || ''
        });
        setIsEditing(true);
        setShowForm(true);
    };

    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const datePart = dateString.split('T')[0].split(' ')[0];
        const parts = datePart.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const day = parseInt(parts[2]);
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return months[month] + ' ' + day + ', ' + year;
        }
        const d = new Date(dateString);
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    };

    const handlePrint = async (id) => {
        try {
            const response = await api.get(`/referrals/${id}`);
            const referral = response.data.referral;

            if (!referral) {
                toast.error('Could not fetch referral details');
                return;
            }

            const printWindow = window.open('', '_blank');
            const currentDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Referral Form - ${referral.patient?.name}</title>
                    <style>
                        @media print {
                            @page { 
                                size: A4;
                                margin: 0;
                            }
                            body { margin: 0; padding: 0; }
                        }
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                            margin: 0; 
                            padding: 0;
                            color: #333;
                            line-height: 1.4;
                            background: white;
                        }
                        .container {
                            padding: 15mm 15mm;
                            min-height: 297mm;
                        }
                        .header { 
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            padding-bottom: 10px; 
                            margin-bottom: 15px; 
                            border-bottom: 3px solid #2563eb;
                        }
                        .header-left {
                            display: flex;
                            align-items: center;
                            gap: 15px;
                        }
                        .logo {
                            width: 80px;
                            height: 80px;
                            object-fit: contain;
                        }
                        .clinic-name { 
                            font-size: 28px; 
                            font-weight: 800; 
                            margin: 0;
                            color: #1e40af;
                        }
                        .clinic-tagline {
                            font-size: 13px;
                            color: #64748b;
                            margin: 0;
                            font-style: italic;
                        }
                        .report-title { 
                            font-size: 24px; 
                            font-weight: 700; 
                            color: #0f172a;
                            text-transform: uppercase;
                            text-align: right;
                        }
                        .patient-section {
                            margin: 20px 0;
                            padding: 15px;
                            background: #f8fafc;
                            border: 1px solid #e2e8f0;
                            border-radius: 8px;
                        }
                        .section-header {
                            font-size: 16px;
                            font-weight: 700;
                            margin-bottom: 12px;
                            color: #1e293b;
                            border-bottom: 1px solid #cbd5e1;
                            padding-bottom: 5px;
                            text-transform: uppercase;
                        }
                        .info-grid {
                            display: grid;
                            grid-template-columns: repeat(4, 1fr);
                            gap: 12px;
                        }
                        .info-item {
                            display: flex;
                            flex-direction: column;
                        }
                        .info-label {
                            font-weight: 600;
                            color: #64748b;
                            font-size: 11px;
                            text-transform: uppercase;
                        }
                        .info-value {
                            color: #1e293b;
                            font-weight: 700;
                            font-size: 14px;
                        }
                        .clinical-section {
                            margin: 15px 0;
                        }
                        .data-row {
                            margin-bottom: 10px;
                            page-break-inside: avoid;
                        }
                        .data-label {
                            font-size: 14px;
                            font-weight: 700;
                            color: #1e40af;
                            margin-bottom: 4px;
                            text-transform: uppercase;
                        }
                        .data-value {
                            font-size: 14px;
                            line-height: 1.6;
                            color: #334155;
                            padding: 8px 12px;
                            background: #fff;
                            border-left: 3px solid #e2e8f0;
                            white-space: pre-wrap;
                        }
                        .referral-main {
                            background: #fff;
                            border: 2px solid #2563eb;
                            padding: 15px;
                            border-radius: 8px;
                            margin: 20px 0;
                        }
                        .signature-section {
                            margin-top: 25px;
                            display: flex;
                            justify-content: space-between;
                        }
                        .sig-box {
                            text-align: center;
                            width: 200px;
                        }
                        .sig-line {
                            border-top: 2px solid #1e293b;
                            margin-top: 25px;
                            padding-top: 5px;
                            font-size: 12px;
                            font-weight: 700;
                        }
                        .stamp-circle {
                            width: 100px;
                            height: 100px;
                            border: 2px dashed #cbd5e1;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: #94a3b8;
                            font-size: 11px;
                            text-transform: uppercase;
                            font-weight: bold;
                        }
                        .footer {
                            margin-top: 15px;
                            text-align: center;
                            font-size: 10px;
                            color: #94a3b8;
                            border-top: 1px solid #e2e8f0;
                            padding-top: 10px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="header-left">
                                <img src="/selihom.jpg" alt="" class="logo" onerror="this.style.display='none'">
                                <div>
                                    <h1 class="clinic-name">Selihom Medical Clinic</h1>
                                    <p class="clinic-tagline">Quality Healthcare You Can Trust</p>
                                </div>
                            </div>
                            <div class="header-right">
                                <h2 class="report-title">Patient Referral Form</h2>
                                <div style="font-size: 12px; color: #64748b;">Date: ${formatDate(referral.createdAt)}</div>
                            </div>
                        </div>

                        <div class="patient-section">
                            <div class="section-header">Patient Information</div>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="info-label">Full Name</span>
                                    <span class="info-value">${referral.patient?.name}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Age / Sex</span>
                                    <span class="info-value">${calculateAge(referral.patient?.dob)} / ${referral.patient?.gender}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Card Number</span>
                                    <span class="info-value">#${referral.patientId}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Address</span>
                                    <span class="info-value">${referral.region || referral.patient?.region || ''}, ${referral.kebele || referral.patient?.kebele || ''}</span>
                                </div>
                            </div>
                        </div>

                        <div class="referral-main">
                            <div class="info-grid" style="grid-template-columns: 2fr 1fr 1fr;">
                                <div class="info-item">
                                    <span class="info-label">Referring To</span>
                                    <span class="info-value" style="font-size: 16px; color: #1e40af;">${referral.facilityName}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Urgency</span>
                                    <span class="info-value">${referral.urgency}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Attention Of</span>
                                    <span class="info-value">${referral.doctorDetails || 'On-duty Physician'}</span>
                                </div>
                            </div>
                        </div>

                        <div class="clinical-section">
                            ${referral.clinicalHistory ? `
                                <div class="data-row">
                                    <div class="data-label">Clinical History</div>
                                    <div class="data-value">${referral.clinicalHistory}</div>
                                </div>
                            ` : ''}
                            
                            ${referral.physicalExam ? `
                                <div class="data-row">
                                    <div class="data-label">Physical Examination</div>
                                    <div class="data-value">${referral.physicalExam}</div>
                                </div>
                            ` : ''}

                            <div class="info-grid" style="grid-template-columns: 1fr; margin: 10px 0; gap: 10px;">
                                ${referral.labInvestigation ? `
                                    <div class="data-row" style="margin-bottom: 5px;">
                                        <div class="data-label">Lab Findings</div>
                                        <div class="data-value">${referral.labInvestigation}</div>
                                    </div>
                                ` : ''}
                                ${referral.imaging ? `
                                    <div class="data-row" style="margin-bottom: 5px;">
                                        <div class="data-label">Imaging Result</div>
                                        <div class="data-value">${referral.imaging}</div>
                                    </div>
                                ` : ''}
                            </div>

                            <div class="data-row">
                                <div class="data-label" style="color: #ef4444;">Diagnosis</div>
                                <div class="data-value" style="font-weight: 700; border-left-color: #ef4444;">${referral.diagnosis}</div>
                            </div>

                            <div class="data-row">
                                <div class="data-label">Treatment Given</div>
                                <div class="data-value">${referral.treatmentGiven || 'N/A'}</div>
                            </div>

                            <div class="data-row" style="margin-top: 10px;">
                                <div class="data-label" style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">Reason for Referral</div>
                                <div class="data-value" style="font-weight: 600; font-style: italic;">${referral.referralReason}</div>
                            </div>
                        </div>

                        <div class="signature-section">
                            <div class="sig-box">
                                <div class="sig-line">Referring Physician</div>
                                <div style="font-size: 13px; margin-top: 5px;">Dr. ${referral.doctor?.fullname}${referral.doctor?.qualifications?.length ? ` - ${referral.doctor.qualifications.join(', ')}` : ''}</div>
                            </div>
                            <div class="stamp-circle">Clinic Stamp</div>
                        </div>

                        <div class="footer">
                            This is an official medical referral document from Selihom Medical Clinic.
                            <br>Generated on ${currentDate}
                        </div>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            };
                        };
                    </script>
                </body>
                </html>
            `;

            printWindow.document.write(printContent);
            printWindow.document.close();
        } catch (error) {
            console.error('Error printing referral:', error);
            toast.error('Failed to generate print document');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this referral?')) return;
        try {
            await api.delete(`/referrals/${id}`);
            toast.success('Referral deleted successfully');
            fetchReferrals();
        } catch (error) {
            console.error('Error deleting referral:', error);
            toast.error('Failed to delete referral');
        }
    };

    const filteredReferrals = referrals.filter(r =>
        r.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.facilityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: '#0C0E0B' }}>Refer Patient to Other Hospital</h1>
                    <p className="text-gray-600">Manage and track patient referrals to external facilities</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all shadow-sm hover:shadow-md"
                        style={{ backgroundColor: '#2e13d1' }}
                    >
                        <Plus className="w-5 h-5" /> New Referral
                    </button>
                )}
            </div>

            {showForm && (
                <div className="card bg-white p-6 rounded-xl shadow-md border border-gray-100 animate-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Building2 className="w-5 h-5" style={{ color: '#2e13d1' }} />
                            {isEditing ? 'Edit Referral' : 'New Referral Form'}
                        </h2>
                        <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Patient Selection Section */}
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="space-y-2 relative max-w-md">
                                <label className="text-sm font-medium text-gray-700">Search Patient (Name or ID)</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={patientSearchQuery}
                                        onChange={(e) => setPatientSearchQuery(e.target.value)}
                                        placeholder="Type patient name..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        disabled={isEditing}
                                    />
                                    {isSearchingPatient && (
                                        <div className="absolute right-3 top-2.5">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                        </div>
                                    )}
                                </div>

                                {patientResults.length > 0 && !selectedPatient && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {patientResults.map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => handlePatientSelect(p)}
                                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex justify-between items-center"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900">{p.name}</p>
                                                    <p className="text-xs text-gray-500">ID: {p.id}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Patient Address Details (Paper Layout) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Region</label>
                                <input name="region" value={formData.region} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Zone</label>
                                <input name="zone" value={formData.zone} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Woreda</label>
                                <input name="woreda" value={formData.woreda} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Kebele</label>
                                <input name="kebele" value={formData.kebele} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                        </div>

                        {/* Referral Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Target Facility Name</label>
                                <input
                                    type="text"
                                    name="facilityName"
                                    value={formData.facilityName}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Hospital Name"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Urgency Level</label>
                                <select
                                    name="urgency"
                                    value={formData.urgency}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="NORMAL">Normal</option>
                                    <option value="URGENT">Urgent</option>
                                    <option value="EMERGENCY">Emergency</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Doctor Details</label>
                                <input
                                    type="text"
                                    name="doctorDetails"
                                    value={formData.doctorDetails}
                                    onChange={handleInputChange}
                                    placeholder="Receiving Doctor/Dept"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Clinical Information (The big text areas) */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Clinical History</label>
                                    <textarea
                                        name="clinicalHistory"
                                        value={formData.clinicalHistory}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    ></textarea>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Physical Examination</label>
                                    <textarea
                                        name="physicalExam"
                                        value={formData.physicalExam}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Lab Investigation</label>
                                    <textarea
                                        name="labInvestigation"
                                        value={formData.labInvestigation}
                                        onChange={handleInputChange}
                                        rows="2"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    ></textarea>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Imaging</label>
                                    <textarea
                                        name="imaging"
                                        value={formData.imaging}
                                        onChange={handleInputChange}
                                        rows="2"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Diagnosis</label>
                                    <textarea
                                        name="diagnosis"
                                        value={formData.diagnosis}
                                        onChange={handleInputChange}
                                        required
                                        rows="2"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    ></textarea>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Treatment Given</label>
                                    <textarea
                                        name="treatmentGiven"
                                        value={formData.treatmentGiven}
                                        onChange={handleInputChange}
                                        rows="2"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Reason for Referral</label>
                                <textarea
                                    name="referralReason"
                                    value={formData.referralReason}
                                    onChange={handleInputChange}
                                    required
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-bold"
                                    placeholder="Why are you referring this patient?"
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-2 rounded-lg text-white shadow-md hover:shadow-lg transition-all"
                                style={{ backgroundColor: '#2e13d1' }}
                            >
                                {isEditing ? 'Update Referral' : 'Submit Referral'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!showForm && (
                <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search referrals by patient, facility, or diagnosis..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#2e13d1' }}></div>
                        </div>
                    ) : filteredReferrals.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No referrals found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredReferrals.map(referral => (
                                <div key={referral.id} className="card bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <User className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{referral.patient?.name}</h3>
                                                <p className="text-xs text-gray-500">ID: {referral.patientId}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEdit(referral)}
                                                className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handlePrint(referral.id)}
                                                className="p-1.5 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                                title="Print"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(referral.id)}
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-3 flex-1">
                                        <div className="flex items-start gap-2">
                                            <Building2 className="w-4 h-4 text-gray-400 mt-1" />
                                            <div>
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Facility</p>
                                                <p className="text-sm text-gray-800 font-medium">{referral.facilityName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Info className="w-4 h-4 text-gray-400 mt-1" />
                                            <div>
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Diagnosis</p>
                                                <p className="text-sm text-gray-700 line-clamp-2">{referral.diagnosis}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(referral.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${referral.urgency === 'EMERGENCY' ? 'bg-red-100 text-red-700' :
                                                referral.urgency === 'URGENT' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {referral.urgency}
                                            </span>
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-full uppercase">
                                                {referral.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReferralPage;
