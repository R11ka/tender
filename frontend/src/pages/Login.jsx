import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Login({ setUser }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const response = await axios.post('http://localhost:8000/api/token/', {
                username, 
                password
            });
            
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            
            // Получаем данные профиля с бэкенда
            try {
                const userResponse = await axios.get('http://localhost:8000/api/users/me/', {
                    headers: {
                        Authorization: `Bearer ${response.data.access}`
                    }
                });
                setUser(userResponse.data);
            } catch (e) {
                console.error('Ошибка получения профиля:', e);
                // Если не удалось получить профиль, пробуем декодировать токен
                try {
                    const payload = JSON.parse(atob(response.data.access.split('.')[1]));
                    setUser({ 
                        username: payload.username || 'Пользователь',
                        user_id: payload.user_id 
                    });
                } catch (decodeError) {
                    console.error('Ошибка парсинга токена');
                }
            }
            
            console.log('Успешный вход!');
            navigate('/');
        } catch (err) {
            console.error('Ошибка входа:', err.response?.data || err.message);
            setError('Неверный логин или пароль');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            background: '#F5F7FA'
        }}>
            <div className="card" style={{ width: '400px' }}>
                <h2>Вход в АТЗ ЧТОТиБ'а</h2>
                {error && (
                    <div style={{ 
                        color: '#d32f2f', 
                        marginBottom: '16px', 
                        padding: '8px', 
                        background: '#ffebee', 
                        borderRadius: '8px' 
                    }}>
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <input 
                        type="text" 
                        placeholder="Логин" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ 
                            width: '100%', 
                            marginBottom: '16px', 
                            padding: '12px', 
                            borderRadius: '8px', 
                            border: '1px solid #ddd' 
                        }}
                        required
                    />
                    <input 
                        type="password" 
                        placeholder="Пароль" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ 
                            width: '100%', 
                            marginBottom: '16px', 
                            padding: '12px', 
                            borderRadius: '8px', 
                            border: '1px solid #ddd' 
                        }}
                        required
                    />
                    <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{ width: '100%' }} 
                        disabled={loading}
                    >
                        {loading ? 'Вход...' : 'Войти →'}
                    </button>
                </form>
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <Link to="/register" style={{ color: '#2C6E9F', textDecoration: 'none' }}>
                        Нет аккаунта? Зарегистрироваться
                    </Link>
                </div>
                <div style={{ marginTop: '16px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
                    <p>Тестовый доступ: admin / admin</p>
                </div>
            </div>
        </div>
    );
}

export default Login;