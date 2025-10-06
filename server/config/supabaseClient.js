// File: server/config/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials are not loaded. Check your .env file.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;