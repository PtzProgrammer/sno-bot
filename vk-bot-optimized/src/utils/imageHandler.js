const fs = require('fs');
const path = require('path');

class ImageHandler {
  constructor() {
    // Приоритет локальным изображениям, fallback на внешние URL
    this.imageMap = {
      'приветствие': {
        local: './images/welcome.jpg',
        remote: 'https://storage.yandexcloud.net/vk-sno-bot-images/welcome.jpg'
      },
      'faq': {
        local: './images/faq.jpg',
        remote: 'https://storage.yandexcloud.net/vk-sno-bot-images/faq.jpg'
      },
      'кружки': {
        local: './images/snk.jpg',
        remote: 'https://storage.yandexcloud.net/vk-sno-bot-images/snk.jpg'
      },
      'контакты': {
        local: './images/contacts.jpg',
        remote: 'https://storage.yandexcloud.net/vk-sno-bot-images/contacts.jpg'
      },
      'мероприятия': {
        local: './images/events.jpg',
        remote: 'https://storage.yandexcloud.net/vk-sno-bot-images/events.jpg'
      },
      'gost_menu': {
        local: './images/litbot.jpg',
        remote: 'https://storage.yandexcloud.net/vk-sno-bot-images/litbot.jpg'
      },
      'ai_helper': {
        local: './images/ai.jpg.webp',
        remote: 'https://storage.yandexcloud.net/vk-sno-bot-images/ai.jpg'
      }
    };
  }

  hasImage(intent) {
    const imageConfig = this.imageMap[intent];
    if (!imageConfig) {
      console.log(`⚠️ Нет конфигурации изображения для интента: ${intent}`);
      return false;
    }
    
    // Сначала проверяем локальный файл
    const localPath = this.getAbsoluteImagePath(imageConfig.local);
    const localExists = this.isValidImageFile(localPath);
    
    if (localExists) {
      console.log(`🔍 Локальное изображение найдено для "${intent}": ${localPath}`);
      return true;
    }
    
    // Если локального нет, используем внешний URL
    console.log(`🔍 Локальное изображение не найдено для "${intent}", используем внешний URL: ${imageConfig.remote}`);
    return true; // Внешние URL всегда считаем валидными
  }

  getImageForIntent(intent) {
    const imageConfig = this.imageMap[intent];
    if (!imageConfig) {
      console.warn(`⚠️ Нет конфигурации изображения для интента: ${intent}`);
      return null;
    }
    
    // Сначала пробуем локальный файл
    const localPath = this.getAbsoluteImagePath(imageConfig.local);
    if (this.isValidImageFile(localPath)) {
      console.log(`✅ Используем локальное изображение для "${intent}": ${localPath}`);
      return localPath;
    }
    
    // Если локального нет, используем внешний URL
    console.log(`🌐 Используем внешнее изображение для "${intent}": ${imageConfig.remote}`);
    return imageConfig.remote;
  }

  // Новая функция для получения абсолютного пути к изображению
  getAbsoluteImagePath(relativePath) {
    // Если путь уже абсолютный, возвращаем как есть
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }
    
    // Получаем директорию текущего модуля и строим абсолютный путь
    const currentDir = __dirname;
    const projectRoot = path.join(currentDir, '..', '..'); // Поднимаемся на 2 уровня вверх от src/utils/
    return path.join(projectRoot, relativePath);
  }

  // Новая функция для проверки валидности изображения
  isValidImageFile(imagePath) {
    try {
      console.log(`🔍 Проверяем изображение: ${imagePath}`);
      
      // Если это URL, считаем его валидным
      if (imagePath.startsWith('http')) {
        console.log(`✅ URL изображения валиден: ${imagePath}`);
        return true;
      }

      // Для локальных файлов проверяем существование
      if (!fs.existsSync(imagePath)) {
        console.warn(`⚠️ Локальный файл не найден: ${imagePath}`);
        return false;
      }

      // Проверяем размер файла (должен быть больше 100 bytes для изображения)
      const stats = fs.statSync(imagePath);
      console.log(`📏 Размер файла: ${stats.size} bytes`);
      
      if (stats.size < 100) {
        console.warn(`⚠️ Файл слишком маленький для изображения: ${imagePath} (${stats.size} bytes)`);
        return false;
      }

      console.log(`✅ Локальный файл прошел все проверки: ${imagePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Ошибка проверки файла ${imagePath}:`, error.message);
      return false;
    }
  }
}

module.exports = ImageHandler;
