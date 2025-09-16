/**
 * Упрощенная версия VK Chat Bot для СНО СПб ЮИ УП РФ - Cloud Function
 * Версия без ЛитБота (ГОСТ функций)
 */
const axios = require('axios');
const logger = require('./src/utils/logger');
const CursorIntegration = require('./src/utils/cursorIntegration');
const LogRoutes = require('./src/routes/logRoutes');

// Инициализация интеграции с Cursor
const cursorIntegration = new CursorIntegration({
  updateInterval: 3000, // Обновление каждые 3 секунды
  maxLogsInFile: 500
});

// Запускаем интеграцию с Cursor
cursorIntegration.start();

// Инициализация маршрутов логов
const logRoutes = new LogRoutes(cursorIntegration);

// Конфигурация
const config = {
  VK_ACCESS_TOKEN: process.env.VK_ACCESS_TOKEN || process.env.VK_API_TOKEN,
  VK_CONFIRMATION_TOKEN: process.env.VK_CONFIRMATION_TOKEN,
  VK_GROUP_ID: process.env.VK_GROUP_ID,
  ADMIN_USER_IDS: process.env.ADMIN_USER_IDS?.split(',').map(id => parseInt(id.trim())) || [],
  VK_API_VERSION: '5.131',
  
  // GigaChat конфигурация
  GIGACHAT_ENABLED: process.env.GIGACHAT_ENABLED === 'true',
  GIGACHAT_CREDENTIALS: process.env.GIGACHAT_CREDENTIALS,
  GIGACHAT_SCOPE: process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS',
  GIGACHAT_MODEL: process.env.GIGACHAT_MODEL || 'GigaChat'
};

// Хранилище пользователей в режиме ИИ помощника
const aiHelperUsers = new Set();

// Создание клавиатуры главного меню
function createMainMenuKeyboard() {
  return {
    one_time: false,
    inline: false,
    buttons: [
      [
        createButton("👋 Приветствие", {intent: "приветствие"}, "primary")
      ],
      [
        createButton("🎓 Мероприятия", {intent: "мероприятия"}),
        createButton("🔬 СНК", {intent: "кружки"})
      ],
      [
        createButton("🧠 Умный помощник", {intent: "ai_helper"}, "positive")
      ],
      [
        createButton("📞 Контакты", {intent: "контакты"}),
        createButton("❓ FAQ", {intent: "faq"})
      ]
    ]
  };
}

// Утилита для создания кнопок
function createButton(label, payload, color = "secondary") {
  return {
    action: { type: "text", label, payload: JSON.stringify(payload) },
    color
  };
}

// Создание клавиатуры "Назад в меню"
function createBackToMenuKeyboard() {
  return {
    one_time: true,
    inline: false,
    buttons: [[createButton("🏠 Назад в меню", {intent: "приветствие"})]]
  };
}

// Автоматически сгенерированные ответы бота
// Не редактируйте вручную - используйте update-responses.js

const intentResponses = {
  'приветствие': `👋 Вас приветствует Помощник СНО СПбЮИ(ф) УП РФ!

Я бот Студенческого научного общества института. Готов помочь с любым вопросом!

Что умею:
🔬 Расскажу про СНК и мероприятия
🏆 Подскажу информацию про конференции и конкурсы
🧠 Отвечу на вопросы с помощью ИИ

Жми кнопки или просто пиши что нужно! 👇`,
  'мероприятия': `🎓 Что происходит в СНО

У нас всегда есть чем заняться:
📅 Студенческие олимпиады по дисциплинам
🗣️ Круглые столы
📚 Конференции и интересные конкурсы

Хочешь участвовать? Пиши представителям СНО — они расскажут всё! 🚀`,
  'кружки': `🔬 СНК - студенческие научные кружки!

Присоединяйся к научному сообществу института! В СНК ты сможешь:

📚 Углубить знания по интересующим дисциплинам
🎯 Участвовать в научных исследованиях
🏆 Готовиться к олимпиадам и конкурсам
👥 Найти единомышленников

Направления работы кружков определяются в зависимости от интересов студентов и актуальных научных задач.

Хочешь узнать больше? Обращайся к представителям СНО! 😎`,
  'контакты': `📞 Как нас найти

📧 Email: sno.spb.up.rf@gmail.com
📱 VK: https://vk.com/sno_uprf

Структура:
👨‍💼 Матвеев Д.В. - Председатель СНО
👨‍💼 Бахилин А.А. - Заместитель по информационному сектору
👨‍💼 Карабин И.Д. - Заместитель по издательскому сектору
👩‍💼 Меновщикова К.М. - Заместитель по научному сектору
👩‍💼 Карташева В.А - Заместитель по внешнему сектору`,
  'faq': `❓ Самые частые вопросы

🎯 А что мне это даст?
• Баллы к стипендии
• Возможность публиковаться
• Участие в конференциях
• Полезные знакомства

📝 Как опубликовать свою работу?
Мы публикуем работы студентов в сборниках

📅 Где искать научные мероприятия?
Следи за нашими подборками и новостями

Еще вопросы? Пиши представителям СНО - они всё объяснят! 💬`,
  'ai_helper': `🧠 ИИ-помощник включен!

Теперь можешь спрашивать меня о чём угодно - об учебе, науке, СНО. Я отвечу с помощью искусственного интеллекта!

Примеры вопросов:
• "Как подготовиться к конференции?"
• "Какой кружок мне подойдет?"
• "Как написать крутую статью?"

Просто пиши свой вопрос и я отвечу! 💬`,
};

