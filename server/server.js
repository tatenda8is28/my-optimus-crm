// File: server/server.js
// This file correctly initializes the new architecture.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeWhatsAppService } = require('./services/whatsappService');
const { initializeWhatsAppClient } = require('./services/whatsappClient');
const { initializeWorker } = require('./services/outreachService');
const leadRoutes = require('./routes/leads');
const campaignRoutes = require('./routes/campaigns');
const eventRoutes = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use('/api/leads', leadRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/events', eventRoutes);

const startServer = async () => {
  try {
    console.log('Backend server starting...');
    
    const whatsappClient = initializeWhatsAppClient();
    initializeWhatsAppService(whatsappClient); 
    
    initializeWorker();

    app.listen(PORT, () => console.log(`🚀 Server is listening on port ${PORT}`));
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();