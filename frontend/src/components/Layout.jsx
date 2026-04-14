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
                <div className="logo">
                    <img src="/logo.png" alt="Логотип техникума" style={{ height: '100px' }} />
                </div>
                <div className="nav-menu">
                    <Link to="/" className="nav-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ marginRight: '8px' }}>
                            <path d="M3 9L12 3L21 9L12 15L3 9Z" />
                            <path d="M3 15L12 21L21 15" />
                        </svg>
                        Главная страница
                    </Link>
                    <Link to="/engineering-lists" className="nav-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ marginRight: '8px' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        Инженерные листы
                    </Link>
                    <Link to="/lots" className="nav-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ marginRight: '8px' }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                        </svg>
                        Лоты
                    </Link>
                    <Link to="/suppliers" className="nav-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ marginRight: '8px' }}>
                            <rect x="2" y="7" width="20" height="14" rx="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                        Поставщики
                    </Link>
                    <Link to="/profile" className="nav-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ marginRight: '8px' }}>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        Профиль
                    </Link>
                </div>
                <div className="user-info">
                    <div className="user-name">{user?.full_name || user?.username || 'Гость'}</div>
                    <div className="user-role" style={{ fontSize: '12px', color: '#999' }}>
                        {isManager ? 'Менеджер' : 'Наблюдатель'}
                    </div>
                    
                </div>
            </div>
            <main className="main">
                <div className="top-bar">
                    <div className="search-bar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A99A8">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
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