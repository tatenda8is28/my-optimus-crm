// File: server/controllers/campaignController.js
const supabase = require('../config/supabaseClient');

exports.getAllCampaigns = async (req, res) => {
    const { data, error } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
    if (error) {
        return res.status(500).json({ message: "Failed to fetch campaigns.", error: error.message });
    }
    res.status(200).json(data);
};

exports.startOutreach = async (req, res) => {
    const { campaignId } = req.params;
    try {
        const { error } = await supabase.from('campaigns').update({ status: 'Queued' }).eq('id', campaignId);
        if (error) throw error;
        res.status(202).json({ message: `Campaign has been queued for outreach.` });
    } catch (error) {
        res.status(500).json({ message: 'Server error during outreach queueing.', error: error.message });
    }
};

exports.deleteCampaign = async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) {
        return res.status(500).json({ message: 'Server error while deleting campaign.', error: error.message });
    }
    res.status(200).json({ success: true, message: 'Campaign and its leads deleted.' });
};