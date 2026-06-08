const express = require('express');
const adminController = require('../controllers/adminController');
const systemSettingsController = require('../controllers/systemSettingsController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();

// User Management
router.post('/users', adminController.createUser);
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/password', adminController.updateUserPassword);

// Service Management
router.post('/services', adminController.createService);
router.get('/services', adminController.getServices);
router.put('/services/:id', adminController.updateService);
router.delete('/services/:id', adminController.deleteService);

// Nurse Management
router.get('/nurses', adminController.getNurses);

// Insurance Management
router.post('/insurances', adminController.createInsurance);
router.get('/insurances', adminController.getInsurances);
router.put('/insurances/:id', adminController.updateInsurance);
router.delete('/insurances/:id', adminController.deleteInsurance);

// Investigation Types Management
router.post('/investigation-types', adminController.createInvestigationType);
router.get('/investigation-types', adminController.getInvestigationTypes);

// Lab Test Management (New System)
router.post('/lab-test-groups', adminController.createLabTestGroup);
router.get('/lab-test-groups', adminController.getLabTestGroups);
router.put('/lab-test-groups/:id', adminController.updateLabTestGroup);
router.delete('/lab-test-groups/:id', adminController.deleteLabTestGroup);

router.post('/lab-tests', adminController.createLabTest);
router.get('/lab-tests', adminController.getLabTests);
router.get('/lab-tests/for-ordering', adminController.getLabTestsForOrdering);
router.get('/lab-tests/:id', adminController.getLabTest);
router.put('/lab-tests/:id', adminController.updateLabTest);
router.delete('/lab-tests/:id', adminController.deleteLabTest);

// Inventory Management
router.post('/inventory', adminController.createInventoryItem);
router.get('/inventory', adminController.getInventory);
router.put('/inventory/:id', adminController.updateInventoryItem);

// Billing Overview
router.get('/billing-overview', adminController.getBillingOverview);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

// Dashboard Stats
router.get('/dashboard-stats', auth, roleGuard(['ADMIN']), adminController.getDashboardStats);

// Reports
router.get('/reports/daily', adminController.getDailyReport);
router.get('/reports/weekly', adminController.getWeeklyReport);
router.get('/reports/revenue', adminController.getRevenueReport);
router.get('/reports/revenue-stats', adminController.getRevenueStats);
router.get('/reports/daily-breakdown', adminController.getDailyBreakdown);
router.post('/reports/export-excel', adminController.exportFinancialReportExcel);
router.post('/reports/export-pdf', adminController.exportFinancialReportPDF);

// Doctor Performance
router.get('/reports/doctor-performance', adminController.getDoctorPerformanceStats);
router.get('/reports/doctor-daily-breakdown', adminController.getDoctorDailyBreakdown);
router.get('/reports/doctor-day-details', adminController.getDoctorDayProcedureDetails);

// Billing Performance
router.get('/reports/billing-performance', adminController.getBillingPerformanceStats);
router.get('/reports/billing-daily-breakdown', adminController.getBillingUserDailyBreakdown);
router.get('/reports/billing-day-details', adminController.getBillingUserDayDetails);

// Nurse Performance
router.get('/reports/nurse-performance', adminController.getNursePerformanceStats);
router.get('/reports/nurse-daily-breakdown', adminController.getNurseDailyBreakdown);
router.get('/reports/nurse-day-details', adminController.getNurseDayDetails);

// System Settings
router.get('/system-settings', systemSettingsController.getSystemSettings);
router.get('/system-settings/:key', systemSettingsController.getSetting);
router.put('/system-settings/:key', systemSettingsController.updateSetting);

// Patient Management
router.get('/patients', adminController.getAllPatients);
router.delete('/patients/bulk', adminController.deleteMultiplePatients);
router.delete('/patients/:patientId', adminController.deletePatient);
router.put('/patients/:patientId/complete-visit', adminController.completePatientVisits);

module.exports = router;