const systemMessages = {
  'ai_unavailable': `❌ ИИ помощник временно недоступен.

Попробуйте другие функции бота или обратитесь позже.`,
  'ai_processing': `🧠 Обрабатываю ваш вопрос...`,
  'back_to_menu': `🏠 Назад в меню`,
};

const aiFallbackResponses = {
  'greeting': `Привет! Я умный помощник СНО СПбЮИ(ф) УП РФ. Могу помочь с вопросами об учебе, науке и мероприятиях! 😊`,
  'events': `В СНО регулярно проводятся научные семинары, круглые столы и конференции. Следите за объявлениями в группе! 📅`,
  'circles': `У нас есть научные кружки: "Конституционное право", "Гражданское право", "Криминалистика", "Предпринимательское право". Присоединяйтесь! 🔬`,
  'contacts': `Контакты СНО: sno@spbui.ru, Литейный пр. 44, СПб. Кураторы: Иванова А.А. (председатель), Петров М.В. (зам), Сидорова Е.И. (секретарь) 📞`,
  'general': `Спасибо за вопрос! Я умный помощник СНО. Могу рассказать о мероприятиях, кружках, контактах. Что вас интересует? 🤔`,
};

module.exports = {
  intentResponses,
  systemMessages,
  aiFallbackResponses
};
;

// Функция отправки сообщения в VK
async function sendMessage(peerId, message, keyboard = null) {
  const params = {
    peer_id: peerId,
    message: message,
    random_id: Math.floor(Math.random() * 1000000),
    v: config.VK_API_VERSION
  };

  if (keyboard) {
    params.keyboard = JSON.stringify(keyboard);
  }

  try {
    const response = await axios.post(
      `https://api.vk.com/method/messages.send?access_token=${config.VK_ACCESS_TOKEN}`,
      new URLSearchParams(params)
    );

    if (response.data.error) {
      logger.vkError(response.data.error, { peerId, message });
      return null;
    }

    return response.data.response;
  } catch (error) {
    logger.vkError(error, { peerId, message, operation: 'sendMessage' });
    return null;
  }
}

// Определение интента по тексту сообщения
function getIntentFromText(text) {
  const normalizedText = text.toLowerCase().trim();
  
  if (normalizedText.includes('привет') || normalizedText.includes('hello') || normalizedText === 'начать') {
    return 'приветствие';
  }
  if (normalizedText.includes('мероприятие') || normalizedText.includes('событие')) {
    return 'мероприятия';
  }
  if (normalizedText.includes('кружок') || normalizedText.includes('секция')) {
    return 'кружки';
  }
  if (normalizedText.includes('контакт') || normalizedText.includes('связ')) {
    return 'контакты';
  }
  if (normalizedText.includes('faq') || normalizedText.includes('вопрос') || normalizedText.includes('помощь')) {
    return 'faq';
  }
  
  return 'приветствие'; // По умолчанию
}

