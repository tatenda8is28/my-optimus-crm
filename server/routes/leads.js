// File: server/routes/leads.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const leadController = require('../controllers/leadController');
const upload = multer({ dest: 'uploads/' });

router.post('/import', upload.single('leadFile'), leadController.importLeads);
router.get('/', leadController.getAllLeads);
router.get('/:id', leadController.getLeadById);
router.put('/:id/stage', leadController.updateLeadStage);
router.delete('/:id', leadController.deleteLead);

module.exports = router;