// File: server/controllers/leadController.js
// THIS IS THE FINAL, COMPLETE, AND FULLY-FEATURED FILE

const fs = require('fs');
const csv = require('csv-parser');
const supabase = require('../config/supabaseClient');

const toCamelCase = (lead) => {
    if (!lead) return null;
    return {
        id: lead.id,
        name: lead.name,
        phoneNumber: lead.phone_number,
        position: lead.position,
        company: lead.company,
        // --- FIX: Added the missing fields to the conversion ---
        numberOfListings: lead.number_of_listings,
        areasServiced: lead.areas_serviced,
        // --------------------------------------------------------
        pipelineStage: lead.pipeline_stage,
        outreachBatchDate: lead.outreach_batch_date,
        leadScore: lead.lead_score,
        intelTags: lead.intel_tags,
        conversationSummary: lead.conversation_summary,
        isOutbound: lead.is_outbound,
        createdAt: lead.created_at,
        campaignId: lead.campaign_id,
        conversationHistory: lead.conversation_history,
        agentMemory: lead.agent_memory,
    };
};

const normalizePhoneNumber = (number) => {
    if (!number || typeof number !== 'string') return '';
    let digits = number.replace(/\D/g, '');
    if (digits.startsWith('0')) {
        digits = '27' + digits.substring(1);
    }
    return digits;
};

exports.importLeads = async (req, res) => {
    const { campaignName } = req.body;
    if (!req.file) {
        return res.status(400).json({ message: "No CSV file was uploaded." });
    }
    const filePath = req.file.path;

    if (!campaignName || !filePath) {
        return res.status(400).json({ message: "Campaign name and a CSV file are required." });
    }

    try {
        const { data: campaign, error: campaignError } = await supabase
            .from('campaigns')
            .insert({ name: campaignName })
            .select()
            .single();

        if (campaignError) throw campaignError;

        const leadsToInsert = [];
        const stream = fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const phoneNumberRaw = row.number || row['agent-number'] || row['agent phone'];
                const message = row.message || row.hormozi_message;
                const phoneNumber = normalizePhoneNumber(phoneNumberRaw);
                
                if (phoneNumber && message) {
                    leadsToInsert.push({
                        name: row.name || row['agent name'] || row['agent-name'],
                        phone_number: phoneNumber,
                        position: row.position || row['agent title'] || row['agent-designation'],
                        
                        // --- THIS IS THE CRITICAL FIX ---
                        // It now correctly reads all possible column names for the missing data.
                        company: row.company || row['company name'],
                        number_of_listings: parseInt(row['number of listings'], 10) || 0,
                        areas_serviced: row['areas serviced'],
                        // ------------------------------------

                        conversation_history: [{
                            sender: 'bot',
                            text: message,
                            createdAt: new Date().toISOString(),
                            status: 'pending' 
                        }],
                        agent_memory: {},
                        campaign_id: campaign.id
                    });
                }
            });

        await new Promise((resolve, reject) => {
            stream.on('end', async () => {
                fs.unlinkSync(filePath); 
                try {
                    if (leadsToInsert.length > 0) {
                        const { error: leadsError } = await supabase
                            .from('leads')
                            .upsert(leadsToInsert, { onConflict: 'phone_number' });
                        
                        if (leadsError) return reject(leadsError);
                    }
                    resolve();
                } catch (dbError) {
                    reject(dbError);
                }
            });
            stream.on('error', (err) => {
                fs.unlinkSync(filePath);
                reject(err);
            });
        });

        res.status(201).json({ message: `${leadsToInsert.length} leads imported and queued for outreach successfully.` });

    } catch (error) {
        console.error("Error during import process:", error);
        res.status(500).json({ message: 'An error occurred during import.', error: error.message });
    }
};

exports.getAllLeads = async (req, res) => {
    const { type } = req.query;
    try {
        let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
        if (type === 'outbound') { query = query.not('campaign_id', 'is', null); } 
        else if (type === 'inbound') { query = query.is('campaign_id', null); }
        const { data, error } = await query;
        if (error) throw error;
        const camelCaseData = data.map(toCamelCase);
        res.status(200).json(camelCaseData);
    } catch (error) {
        console.error("Error fetching leads:", error);
        return res.status(500).json({ message: "Failed to fetch leads.", error: error.message });
    }
};

exports.getLeadById = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ message: 'Lead not found.' });
    res.status(200).json(toCamelCase(data));
};

exports.updateLeadStage = async (req, res) => {
    const { id } = req.params;
    const { newStage } = req.body;
    const { data, error } = await supabase.from('leads').update({ pipeline_stage: newStage }).eq('id', id);
    if (error) return res.status(500).json({ message: 'Failed to update lead stage.' });
    res.status(200).json(data);
};

exports.deleteLead = async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) return res.status(500).json({ message: 'Failed to delete lead.' });
    res.status(200).json({ success: true });
};