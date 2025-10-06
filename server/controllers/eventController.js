// File: server/controllers/eventController.js
const supabase = require('../config/supabaseClient');

exports.getAllEvents = async (req, res) => {
    const { data, error } = await supabase.from('events').select('*, leads(name)');
    if (error) return res.status(500).json({ message: 'Failed to fetch events.' });
    res.status(200).json(data);
};
exports.createEvent = async (req, res) => {
    const { data, error } = await supabase.from('events').insert(req.body).select().single();
    if (error) return res.status(500).json({ message: 'Failed to create event.' });
    res.status(201).json(data);
};
exports.updateEvent = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('events').update(req.body).eq('id', id).select().single();
    if (error) return res.status(500).json({ message: 'Failed to update event.' });
    res.status(200).json(data);
};
exports.deleteEvent = async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) return res.status(500).json({ message: 'Failed to delete event.' });
    res.status(200).json({ message: 'Event deleted.' });
};