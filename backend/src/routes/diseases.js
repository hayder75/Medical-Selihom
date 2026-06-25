const express = require('express');
const router = express.Router();
const diseaseController = require('../controllers/diseaseController');
const authMiddleware = require('../middleware/auth');

// List all diseases (with pagination and search)
router.get('/', authMiddleware, diseaseController.getAllDiseases);

// Search diseases
router.get('/search', authMiddleware, diseaseController.searchDiseases);

// Create new disease (for custom diseases)
router.post('/', authMiddleware, diseaseController.createDisease);

// Reports
router.get('/reports', authMiddleware, diseaseController.getDiseaseReport);
router.get('/age-gender-distribution', authMiddleware, diseaseController.getAgeGenderDistribution);

// Diagnosis Management
router.post('/diagnosis', authMiddleware, diseaseController.addPatientDiagnosis);
router.get('/diagnosis/:visitId', authMiddleware, diseaseController.getVisitDiagnoses);
router.delete('/diagnosis/:diagnosisId', authMiddleware, diseaseController.deletePatientDiagnosis);

module.exports = router;
