// File: server/services/whatsappClient.js
// This new file exclusively manages the WhatsApp client.

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const supabase = require('../config/supabaseClient');

let client;

const initializeWhatsAppClient = () => {
    client = new Client({ authStrategy: new LocalAuth(), puppeteer: { args: ['--no-sandbox'] } });
    client.on('qr', (qr) => qrcode.generate(qr, { small: true }));
    client.on('ready', () => console.log('✅ WhatsApp Client is ready!'));
    client.initialize().catch(err => console.error('Failed to initialize WhatsApp client:', err));
    return client;
};

const normalizePhoneNumber = (number) => {
    if (!number || typeof number !== 'string') return '';
    let digits = number.replace(/\D/g, '');
    if (digits.startsWith('0')) {
        digits = '27' + digits.substring(1);
    }
    return digits;
};

const sendMessage = async (toNumber, body) => {
    try {
        if (!client) throw new Error("WhatsApp client not initialized.");
        const normalizedNumber = normalizePhoneNumber(toNumber);
        const chatId = `${normalizedNumber}@c.us`;
        
        const sentMessage = await client.sendMessage(chatId, body);
        
        const { data: lead } = await supabase
            .from('leads')
            .select('*')
            .eq('phone_number', normalizedNumber)
            .single();

        if (lead) {
            const newMessage = {
                sender: 'bot',
                text: body,
                createdAt: new Date().toISOString(),
                whatsapp_message_id: sentMessage.id.id
            };
            const updatedHistory = [...(lead.conversation_history || []), newMessage];
            await supabase.from('leads').update({ conversation_history: updatedHistory }).eq('id', lead.id);
        }
        
        return sentMessage;
    } catch (error) {
        console.error(`Failed to send message to ${toNumber}:`, error.message);
        if (error.message.includes('jid is not on whatsapp')) {
            const normalizedNumber = normalizePhoneNumber(toNumber);
            await supabase
                .from('leads')
                .update({ 
                    agent_memory: { 
                        last_outreach_error: 'Failed: Phone number is not registered on WhatsApp.' 
                    } 
                })
                .eq('phone_number', normalizedNumber);
            console.log(`[Outreach Error] Marked lead ${normalizedNumber} as having no WhatsApp.`);
        }
        return null;
    }
};

module.exports = { initializeWhatsAppClient, sendMessage };