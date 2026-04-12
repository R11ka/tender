import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        password: '',
        password2: '',
        role: 'manager'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.password2) {
            setError('Пароли не совпадают');
            setLoading(false);
            return;
        }

        try {
            await axios.post('http://localhost:8000/api/users/', {
                username: formData.username,
                email: formData.email,
                first_name: formData.first_name,
                last_name: formData.last_name,
                middle_name: formData.middle_name,
                password: formData.password,
                role: formData.role
            });
            
            alert('Регистрация успешна! Теперь войдите в систему.');
            navigate('/login');
        } catch (err) {
            console.error('Ошибка регистрации:', err.response?.data);
            setError(Object.values(err.response?.data || {}).join(' ') || 'Ошибка регистрации');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            background: '#F5F7FA',
            padding: '20px'
        }}>
            <div className="card" style={{ width: '500px' }}>
                <h2>Регистрация</h2>
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
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Логин *</label>
                        <input 
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                            required
                        />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px' }}>Фамилия</label>
                            <input 
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px' }}>Имя</label>
                            <input 
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px' }}>Отчество</label>
                            <input 
                                type="text"
                                name="middle_name"
                                value={formData.middle_name}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Email *</label>
                        <input 
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                            required
                        />
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Пароль *</label>
                        <input 
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                            required
                        />
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Подтверждение пароля *</label>
                        <input 
                            type="password"
                            name="password2"
                            value={formData.password2}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                            required
                        />
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Роль *</label>
                        <select 
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                        >
                            <option value="manager">Менеджер (полный доступ)</option>
                            <option value="observer">Наблюдатель (только просмотр)</option>
                        </select>
                    </div>
                    
                    <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Регистрация...' : 'Зарегистрироваться →'}
                    </button>
                </form>
                
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <Link to="/login" style={{ color: '#2C6E9F', textDecoration: 'none' }}>
                        Уже есть аккаунт? Войти
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Register;