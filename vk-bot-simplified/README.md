# VK Bot для СНО СПбЮИ(ф) УП РФ - Упрощенная версия

Упрощенная версия чат-бота для Студенческого научного общества без функции ЛитБота (ГОСТ).

## Функции бота

- 👋 Приветствие и навигация
- 🎓 Информация о мероприятиях
- 🔬 Информация о СНК (студенческих научных кружках)
- 📞 Контакты СНО
- ❓ FAQ
- 🧠 ИИ-помощник (опционально)

## Установка и настройка

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Скопируйте `env.example` в `.env` и заполните необходимые параметры:

```bash
cp env.example .env
```

Обязательные параметры:
- `VK_ACCESS_TOKEN` - токен доступа VK API
- `VK_CONFIRMATION_TOKEN` - токен подтверждения для webhook
- `VK_GROUP_ID` - ID группы VK

Опциональные параметры:
- `ADMIN_USER_IDS` - ID администраторов (через запятую)
- `GIGACHAT_ENABLED` - включить ИИ-помощник (true/false)
- `GIGACHAT_CREDENTIALS` - учетные данные GigaChat

### 3. Локальный запуск

```bash
npm start
```

## Развертывание на Yandex Cloud Functions

### 1. Установка Yandex Cloud CLI

```bash
# Установка через curl
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash

# Инициализация
yc init
```

### 2. Создание функции

```bash
# Создание функции
yc serverless function create --name vk-sno-bot-simplified

# Создание версии функции
yc serverless function version create \
  --function-name vk-sno-bot-simplified \
  --runtime nodejs18 \
  --entrypoint index.handler \
  --memory 128m \
  --execution-timeout 30s \
  --source-path . \
  --environment VK_ACCESS_TOKEN=your_token_here \
  --environment VK_CONFIRMATION_TOKEN=your_confirmation_token_here \
  --environment VK_GROUP_ID=your_group_id_here
```

### 3. Создание HTTP-триггера

```bash
yc serverless trigger create http \
  --name vk-sno-bot-trigger \
  --function-name vk-sno-bot-simplified \
  --function-tag latest \
  --url vk-sno-bot-simplified
```

### 4. Настройка webhook в VK

1. Перейдите в настройки сообщества VK
2. В разделе "Работа с API" найдите "Callback API"
3. Укажите URL вашей Cloud Function
4. Укажите токен подтверждения из переменной `VK_CONFIRMATION_TOKEN`

## Структура проекта

```
vk-bot-simplified/
├── index.js              # Основной файл бота
├── package.json          # Зависимости и скрипты
├── env.example           # Пример конфигурации
└── README.md            # Документация
```

## API Endpoints

- `POST /` - Основной webhook для VK
- `GET /health` - Проверка состояния бота

## Логирование

Бот ведет подробные логи всех операций. В Cloud Functions логи доступны в консоли Yandex Cloud.

## Поддержка

При возникновении проблем проверьте:
1. Правильность настройки переменных окружения
2. Корректность токенов VK API
3. Настройку webhook в VK
4. Логи в консоли Cloud Functions
