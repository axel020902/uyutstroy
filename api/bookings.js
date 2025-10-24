// API для работы с бронированиями
// Используется Vercel KV для хранения данных
// Если нет Vercel KV, данные хранятся в памяти

// Временное хранилище в памяти
let bookingsCache = [];

// Функция для получения бронирований из KV или памяти
async function getBookings(kv) {
    try {
        if (kv) {
            const stored = await kv.get('bookings');
            if (stored) {
                return stored;
            }
        }
        return bookingsCache;
    } catch (error) {
        console.error('Ошибка получения бронирований:', error);
        return bookingsCache;
    }
}

// Функция для сохранения бронирований в KV или память
async function saveBookings(kv, bookings) {
    try {
        if (kv) {
            await kv.set('bookings', bookings);
        } else {
            bookingsCache = bookings;
        }
        return true;
    } catch (error) {
        console.error('Ошибка сохранения бронирований:', error);
        return false;
    }
}

// Валидация бронирования
function validateBooking(booking) {
    if (!booking.name || typeof booking.name !== 'string' || booking.name.trim().length < 2) {
        return { valid: false, error: 'Имя должно содержать минимум 2 символа' };
    }
    
    if (!booking.phone || typeof booking.phone !== 'string' || booking.phone.length < 10) {
        return { valid: false, error: 'Неверный формат телефона' };
    }
    
    if (!booking.date || typeof booking.date !== 'string') {
        return { valid: false, error: 'Не указана дата бронирования' };
    }
    
    // Проверка что дата не в прошлом
    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
        return { valid: false, error: 'Нельзя забронировать дату в прошлом' };
    }
    
    return { valid: true };
}

// Sanitize HTML
function sanitize(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Получаем KV если доступен
    let kv = null;
    try {
        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
            const vercelKv = require('@vercel/kv');
            kv = vercelKv.kv;
        }
    } catch (e) {
        console.log('Vercel KV недоступен, используется память');
    }
    
    // GET - получить все бронирования
    if (req.method === 'GET') {
        try {
            const bookings = await getBookings(kv);
            
            // Если запрос с параметром ?all=true, возвращаем все бронирования (для админ-панели)
            const showAll = req.query && req.query.all === 'true';
            
            // Для обычных пользователей (календарь) возвращаем только активные
            const filteredBookings = showAll ? bookings : bookings.filter(b => b.status !== 'cancelled');
            
            return res.status(200).json({
                success: true,
                bookings: filteredBookings,
                count: filteredBookings.length
            });
        } catch (error) {
            console.error('Ошибка GET /api/bookings:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка получения бронирований'
            });
        }
    }
    
    // POST - добавить новое бронирование
    if (req.method === 'POST') {
        try {
            const { name, phone, date } = req.body;
            
            // Валидация
            const validation = validateBooking({ name, phone, date });
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    error: validation.error
                });
            }
            
            // Проверяем, нет ли уже бронирования на эту дату
            const bookings = await getBookings(kv);
            const existingBooking = bookings.find(b => 
                b.date === date && b.status !== 'cancelled'
            );
            
            if (existingBooking) {
                return res.status(409).json({
                    success: false,
                    error: 'Эта дата уже забронирована'
                });
            }
            
            // Создаём новое бронирование
            const newBooking = {
                id: 'booking_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: sanitize(name.trim()),
                phone: sanitize(phone.trim()),
                date: date,
                createdAt: new Date().toISOString(),
                status: 'active'
            };
            
            // Добавляем новое бронирование
            bookings.push(newBooking);
            
            // Сохраняем
            const saved = await saveBookings(kv, bookings);
            
            if (!saved) {
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка сохранения бронирования'
                });
            }
            
            return res.status(201).json({
                success: true,
                message: 'Бронирование успешно создано',
                booking: newBooking
            });
            
        } catch (error) {
            console.error('Ошибка POST /api/bookings:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка создания бронирования'
            });
        }
    }
    
    // DELETE - удалить бронирование или все бронирования
    if (req.method === 'DELETE') {
        try {
            const { id, deleteAll } = req.body;
            
            // Удалить все бронирования
            if (deleteAll === true) {
                await saveBookings(kv, []);
                
                return res.status(200).json({
                    success: true,
                    message: 'Все бронирования успешно удалены'
                });
            }
            
            // Удалить конкретное бронирование (отменить)
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Не указан ID бронирования'
                });
            }
            
            // Получаем существующие бронирования
            const bookings = await getBookings(kv);
            
            // Находим бронирование
            const bookingIndex = bookings.findIndex(b => b.id === id);
            
            if (bookingIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Бронирование не найдено'
                });
            }
            
            // Помечаем как отмененное вместо удаления
            bookings[bookingIndex].status = 'cancelled';
            bookings[bookingIndex].cancelledAt = new Date().toISOString();
            
            // Сохраняем
            const saved = await saveBookings(kv, bookings);
            
            if (!saved) {
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка отмены бронирования'
                });
            }
            
            return res.status(200).json({
                success: true,
                message: 'Бронирование успешно отменено'
            });
            
        } catch (error) {
            console.error('Ошибка DELETE /api/bookings:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка удаления бронирования'
            });
        }
    }
    
    // Метод не поддерживается
    return res.status(405).json({
        success: false,
        error: 'Метод не поддерживается'
    });
};

