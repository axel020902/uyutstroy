// Vercel Serverless Function для отправки в Telegram

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const botToken = '8050200832:AAH5ScyG__5FCxX9_nEDdU0QrRCGvXlIU58';
    const chatId = '-1003143740246';

    try {
        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });

        const data = await response.json();

        if (data.ok) {
            return res.status(200).json({ success: true, message_id: data.result?.message_id });
        } else {
            return res.status(500).json({ 
                success: false, 
                error: data.description || 'Telegram API error'
            });
        }
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal server error' 
        });
    }
}
