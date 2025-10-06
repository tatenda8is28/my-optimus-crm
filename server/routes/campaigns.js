// File: server/routes/campaigns.js
const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

router.get('/', campaignController.getAllCampaigns);
router.post('/:campaignId/start-outreach', campaignController.startOutreach);
router.delete('/:id', campaignController.deleteCampaign);

module.exports = router;