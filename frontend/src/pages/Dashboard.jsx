// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Dashboard({ user }) {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        positions_total: 0,
        positions_active: 0,
        positions_completed: 0,
        sheets_total: 0,
        lots_total: 0,
        suppliers_total: 0
    });
    const navigate = useNavigate();
    const isManager = user?.role === 'manager';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [positionsRes, statsRes] = await Promise.all([
                api.get('/positions/'),
                api.get('/dashboard/stats/').catch(() => null)
            ]);
            
            // Проверяем структуру ответа
            let positionsData = [];
            if (Array.isArray(positionsRes.data)) {
                positionsData = positionsRes.data;
            } else if (positionsRes.data.results) {
                positionsData = positionsRes.data.results;
            } else if (typeof positionsRes.data === 'object') {
                positionsData = Object.values(positionsRes.data);
            }
            
            setPositions(positionsData);
            
            if (statsRes?.data) {
                setStats(statsRes.data);
            } else {
                // Fallback если эндпоинт статистики не работает
                const activeCount = positionsData.filter(p => p.status === 'in_work').length;
                const completedCount = positionsData.filter(p => p.status === 'completed').length;
                setStats({
                    positions_total: positionsData.length,
                    positions_active: activeCount,
                    positions_completed: completedCount,
                    sheets_total: 0,
                    lots_total: 0,
                    suppliers_total: 0
                });
            }
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            setPositions([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;

    return (
        <>
            <div className="greeting-card">
                <h1>Добро пожаловать 👋</h1>
                <p>Ваша платформа для управления тендерными закупками — всё в одном месте</p>
                {isManager && (
                    <button className="btn-primary btn-with-arrow" onClick={() => navigate('/lots')}>
                        Создать новый тендер
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.positions_active || 0}</div>
                    <div className="stat-label">Активные торги</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.positions_completed || 0}</div>
                    <div className="stat-label">Завершено</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.suppliers_total || 0}</div>
                    <div className="stat-label">Поставщиков</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.positions_total || positions.length}</div>
                    <div className="stat-label">Позиций в работе</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Активные позиции</h3>
                    {isManager && (
                        <button className="btn-primary btn-sm" onClick={() => navigate('/engineering-lists')}>
                            Загрузить ИЛ
                        </button>
                    )}
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Наименование</th>
                                <th>Целевая цена</th>
                                <th>Цена победителя</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {positions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                                        Нет позиций. Загрузите инженерный лист!
                                    </td>
                                </tr>
                            ) : (
                                positions.slice(0, 5).map(pos => (
                                    <tr key={pos.id}>
                                        <td className="text-muted">#{pos.id}</td>
                                        <td>
                                            <strong>{pos.name_by_il}</strong>
                                            <br /><span className="text-small">{pos.quantity} {pos.unit}</span>
                                        </td>
                                        <td>{pos.target_price ? Number(pos.target_price).toLocaleString() + ' ₽' : '—'}</td>
                                        <td>{pos.winner_price ? Number(pos.winner_price).toLocaleString() + ' ₽' : '—'}</td>
                                        <td>
                                            <span className={`badge ${pos.status === 'completed' ? 'badge-success' : 'badge-progress'}`}>
                                                {pos.status === 'in_work' ? 'В работе' : 
                                                 pos.status === 'completed' ? 'Завершен' : 'Отменен'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

export default Dashboard;