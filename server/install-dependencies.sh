#!/bin/bash

echo "🔧 Встановлення залежностей для ProGran3 Tracking Server..."

# Перевіряємо чи встановлений Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не знайдено. Будь ласка, встановіть Node.js 18+ спочатку."
    exit 1
fi

# Перевіряємо версію Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Потрібна Node.js версія 18 або вище. Поточна версія: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) знайдено"

# Встановлюємо залежності
echo "📦 Встановлення npm пакетів..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Залежності встановлено успішно!"
    echo ""
    echo "📋 Наступні кроки:"
    echo "1. Скопіюйте env.example в .env.local:"
    echo "   cp env.example .env.local"
    echo ""
    echo "2. Налаштуйте змінні середовища в .env.local"
    echo ""
    echo "3. Запустіть сервер:"
    echo "   npm run dev"
    echo ""
    echo "🌐 Сервер буде доступний на http://localhost:3000"
else
    echo "❌ Помилка встановлення залежностей"
    exit 1
fi
