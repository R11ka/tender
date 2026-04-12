// frontend/src/components/Layout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

function Layout({ user, onLogout }) {
    return (
        <div className="app">
            <Sidebar />
            <div className="main">
                <TopBar user={user} onLogout={onLogout} />
                <div className="page-content">
                    <Outlet /> {/* Здесь будут рендериться страницы */}
                </div>
            </div>
        </div>
    );
}

export default Layout;