// Обработка сообщений в режиме ИИ помощника
async function handleAIHelperMessage(peerId, userId, userMessage) {
  const startTime = Date.now();
  
  try {
    logger.aiRequest(userId, userMessage);
    
    // Проверяем, включен ли GigaChat
    if (!config.GIGACHAT_ENABLED) {
      logger.warn('GigaChat отключен в настройках', { userId });
      await sendMessage(peerId, 
        '❌ ИИ помощник временно недоступен.\n\nПопробуйте другие функции бота или обратитесь позже.',
        createBackToMenuKeyboard()
      );
      return;
    }
    
    // Показываем индикатор "печатает"
    await sendMessage(peerId, '🧠 Обрабатываю ваш вопрос...');
    
    logger.debug('Отправляем запрос в GigaChat', { userId });
    
    // Получаем ответ от GigaChat (упрощенная версия)
    const aiResponse = await getGigaChatResponse(userMessage);
    
    if (aiResponse) {
      logger.info('Получен ответ от GigaChat', { userId, responseLength: aiResponse.length });
      await sendMessage(peerId, 
        `🧠 ${aiResponse}`,
        createBackToMenuKeyboard()
      );
    } else {
      logger.warn('Пустой ответ от GigaChat, используем fallback', { userId });
      const fallbackResponse = getFallbackAIResponse(userMessage);
      await sendMessage(peerId, 
        `🧠 ${fallbackResponse}`,
        createBackToMenuKeyboard()
      );
    }
  } catch (error) {
    logger.error('AI Helper error', { error: error.message, userId, userMessage });
    const fallbackResponse = getFallbackAIResponse(userMessage);
    await sendMessage(peerId, 
      `🧠 ${fallbackResponse}`,
      createBackToMenuKeyboard()
    );
  } finally {
    const duration = Date.now() - startTime;
    logger.performance('AI Helper Message', duration, { userId });
  }
}

// Упрощенная функция для работы с GigaChat
async function getGigaChatResponse(userMessage) {
  try {
    if (!config.GIGACHAT_CREDENTIALS) {
      logger.warn('GigaChat credentials не настроены');
      return null;
    }

    // Здесь должна быть логика работы с GigaChat API
    // Для упрощенной версии используем заглушку
    logger.debug('GigaChat API не реализован в упрощенной версии');
    return null;
  } catch (error) {
    logger.error('GigaChat error', { error: error.message, userMessage });
    return null;
  }
}

// Заглушка для ИИ при недоступности GigaChat
function getFallbackAIResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('привет') || lowerMessage.includes('hello')) {
    return 'Привет! Я умный помощник СНО СПбЮИ(ф) УП РФ. Могу помочь с вопросами об учебе, науке и мероприятиях! 😊';
  }
  
  if (lowerMessage.includes('мероприятие') || lowerMessage.includes('событие')) {
    return 'В СНО регулярно проводятся научные семинары, круглые столы и конференции. Следите за объявлениями в группе! 📅';
  }
  
  if (lowerMessage.includes('кружок') || lowerMessage.includes('снк')) {
    return 'У нас есть научные кружки: "Конституционное право", "Гражданское право", "Криминалистика", "Предпринимательское право". Присоединяйтесь! 🔬';
  }
  
  if (lowerMessage.includes('контакт') || lowerMessage.includes('связ')) {
    return 'Контакты СНО: sno@spbui.ru, Литейный пр. 44, СПб. Кураторы: Иванова А.А. (председатель), Петров М.В. (зам), Сидорова Е.И. (секретарь) 📞';
  }
  
  return 'Спасибо за вопрос! Я умный помощник СНО. Могу рассказать о мероприятиях, кружках, контактах. Что вас интересует? 🤔';
}

// Обработка интента
async function handleIntent(intent, peerId, userId) {
  // Если пользователь активировал ИИ помощника
  if (intent === 'ai_helper') {
    aiHelperUsers.add(userId);
    const response = intentResponses[intent];
    const keyboard = createBackToMenuKeyboard();
    await sendMessage(peerId, response, keyboard);
    return;
  }
  
  // Если пользователь вернулся в меню - убираем из режима ИИ
  if (intent === 'приветствие') {
    aiHelperUsers.delete(userId);
  }
  
  const response = intentResponses[intent] || intentResponses['приветствие'];
  const keyboard = createMainMenuKeyboard();
  
  await sendMessage(peerId, response, keyboard);
}

