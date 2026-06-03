const express = require('express');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const visitController = require('../controllers/visitController');

const router = express.Router();

// Visit management routes
router.post('/', visitController.createVisit);
router.put('/:visitId', visitController.updateVisit);
router.get('/uid/:visitUid', visitController.getVisitByUid);
router.post('/complete', visitController.completeVisit);
router.get('/patient/:patientId', visitController.getPatientVisits);
router.get('/status/:status', visitController.getVisitsByStatus);

// Billing/Admin: get active visit for a patient
router.get('/patient/:patientId/active', auth, roleGuard(['ADMIN', 'BILLING_OFFICER', 'RECEPTIONIST', 'DOCTOR']), visitController.getPatientActiveVisit);

// Billing/Admin: complete a patient's active visit
router.post('/patient/:patientId/complete-active', auth, roleGuard(['ADMIN', 'BILLING_OFFICER', 'RECEPTIONIST', 'DOCTOR']), visitController.completePatientActiveVisit);

module.exports = router;
