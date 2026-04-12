// frontend/src/pages/EngineeringLists.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function EngineeringLists({ user }) {
    const [sheets, setSheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();
    const isManager = user?.role === 'manager';

    useEffect(() => {
        fetchSheets();
    }, []);

    const fetchSheets = async () => {
        try {
            const response = await api.get('/sheets/');
            // Обработка пагинации
            let sheetsData = [];
            if (Array.isArray(response.data)) {
                sheetsData = response.data;
            } else if (response.data.results) {
                sheetsData = response.data.results;
            }
            setSheets(sheetsData);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            setSheets([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        setUploading(true);

        try {
            const response = await api.post('/sheets/upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(`Загружено! Создано позиций: ${response.data.positions_created}`);
            setShowModal(false);
            fetchSheets();
            // Сбрасываем input
            event.target.value = '';
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            alert('Ошибка загрузки: ' + (err.response?.data?.error || 'Неизвестная ошибка'));
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;

    return (
        <>
            <div className="page-header">
                <h1>Инженерные листы</h1>
                {isManager && (
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Загрузить ИЛ
                    </button>
                )}
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Название файла</th>
                                <th>Дата загрузки</th>
                                <th>Позиций</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sheets.map(sheet => (
                                <tr key={sheet.id} onClick={() => navigate(`/engineering-detail?id=${sheet.id}`)} style={{ cursor: 'pointer' }}>
                                    <td><strong>{sheet.name}</strong></td>
                                    <td>{sheet.uploaded_at ? new Date(sheet.uploaded_at).toLocaleDateString() : '—'}</td>
                                    <td>{sheet.positions_count || sheet.positions?.length || 0}</td>
                                    <td className="text-muted">→</td>
                                </tr>
                            ))}
                            {sheets.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                                        Нет загруженных листов
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Модалка загрузки */}
            {showModal && (
                <div className="modal active" onClick={() => !uploading && setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Загрузка инженерного листа</h2>
                        <p style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
                            Поддерживаются файлы .xlsx и .csv<br />
                            Ожидаемые колонки: Наименование, Количество, Ед.изм, Цена
                        </p>
                        <input 
                            type="file" 
                            accept=".xlsx,.csv" 
                            onChange={handleUpload} 
                            disabled={uploading} 
                        />
                        {uploading && <p style={{ marginTop: '16px', color: '#2C6E9F' }}>Загрузка...</p>}
                        <button className="btn-outline btn-block" onClick={() => setShowModal(false)} disabled={uploading}>
                            Отмена
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default EngineeringLists;