// Обработка входящего сообщения
async function processMessage(message) {
  const peerId = message.peer_id;
  const userId = message.from_id;
  const messageText = message.text || '';

  // Логируем входящее сообщение
  logger.vkMessage(userId, messageText, 'received');
  
  // Обработка payload (приоритет выше, чем обработка текста)
  if (message.payload) {
    try {
      const payload = JSON.parse(message.payload);
      logger.debug('Обработка payload', { payload, userId });
      
      // Обработка интентов
      if (payload.intent) {
        logger.info('Обрабатываем intent', { intent: payload.intent, userId });
        await handleIntent(payload.intent, peerId, userId);
        return;
      }
    } catch (error) {
      logger.error('Error parsing payload', { error: error.message, payload: message.payload, userId });
    }
  }
  
  // Обработка текста
  if (message.text) {
    logger.debug('Обработка текста', { text: message.text, userId });
    
    // Проверка на простые приветствия
    const lowerText = message.text.toLowerCase().trim();
    if (lowerText === 'привет' || lowerText === 'hello' || lowerText === 'hi' || lowerText === 'здравствуйте') {
      logger.info('Простое приветствие, показываем главное меню', { userId });
      await handleIntent('приветствие', peerId, userId);
      return;
    }
    
    // Проверка, находится ли пользователь в режиме ИИ помощника
    if (aiHelperUsers.has(userId) && messageText && !messageText.startsWith('/')) {
      logger.info('Пользователь в режиме ИИ, обрабатываем', { userId });
      await handleAIHelperMessage(peerId, userId, messageText);
      return;
    }
    
    // Определяем интент
    logger.debug('Определяем интент', { text: message.text, userId });
    const intent = getIntentFromText(message.text);
    logger.info('Определен интент', { intent, userId });
    
    if (intentResponses[intent]) {
      await handleIntent(intent, peerId, userId);
      return;
    }
    
    // Если интент не определен, отправляем приветствие
    logger.warn('Интент не определен, отправляем приветствие', { text: message.text, userId });
    await handleIntent('приветствие', peerId, userId);
  }
}

// Главный обработчик для Cloud Function
module.exports.handler = async (event, context) => {
  const startTime = Date.now();
  
  try {
    const body = JSON.parse(event.body || '{}');
    
    logger.info('Received event', { 
      type: body.type, 
      hasObject: !!body.object,
      httpMethod: event.httpMethod,
      path: event.path 
    });

    // Подтверждение сервера
    if (body.type === 'confirmation') {
      logger.info('Confirmation request received');
      return {
        statusCode: 200,
        body: config.VK_CONFIRMATION_TOKEN
      };
    }

    // Обработка нового сообщения
    if (body.type === 'message_new') {
      logger.info('New message received', { 
        userId: body.object?.message?.from_id,
        peerId: body.object?.message?.peer_id 
      });
      
      // Асинхронная обработка сообщения
      setImmediate(async () => {
        try {
          await processMessage(body.object.message);
        } catch (error) {
          logger.error('Error processing message', { 
            error: error.message, 
            message: body.object?.message 
          });
        }
      });

      return {
        statusCode: 200,
        body: 'ok'
      };
    }

    // Health check
    if (event.httpMethod === 'GET' && event.path === '/health') {
      const healthData = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        bot: 'СНО СПб ЮИ УП РФ (упрощенная версия)',
        environment: 'yandex-cloud-function',
        stats: logger.getStats()
      };
      
      logger.info('Health check requested', { stats: healthData.stats });
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(healthData)
      };
    }

    // Обработка маршрутов логов
    if (event.path && event.path.startsWith('/logs')) {
      return logRoutes.handleLogRoutes(event, context);
    }

    // Неизвестный тип события
    logger.warn('Unknown event type', { type: body.type });
    return {
      statusCode: 200,
      body: 'ok'
    };

  } catch (error) {
    logger.error('Handler error', { 
      error: error.message, 
      stack: error.stack,
      event: event 
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  } finally {
    const duration = Date.now() - startTime;
    logger.performance('Handler Request', duration, { 
      type: body?.type,
      httpMethod: event.httpMethod 
    });
  }
};
