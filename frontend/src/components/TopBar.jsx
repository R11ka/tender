// frontend/src/components/TopBar.jsx
function TopBar({ user, onLogout }) {
    return (
        <header className="top-bar">
            <div className="search-bar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A99A8">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input type="text" placeholder="Поиск..."/>
            </div>
            <div className="user-menu">
                <span className="user-name">{user?.username || 'Гость'}</span>
                <div className="avatar">{user?.username?.charAt(0).toUpperCase() || '?'}</div>
                {user ? (
                    <button className="btn-outline" onClick={onLogout}>Выйти</button>
                ) : (
                    <>
                        <button className="btn-outline" onClick={() => window.location.href = '/login'}>Вход</button>
                        <button className="btn-primary" onClick={() => window.location.href = '/register'}>Регистрация</button>
                    </>
                )}
            </div>
        </header>
    );
}

export default TopBar;