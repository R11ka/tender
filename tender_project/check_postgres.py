# check_postgres.py
import psycopg2

def check_postgres():
    print("🔍 Проверяем подключение к PostgreSQL...")
    
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="porolb09", 
            host="127.0.0.1",
            port="5432",
            connect_timeout=5
        )
        print("✅ PostgreSQL работает и принимает подключения!")
        
        # Получаем версию
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"📦 Версия: {version[0][:50]}...")
        
        cursor.close()
        conn.close()
        return True
        
    except psycopg2.OperationalError as e:
        print(f"❌ PostgreSQL не отвечает: {e}")
        print("\n👉 PostgreSQL скорее всего не запущен.")
        print("👉 Запусти его через services.msc как описано выше.")
        return False

if __name__ == "__main__":
    check_postgres()