// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { login, getPositions, getSheets } from './services/api';
import './styles/global.css';

// Компонент сайдбара
function Sidebar() {
    const location = useLocation();
    
    const isActive = (path) => location.pathname === path ? 'active' : '';
    
    return (
        <aside className="sidebar">
            <div className="logo">TenderFlow<span>B2B</span></div>
            <nav>
                <Link to="/" className={`nav-item ${isActive('/')}`}>
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 9L12 3L21 9L12 15L3 9Z"/>
                        <path d="M3 15L12 21L21 15"/>
                    </svg>
                    Дашборд
                </Link>
                <Link to="/engineering-lists" className={`nav-item ${isActive('/engineering-lists')}`}>
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    Инженерные листы
                </Link>
                <Link to="/lots" className={`nav-item ${isActive('/lots')}`}>
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <line x1="3" y1="9" x2="21" y2="9"/>
                    </svg>
                    Закупочные лоты
                </Link>
                <Link to="/suppliers" className={`nav-item ${isActive('/suppliers')}`}>
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="2" y="7" width="20" height="14" rx="2"/>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                    Поставщики
                </Link>
                <Link to="/chats" className={`nav-item ${isActive('/chats')}`}>
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Чаты
                </Link>
                <Link to="/profile" className="nav-item" style={{ marginTop: 'auto' }}>
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Профиль
                </Link>
            </nav>
        </aside>
    );
}

// Компонент страницы логина
function LoginPage({ setToken }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await login(username, password);
            localStorage.setItem('access_token', response.data.access);
            setToken(response.data.access);
        } catch (err) {
            setError('Неверный логин или пароль');
        }
    };

    return (
        <div className="main">
            <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="card" style={{ width: '400px' }}>
                    <h2>Вход в TenderFlow</h2>
                    {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <input 
                            type="text" 
                            placeholder="Логин" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ width: '100%', marginBottom: '16px', padding: '12px' }}
                        />
                        <input 
                            type="password" 
                            placeholder="Пароль" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', marginBottom: '16px', padding: '12px' }}
                        />
                        <button type="submit" className="btn-primary" style={{ width: '100%' }}>Войти</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Компонент дашборда
function DashboardPage() {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const positionsRes = await getPositions();
                setPositions(positionsRes.data);
            } catch (error) {
                console.error('Ошибка загрузки:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="main"><div className="page-content">Загрузка...</div></div>;

    return (
        <div className="main">
            <div className="page-content">
                <div className="greeting-card">
                    <h1>Дашборд</h1>
                    <p>Добро пожаловать в систему управления тендерами</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{positions.length}</div>
                        <div className="stat-label">Всего позиций</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">
                            {positions.filter(p => !p.winner_price).length}
                        </div>
                        <div className="stat-label">Активных</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">
                            {positions.filter(p => p.winner_price).length}
                        </div>
                        <div className="stat-label">Завершено</div>
                    </div>
                </div>

                <div className="card">
                    <h3>Активные позиции</h3>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Наименование</th>
                                    <th>Количество</th>
                                    <th>Целевая цена</th>
                                    <th>Статус</th>
                                </tr>
                            </thead>
                            <tbody>
                                {positions.map(pos => (
                                    <tr key={pos.id}>
                                        <td><strong>{pos.name_by_il}</strong></td>
                                        <td>{pos.quantity} {pos.unit}</td>
                                        <td>{pos.target_price} ₽</td>
                                        <td>
                                            <span className={`badge ${pos.winner_price ? 'badge-success' : 'badge-progress'}`}>
                                                {pos.winner_price ? 'Завершен' : 'В работе'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Главный компонент
function App() {
    const [token, setToken] = useState(localStorage.getItem('access_token'));

    if (!token) {
        return <LoginPage setToken={setToken} />;
    }

    return (
        <BrowserRouter>
            <div className="app">
                <Sidebar />
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/engineering-lists" element={<div className="main"><div className="page-content">Инженерные листы</div></div>} />
                    <Route path="/lots" element={<div className="main"><div className="page-content">Лоты</div></div>} />
                    <Route path="/suppliers" element={<div className="main"><div className="page-content">Поставщики</div></div>} />
                    <Route path="/chats" element={<div className="main"><div className="page-content">Чаты</div></div>} />
                    <Route path="/profile" element={<div className="main"><div className="page-content">Профиль</div></div>} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;