# Инструкция по развертыванию на Yandex Cloud Functions

## Подготовка

### 1. Установка Yandex Cloud CLI

```bash
# Установка через curl
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash

# Перезагрузка профиля
source ~/.bashrc

# Инициализация
yc init
```

### 2. Настройка переменных окружения

Создайте файл `.env` на основе `env.example`:

```bash
cp env.example .env
```

Заполните обязательные параметры:

```env
# Обязательные параметры
VK_ACCESS_TOKEN=ваш_токен_доступа_vk_api
VK_CONFIRMATION_TOKEN=ваш_токен_подтверждения
VK_GROUP_ID=id_вашей_группы_vk

# Опциональные параметры
ADMIN_USER_IDS=123456789,987654321
GIGACHAT_ENABLED=false
```

## Автоматическое развертывание

### Использование скрипта deploy.sh

```bash
# Сделать скрипт исполняемым (если еще не сделано)
chmod +x deploy.sh

# Запустить развертывание
./deploy.sh
```

Скрипт автоматически:
- Проверит наличие Yandex Cloud CLI
- Загрузит переменные из .env
- Создаст функцию
- Создаст версию функции
- Создаст HTTP-триггер
- Выведет URL для настройки webhook

## Ручное развертывание

### 1. Создание функции

```bash
yc serverless function create --name vk-sno-bot-simplified
```

### 2. Создание версии функции

```bash
yc serverless function version create \
  --function-name vk-sno-bot-simplified \
  --runtime nodejs18 \
  --entrypoint index.handler \
  --memory 128m \
  --execution-timeout 30s \
  --source-path . \
  --environment VK_ACCESS_TOKEN=ваш_токен \
  --environment VK_CONFIRMATION_TOKEN=ваш_токен_подтверждения \
  --environment VK_GROUP_ID=ваш_id_группы
```

### 3. Создание HTTP-триггера

```bash
yc serverless trigger create http \
  --name vk-sno-bot-trigger \
  --function-name vk-sno-bot-simplified \
  --function-tag latest \
  --url vk-sno-bot-simplified
```

### 4. Получение URL функции

```bash
yc serverless function get --name vk-sno-bot-simplified --format json | jq -r '.http_invoke_url'
```

## Настройка VK

### 1. Настройка Callback API

1. Перейдите в настройки вашего сообщества VK
2. В разделе "Работа с API" найдите "Callback API"
3. Включите Callback API
4. Укажите URL вашей Cloud Function (полученный на предыдущем шаге)
5. Укажите токен подтверждения из переменной `VK_CONFIRMATION_TOKEN`
6. Нажмите "Подтвердить"

### 2. Настройка прав бота

Убедитесь, что у бота есть права:
- Отправка сообщений
- Использование клавиатуры
- Доступ к сообщениям сообщества

## Проверка работы

### 1. Тест health check

```bash
curl https://ваш-url-функции/health
```

Должен вернуть:
```json
{
  "status": "OK",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "bot": "СНО СПб ЮИ УП РФ (упрощенная версия)",
  "environment": "yandex-cloud-function"
}
```

### 2. Тест бота

Отправьте сообщение "привет" в группу VK. Бот должен ответить с клавиатурой.

## Мониторинг и логи

### Просмотр логов

```bash
yc serverless function logs --name vk-sno-bot-simplified
```

### Мониторинг в консоли

1. Откройте [Yandex Cloud Console](https://console.cloud.yandex.ru)
2. Перейдите в раздел "Serverless Functions"
3. Выберите вашу функцию
4. Перейдите на вкладку "Мониторинг"

## Обновление функции

Для обновления кода:

```bash
# Создать новую версию
yc serverless function version create \
  --function-name vk-sno-bot-simplified \
  --runtime nodejs18 \
  --entrypoint index.handler \
  --memory 128m \
  --execution-timeout 30s \
  --source-path . \
  --environment VK_ACCESS_TOKEN=ваш_токен \
  --environment VK_CONFIRMATION_TOKEN=ваш_токен_подтверждения \
  --environment VK_GROUP_ID=ваш_id_группы
```

## Устранение неполадок

### Ошибка авторизации VK

- Проверьте правильность `VK_ACCESS_TOKEN`
- Убедитесь, что токен имеет необходимые права
- Проверьте, что токен не истек

### Ошибка подтверждения webhook

- Проверьте правильность `VK_CONFIRMATION_TOKEN`
- Убедитесь, что URL функции доступен извне
- Проверьте настройки Callback API в VK

### Функция не отвечает

- Проверьте логи функции
- Убедитесь, что все переменные окружения установлены
- Проверьте лимиты памяти и времени выполнения

## Стоимость

Yandex Cloud Functions предоставляет бесплатный тариф:
- 1 млн вызовов в месяц
- 400,000 ГБ-секунд выполнения
- 1 ГБ памяти

Для большинства ботов этого достаточно.
