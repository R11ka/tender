# setup_db.py
import psycopg2

print("🔧 Начинаем настройку базы данных...")

try:
    # Подключаемся к PostgreSQL
    connection = psycopg2.connect(
        dbname="postgres",
        user="postgres", 
        password="porolb09",
        host="127.0.0.1",
        port="5432"
    )
    
    # Включаем автоматические коммиты
    connection.autocommit = True
    
    # Создаём курсор
    cursor = connection.cursor()
    
    # Проверяем, существует ли уже база данных
    cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'tender_db'")
    exists = cursor.fetchone()
    
    if not exists:
        # Создаём базу данных
        cursor.execute("CREATE DATABASE tender_db")
        print("✅ База данных 'tender_db' успешно создана!")
    else:
        print("✅ База данных 'tender_db' уже существует")
    
    # Закрываем соединение
    cursor.close()
    connection.close()
    
    print("✅ PostgreSQL готов к работе!")
    
except Exception as e:
    print(f"❌ Ошибка: {e}")
    print("\n👉 Возможные проблемы:")
    print("1. PostgreSQL не запущен")
    print("2. Неправильный пароль (должен быть: porolb09)")
    print("3. Неправильный порт (обычно 5432)")
    print("\n👉 Как запустить PostgreSQL на Windows:")
    print("1. Нажми Win + R, напиши 'services.msc'")
    print("2. Найди 'postgresql' в списке")
    print("3. Если статус 'Stopped', нажми правой кнопкой → 'Start'")