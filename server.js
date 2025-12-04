const express = require('express');
const axios = require('axios');

const cors = require('cors');

const app = express();

app.use(cors()); 

app.use(express.json());

require('dotenv').config();

const PORT = 8888;

const LINE_BOT_API = 'https://api.line.me/v2/bot';
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN; 

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
};

app.post('/send-message', async (req, res) => {
    try {
        
        const { userId, message } = req.body; 
        
        if (!userId || !message) {
            return res.status(400).json({ error: 'Missing userId or message in request body.' });
        }
        
        
        if (!LINE_CHANNEL_ACCESS_TOKEN) {
            console.error("LINE_CHANNEL_ACCESS_TOKEN is not set in .env file!");
            return res.status(500).json({ error: 'LINE Channel Access Token is missing.' });
        }


        const body = {
            to: userId, 
            messages: [
                {
                    type: 'text',
                    text: message 
                }
            ]
        };
        
    
        const response = await axios.post(
            `${LINE_BOT_API}/message/push`,
            body,
            { headers }
        );

        console.log('LINE API Response:', response.data);

        res.json({
            message: 'Send message success',
            responseData: response.data
        });
        
    } catch (error) {
        console.error('LINE API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ 
            message: 'Failed to send message to LINE', 
            errorDetail: error.response ? error.response.data : error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});