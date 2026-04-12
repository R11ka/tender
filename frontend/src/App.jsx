import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EngineeringLists from './pages/EngineeringLists';
import EngineeringDetail from './pages/EngineeringDetail';
import Lots from './pages/Lots';
import Suppliers from './pages/Suppliers';
import Chats from './pages/Chats';
import Profile from './pages/Profile';
import './styles/global.css';

function PrivateRoute({ children }) {
    const token = localStorage.getItem('access_token');
    return token ? children : <Navigate to="/login" />;
}

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            // Пытаемся получить полные данные пользователя
            fetchUserData(token);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUserData = async (token) => {
        try {
            const response = await fetch('http://localhost:8000/api/users/me/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                // Если не удалось получить данные, пробуем декодировать токен
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    setUser({ 
                        username: payload.username || 'Пользователь',
                        user_id: payload.user_id 
                    });
                } catch (e) {
                    console.error('Ошибка парсинга токена');
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
            // Fallback к декодированию токена
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({ 
                    username: payload.username || 'Пользователь',
                    user_id: payload.user_id 
                });
            } catch (e) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    if (loading) return <div className="loading">Загрузка...</div>;

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login setUser={setUser} />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={
                    <PrivateRoute>
                        <Layout user={user} onLogout={handleLogout} />
                    </PrivateRoute>
                }>
                    <Route index element={<Dashboard user={user} />} />
                    <Route path="engineering-lists" element={<EngineeringLists user={user} />} />
                    <Route path="engineering-detail" element={<EngineeringDetail user={user} />} />
                    <Route path="lots" element={<Lots user={user} />} />
                    <Route path="suppliers" element={<Suppliers user={user} />} />
                    <Route path="chats" element={<Chats user={user} />} />
                    <Route path="profile" element={<Profile user={user} setUser={setUser} />} />
                </Route>
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;