// File: server/routes/test.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient'); // Import our client

// A simple test route to verify database connection
router.get('/test-db', async (req, res) => {
    console.log('Attempting to fetch from campaigns table...');
    const { data, error } = await supabase.from('campaigns').select('*').limit(1);

    if (error) {
        console.error('Database connection error:', error);
        return res.status(500).json({ message: "Database connection failed.", error: error.message });
    }

    console.log('✅ Database connection successful.');
    res.status(200).json(data);
});

module.exports = router;