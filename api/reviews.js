// API для работы с отзывами
// Используется Vercel KV для хранения данных
// Если нет Vercel KV, данные хранятся в памяти (сбрасываются при перезапуске)

// Временное хранилище в памяти (будет работать пока функция активна)
let reviewsCache = [];

// Функция для получения отзывов из KV или памяти
async function getReviews(kv) {
    try {
        if (kv) {
            const stored = await kv.get('reviews');
            if (stored) {
                return stored;
            }
        }
        return reviewsCache;
    } catch (error) {
        console.error('Ошибка получения отзывов:', error);
        return reviewsCache;
    }
}

// Функция для сохранения отзывов в KV или память
async function saveReviews(kv, reviews) {
    try {
        if (kv) {
            await kv.set('reviews', reviews);
        } else {
            reviewsCache = reviews;
        }
        return true;
    } catch (error) {
        console.error('Ошибка сохранения отзывов:', error);
        return false;
    }
}

// Валидация отзыва
function validateReview(review) {
    if (!review.name || typeof review.name !== 'string' || review.name.trim().length < 2) {
        return { valid: false, error: 'Имя должно содержать минимум 2 символа' };
    }
    
    if (!review.rating || typeof review.rating !== 'number' || review.rating < 1 || review.rating > 5) {
        return { valid: false, error: 'Рейтинг должен быть от 1 до 5' };
    }
    
    if (!review.text || typeof review.text !== 'string' || review.text.trim().length < 10) {
        return { valid: false, error: 'Текст отзыва должен содержать минимум 10 символов' };
    }
    
    if (review.name.length > 100) {
        return { valid: false, error: 'Имя слишком длинное (максимум 100 символов)' };
    }
    
    if (review.text.length > 1000) {
        return { valid: false, error: 'Текст отзыва слишком длинный (максимум 1000 символов)' };
    }
    
    return { valid: true };
}

// Sanitize HTML (простая защита от XSS)
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
        // Пытаемся подключить Vercel KV
        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
            const vercelKv = require('@vercel/kv');
            kv = vercelKv.kv;
        }
    } catch (e) {
        console.log('Vercel KV недоступен, используется память');
    }
    
    // GET - получить все отзывы
    if (req.method === 'GET') {
        try {
            const reviews = await getReviews(kv);
            // Возвращаем только одобренные отзывы
            const approvedReviews = reviews.filter(r => r.approved !== false);
            
            return res.status(200).json({
                success: true,
                reviews: approvedReviews,
                count: approvedReviews.length
            });
        } catch (error) {
            console.error('Ошибка GET /api/reviews:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка получения отзывов'
            });
        }
    }
    
    // POST - добавить новый отзыв
    if (req.method === 'POST') {
        try {
            const { name, project, rating, text, photo } = req.body;
            
            // Валидация
            const validation = validateReview({ name, rating, text });
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    error: validation.error
                });
            }
            
            // Создаём новый отзыв
            const newReview = {
                id: 'review_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: sanitize(name.trim()),
                project: project ? sanitize(project.trim()) : '',
                rating: parseInt(rating),
                text: sanitize(text.trim()),
                date: new Date().toISOString(),
                approved: true // Автоматическое одобрение (можно изменить на false для модерации)
            };
            
            // Добавляем фото, если есть
            if (photo) {
                // Проверяем, что это base64 изображение
                if (photo.startsWith('data:image/')) {
                    newReview.photo = photo;
                }
            }
            
            // Получаем существующие отзывы
            const reviews = await getReviews(kv);
            
            // Добавляем новый отзыв
            reviews.push(newReview);
            
            // Сохраняем
            const saved = await saveReviews(kv, reviews);
            
            if (!saved) {
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка сохранения отзыва'
                });
            }
            
            return res.status(201).json({
                success: true,
                message: 'Отзыв успешно добавлен',
                review: newReview
            });
            
        } catch (error) {
            console.error('Ошибка POST /api/reviews:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка добавления отзыва'
            });
        }
    }
    
    // DELETE - удалить отзыв или все отзывы
    if (req.method === 'DELETE') {
        try {
            const { id, deleteAll } = req.body;
            
            // Удалить все отзывы
            if (deleteAll === true) {
                await saveReviews(kv, []);
                
                return res.status(200).json({
                    success: true,
                    message: 'Все отзывы успешно удалены'
                });
            }
            
            // Удалить конкретный отзыв
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Не указан ID отзыва для удаления'
                });
            }
            
            // Получаем существующие отзывы
            const reviews = await getReviews(kv);
            
            // Находим отзыв
            const reviewIndex = reviews.findIndex(r => r.id === id);
            
            if (reviewIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Отзыв не найден'
                });
            }
            
            // Удаляем отзыв
            reviews.splice(reviewIndex, 1);
            
            // Сохраняем
            const saved = await saveReviews(kv, reviews);
            
            if (!saved) {
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка удаления отзыва'
                });
            }
            
            return res.status(200).json({
                success: true,
                message: 'Отзыв успешно удален'
            });
            
        } catch (error) {
            console.error('Ошибка DELETE /api/reviews:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка удаления отзыва'
            });
        }
    }
    
    // Метод не поддерживается
    return res.status(405).json({
        success: false,
        error: 'Метод не поддерживается'
    });
}

