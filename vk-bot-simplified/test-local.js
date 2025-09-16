/**
 * Локальный тест для VK бота
 */

require('dotenv').config();
const { handler } = require('./index');

// Тестовые данные
const testEvent = {
  httpMethod: 'POST',
  path: '/',
  body: JSON.stringify({
    type: 'message_new',
    object: {
      message: {
        peer_id: -230721080,
        from_id: 123456789,
        text: 'привет',
        payload: null
      }
    }
  })
};

const testContext = {};

async function runTest() {
  console.log('🧪 Запуск локального теста...');
  console.log('📝 Тестовое сообщение:', testEvent.body);
  
  try {
    const result = await handler(testEvent, testContext);
    console.log('✅ Результат:', result);
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

// Тест health check
async function testHealthCheck() {
  console.log('🏥 Тест health check...');
  
  const healthEvent = {
    httpMethod: 'GET',
    path: '/health'
  };
  
  try {
    const result = await handler(healthEvent, testContext);
    console.log('✅ Health check результат:', result);
  } catch (error) {
    console.error('❌ Health check ошибка:', error);
  }
}

// Запуск тестов
async function main() {
  await testHealthCheck();
  console.log('\n' + '='.repeat(50) + '\n');
  await runTest();
}

main().catch(console.error);
