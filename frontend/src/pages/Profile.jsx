import { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

function Profile({ user, setUser }) {
    const [activeTab, setActiveTab] = useState('personal');
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        middle_name: ''
    });
    const navigate = useNavigate();
    const isManager = user?.role === 'manager';

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const response = await api.get('/users/me/');
            setUser(response.data);
            setFormData({
                username: response.data.username || '',
                email: response.data.email || '',
                first_name: response.data.first_name || '',
                last_name: response.data.last_name || '',
                middle_name: response.data.middle_name || ''
            });
        } catch (err) {
            console.error('Ошибка загрузки профиля:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const response = await api.patch('/users/me/', formData);
            setUser(response.data);
            setEditMode(false);
            alert('Профиль обновлен!');
        } catch (err) {
            console.error('Ошибка сохранения:', err);
            alert('Ошибка сохранения');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        navigate('/login');
    };

    if (loading) return <div className="loading">Загрузка...</div>;

    const fullName = [user?.last_name, user?.first_name, user?.middle_name].filter(Boolean).join(' ') || user?.username;

    return (
        <>
            <div className="profile-header">
                <div className="profile-avatar-large">
                    {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </div>
                <div className="profile-info">
                    <h1>{fullName}</h1>
                    <span className="profile-badge">
                        {isManager ? 'Менеджер тендерного отдела' : 'Наблюдатель'}
                    </span>
                </div>
            </div>

            <div className="profile-tabs">
                <div className={`profile-tab ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>
                    Личные данные
                </div>
                <div className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                    Безопасность
                </div>
            </div>

            {activeTab === 'personal' && (
                <div className="card">
                    <div className="card-header">
                        <h3>Основная информация</h3>
                        {isManager && (
                            !editMode ? (
                                <button className="btn-outline btn-sm" onClick={() => setEditMode(true)}>
                                    Редактировать
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn-primary btn-sm" onClick={handleSave}>
                                        Сохранить
                                    </button>
                                    <button className="btn-outline btn-sm" onClick={() => setEditMode(false)}>
                                        Отмена
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                    
                    {!editMode ? (
                        <>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Имя пользователя</label>
                                    <input type="text" value={user?.username || ''} readOnly />
                                </div>
                                <div className="form-group">
                                    <label>Роль</label>
                                    <input type="text" value={isManager ? 'Менеджер' : 'Наблюдатель'} readOnly />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" value={user?.email || 'Не указан'} readOnly />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Фамилия</label>
                                    <input type="text" value={user?.last_name || '—'} readOnly />
                                </div>
                                <div className="form-group">
                                    <label>Имя</label>
                                    <input type="text" value={user?.first_name || '—'} readOnly />
                                </div>
                                <div className="form-group">
                                    <label>Отчество</label>
                                    <input type="text" value={user?.middle_name || '—'} readOnly />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Имя пользователя</label>
                                    <input 
                                        type="text" 
                                        value={formData.username} 
                                        onChange={e => setFormData({...formData, username: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input 
                                        type="email" 
                                        value={formData.email} 
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Фамилия</label>
                                    <input 
                                        type="text" 
                                        value={formData.last_name} 
                                        onChange={e => setFormData({...formData, last_name: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Имя</label>
                                    <input 
                                        type="text" 
                                        value={formData.first_name} 
                                        onChange={e => setFormData({...formData, first_name: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Отчество</label>
                                    <input 
                                        type="text" 
                                        value={formData.middle_name} 
                                        onChange={e => setFormData({...formData, middle_name: e.target.value})}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'security' && (
                <div className="card">
                    <div className="card-header">
                        <h3>Безопасность</h3>
                    </div>
                    <div className="form-group">
                        <button className="btn-outline" onClick={handleLogout} style={{ background: '#ffebee', color: '#d32f2f', border: 'none' }}>
                            Выйти из системы
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default Profile;