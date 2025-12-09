const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// ไม่จำเป็นต้อง require('dotenv').config() บน Vercel
// Vercel จะดึง Environment Variables ให้เอง

app.use(cors()); 
app.use(express.json());

const LINE_BOT_API = 'https://api.line.me/v2/bot';
// Vercel จะดึงค่านี้มาให้โดยอัตโนมัติ
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN; 

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
};

// ... (ส่วนของ app.post('/send-message', ...) ยังคงเดิม) ...

app.post('/send-message', async (req, res) => {
    try {
        const { userId, message } = req.body; 
        
        if (!userId || !message) {
            return res.status(400).json({ error: 'Missing userId or message in request body.' });
        }
        
        if (!LINE_CHANNEL_ACCESS_TOKEN) {
            // หากค่าเป็น undefined ให้แสดง 500
            console.error("LINE_CHANNEL_ACCESS_TOKEN is not set in Vercel Environment!");
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

// ... (ส่วนของ app.post('/webhook', ...) ยังคงเดิม) ...

app.post('/webhook', async (req, res) => {
    const { events } = req.body;
    // ... (โค้ดภายใน /webhook) ...
    if (!events || events.length === 0) {
        return res.status(200).json({ message: 'OK - Test request received.' });
    }
    
    const replyPromises = events.map(async (event) => {
        if (event.type === 'message' && event.message.type === 'text') {
            
            const replyToken = event.replyToken;
            const userText = event.message.text;

            if (replyToken && replyToken !== '00000000000000000000000000000000') { 
                
                const replyBody = {
                    replyToken: replyToken,
                    messages: [
                        {
                            type: 'text',
                            text: `คุณพิมพ์ว่า: ${userText}`
                        }
                    ]
                };

                try {
                    await axios.post(
                        `${LINE_BOT_API}/message/reply`,
                        replyBody,
                        { headers }
                    );
                } catch (error) {
                    console.error('Webhook Reply API Error:', error.response ? error.response.data : error.message);
                }
            }
        }
    });

    await Promise.all(replyPromises);

    res.json({
        message: 'Webhook processed successfully'
    });
});


// **ส่วนนี้คือส่วนที่ต้องเปลี่ยนสำหรับ Vercel**
// ให้ลบ app.listen(PORT, ...) ออก
// และใช้ module.exports แทน

module.exports = app;