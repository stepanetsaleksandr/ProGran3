-- Додаємо колонку days_valid до таблиці licenses
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS days_valid INTEGER;

-- Коментар для колонки
COMMENT ON COLUMN licenses.days_valid IS 'Кількість днів дії ліцензії (NULL = безстрокова)';
