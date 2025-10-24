// Простая тестовая функция для проверки API
module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    return res.status(200).json({
        success: true,
        message: 'API работает!',
        timestamp: new Date().toISOString()
    });
};

