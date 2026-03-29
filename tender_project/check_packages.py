# check_packages.py
packages = [
    'django',
    'dotenv',
    'rest_framework',
    'psycopg2',
    'corsheaders'
]

for package in packages:
    try:
        __import__(package)
        print(f"✅ {package} - установлен")
    except ImportError:
        print(f"❌ {package} - НЕ установлен")