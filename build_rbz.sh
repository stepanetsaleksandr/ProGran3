#!/bin/bash
# build_rbz.sh
# Linux/Mac script для збірки плагіна ProGran3

echo "=========================================="
echo "  ProGran3 Plugin Builder"
echo "=========================================="
echo ""

# Перевіряємо наявність Ruby
if ! command -v ruby &> /dev/null; then
    echo "[ERROR] Ruby не знайдено!"
    echo "Встановіть Ruby: https://www.ruby-lang.org/"
    exit 1
fi

# Перевіряємо наявність rubyzip gem
if ! ruby -e "require 'zip'" &> /dev/null; then
    echo "[INFO] Встановлюємо rubyzip gem..."
    gem install rubyzip
    if [ $? -ne 0 ]; then
        echo "[ERROR] Не вдалося встановити rubyzip!"
        exit 1
    fi
fi

# Запускаємо збірку
echo "[INFO] Запуск збірки..."
echo ""
ruby build_rbz.rb

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  SUCCESS! Plugin built successfully"
    echo "=========================================="
    echo ""
    echo "Open dist/ folder to find your .rbz file"
    echo ""
else
    echo ""
    echo "[ERROR] Build failed!"
    echo ""
    exit 1
fi

