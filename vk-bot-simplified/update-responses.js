/**
 * Скрипт для обновления текстовых ответов бота из JSON файла
 */

const fs = require('fs');
const path = require('path');

// Загружаем ответы из JSON
const responsesPath = path.join(__dirname, 'responses.json');
const responses = JSON.parse(fs.readFileSync(responsesPath, 'utf8'));

// Функция для генерации кода с ответами
function generateResponsesCode() {
  let code = '// Автоматически сгенерированные ответы бота\n';
  code += '// Не редактируйте вручную - используйте update-responses.js\n\n';
  
  code += 'const intentResponses = {\n';
  
  // Основные интенты
  Object.entries(responses.intents).forEach(([key, value]) => {
    const intentKey = key === 'greeting' ? 'приветствие' :
                     key === 'events' ? 'мероприятия' :
                     key === 'circles' ? 'кружки' :
                     key === 'contacts' ? 'контакты' :
                     key === 'ai_helper' ? 'ai_helper' : key;
    
    code += `  '${intentKey}': \`${value.text}\`,\n`;
  });
  
  code += '};\n\n';
  
  // Системные сообщения
  code += 'const systemMessages = {\n';
  Object.entries(responses.system_messages).forEach(([key, value]) => {
    code += `  '${key}': \`${value.text}\`,\n`;
  });
  code += '};\n\n';
  
  // AI Fallback ответы
  code += 'const aiFallbackResponses = {\n';
  Object.entries(responses.ai_fallback).forEach(([key, value]) => {
    code += `  '${key}': \`${value.text}\`,\n`;
  });
  code += '};\n\n';
  
  // Экспорт
  code += 'module.exports = {\n';
  code += '  intentResponses,\n';
  code += '  systemMessages,\n';
  code += '  aiFallbackResponses\n';
  code += '};\n';
  
  return code;
}

// Функция для обновления основного файла
function updateMainFile() {
  const indexPath = path.join(__dirname, 'index.js');
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Находим начало и конец блока с ответами
  const startMarker = '// Ответы на интенты';
  const endMarker = '};';
  
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) {
    console.log('❌ Не найден маркер начала ответов');
    return false;
  }
  
  // Находим конец блока intentResponses
  let braceCount = 0;
  let endIndex = startIndex;
  let inString = false;
  let escapeNext = false;
  
  for (let i = startIndex; i < content.length; i++) {
    const char = content[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '`' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }
  }
  
  if (endIndex === startIndex) {
    console.log('❌ Не найден конец блока ответов');
    return false;
  }
  
  // Генерируем новый код
  const newResponsesCode = generateResponsesCode();
  
  // Заменяем блок
  const beforeBlock = content.substring(0, startIndex);
  const afterBlock = content.substring(endIndex);
  
  const newContent = beforeBlock + newResponsesCode + afterBlock;
  
  // Создаем резервную копию
  const backupPath = indexPath + '.backup.' + Date.now();
  fs.writeFileSync(backupPath, content);
  console.log(`📋 Создана резервная копия: ${backupPath}`);
  
  // Записываем обновленный файл
  fs.writeFileSync(indexPath, newContent);
  console.log('✅ Файл index.js обновлен');
  
  return true;
}

// Функция для валидации JSON
function validateResponses() {
  const requiredIntents = ['greeting', 'events', 'circles', 'contacts', 'faq', 'ai_helper'];
  const requiredSystem = ['ai_unavailable', 'ai_processing', 'back_to_menu'];
  const requiredFallback = ['greeting', 'events', 'circles', 'contacts', 'general'];
  
  let isValid = true;
  
  // Проверяем основные интенты
  requiredIntents.forEach(intent => {
    if (!responses.intents[intent]) {
      console.log(`❌ Отсутствует интент: ${intent}`);
      isValid = false;
    }
  });
  
  // Проверяем системные сообщения
  requiredSystem.forEach(msg => {
    if (!responses.system_messages[msg]) {
      console.log(`❌ Отсутствует системное сообщение: ${msg}`);
      isValid = false;
    }
  });
  
  // Проверяем fallback ответы
  requiredFallback.forEach(fallback => {
    if (!responses.ai_fallback[fallback]) {
      console.log(`❌ Отсутствует fallback ответ: ${fallback}`);
      isValid = false;
    }
  });
  
  if (isValid) {
    console.log('✅ Все необходимые ответы присутствуют');
  }
  
  return isValid;
}

// Основная функция
function main() {
  console.log('🔄 Обновление текстовых ответов бота...');
  
  // Валидируем JSON
  if (!validateResponses()) {
    console.log('❌ Валидация не пройдена. Обновление отменено.');
    process.exit(1);
  }
  
  // Обновляем основной файл
  if (updateMainFile()) {
    console.log('🎉 Обновление завершено успешно!');
    console.log('💡 Не забудьте протестировать бота и обновить функцию в Cloud Functions');
  } else {
    console.log('❌ Ошибка при обновлении файла');
    process.exit(1);
  }
}

// Запуск
if (require.main === module) {
  main();
}

module.exports = {
  generateResponsesCode,
  updateMainFile,
  validateResponses
};
