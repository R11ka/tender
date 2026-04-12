import { Outlet, Link, useNavigate } from 'react-router-dom';

function Layout({ user, onLogout }) {
    const navigate = useNavigate();
    const isManager = user?.role === 'manager';

    const handleLogout = () => {
        onLogout();
        navigate('/login');
    };

    return (
        <div className="app">
            <div className="sidebar">
                <div className="logo">TenderFlow <span>B2B</span></div>
                <div className="nav-menu">
                    <Link to="/" className="nav-item">
                        <span>📊</span> Дашборд
                    </Link>
                    <Link to="/engineering-lists" className="nav-item">
                        <span>📋</span> Инженерные листы
                    </Link>
                    <Link to="/lots" className="nav-item">
                        <span>📦</span> Лоты
                    </Link>
                    <Link to="/suppliers" className="nav-item">
                        <span>🏢</span> Поставщики
                    </Link>
                    <Link to="/chats" className="nav-item">
                        <span>💬</span> Чаты
                    </Link>
                    <Link to="/profile" className="nav-item">
                        <span>👤</span> Профиль
                    </Link>
                </div>
                <div className="user-info">
                    <div className="user-name">{user?.full_name || user?.username || 'Гость'}</div>
                    <div className="user-role" style={{ fontSize: '12px', color: '#999' }}>
                        {isManager ? 'Менеджер' : 'Наблюдатель'}
                    </div>
                    <button onClick={handleLogout} className="logout-btn">Выйти</button>
                </div>
            </div>
            <main className="main">
                <div className="top-bar">
                    <div className="search-bar">
                        <span>🔍</span>
                        <input type="text" placeholder="Поиск..." />
                    </div>
                    <div className="user-menu">
                        <span className="user-name">{user?.first_name || user?.username || 'Гость'}</span>
                        <div className="avatar">
                            {user?.first_name?.charAt(0) || user?.username?.charAt(0) || '?'}
                        </div>
                    </div>
                </div>
                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default Layout;