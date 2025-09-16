#!/bin/bash

# Скрипт для развертывания VK бота на Yandex Cloud Functions

set -e

echo "🚀 Начинаем развертывание VK бота на Yandex Cloud Functions..."

# Проверяем наличие yc CLI
if ! command -v yc &> /dev/null; then
    echo "❌ Yandex Cloud CLI не установлен. Установите его:"
    echo "curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash"
    exit 1
fi

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден. Скопируйте env.example в .env и заполните параметры:"
    echo "cp env.example .env"
    exit 1
fi

# Загружаем переменные окружения
source .env

# Проверяем обязательные переменные
if [ -z "$VK_ACCESS_TOKEN" ] || [ -z "$VK_CONFIRMATION_TOKEN" ] || [ -z "$VK_GROUP_ID" ]; then
    echo "❌ Не все обязательные переменные окружения установлены:"
    echo "   VK_ACCESS_TOKEN, VK_CONFIRMATION_TOKEN, VK_GROUP_ID"
    exit 1
fi

echo "✅ Переменные окружения загружены"

# Имя функции
FUNCTION_NAME="vk-sno-bot-simplified"

# Создаем функцию, если её нет
echo "📦 Создаем функцию $FUNCTION_NAME..."
yc serverless function create --name $FUNCTION_NAME 2>/dev/null || echo "Функция уже существует"

# Создаем версию функции
echo "🔄 Создаем новую версию функции..."
VERSION_ID=$(yc serverless function version create \
  --function-name $FUNCTION_NAME \
  --runtime nodejs18 \
  --entrypoint index.handler \
  --memory 128m \
  --execution-timeout 30s \
  --source-path . \
  --environment VK_ACCESS_TOKEN="$VK_ACCESS_TOKEN" \
  --environment VK_CONFIRMATION_TOKEN="$VK_CONFIRMATION_TOKEN" \
  --environment VK_GROUP_ID="$VK_GROUP_ID" \
  --environment ADMIN_USER_IDS="$ADMIN_USER_IDS" \
  --environment GIGACHAT_ENABLED="$GIGACHAT_ENABLED" \
  --environment GIGACHAT_CREDENTIALS="$GIGACHAT_CREDENTIALS" \
  --environment GIGACHAT_SCOPE="$GIGACHAT_SCOPE" \
  --environment GIGACHAT_MODEL="$GIGACHAT_MODEL" \
  --format json | jq -r '.id')

echo "✅ Версия функции создана: $VERSION_ID"

# Создаем HTTP-триггер, если его нет
echo "🔗 Создаем HTTP-триггер..."
yc serverless trigger create http \
  --name vk-sno-bot-trigger \
  --function-name $FUNCTION_NAME \
  --function-tag latest \
  --url vk-sno-bot-simplified 2>/dev/null || echo "Триггер уже существует"

# Получаем URL функции
FUNCTION_URL=$(yc serverless function get --name $FUNCTION_NAME --format json | jq -r '.http_invoke_url')

echo ""
echo "🎉 Развертывание завершено!"
echo ""
echo "📋 Информация о развертывании:"
echo "   Функция: $FUNCTION_NAME"
echo "   Версия: $VERSION_ID"
echo "   URL: $FUNCTION_URL"
echo ""
echo "🔧 Следующие шаги:"
echo "1. Настройте webhook в VK:"
echo "   URL: $FUNCTION_URL"
echo "   Токен подтверждения: $VK_CONFIRMATION_TOKEN"
echo ""
echo "2. Проверьте работу бота, отправив сообщение в группу"
echo ""
echo "3. Мониторинг логов:"
echo "   yc serverless function logs --name $FUNCTION_NAME"
