// frontend/src/pages/Lots.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';

const extractData = (responseData) => {
    if (Array.isArray(responseData)) return responseData;
    if (responseData && Array.isArray(responseData.results)) return responseData.results;
    return [];
};

function Lots({ user }) {
    const [lots, setLots] = useState([]);
    const [positions, setPositions] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedLot, setSelectedLot] = useState(null);
    const [lotName, setLotName] = useState('');
    const [lotDescription, setLotDescription] = useState('');
    const [selectedPositions, setSelectedPositions] = useState([]);
    const [filterSheet, setFilterSheet] = useState('');
    const [sheets, setSheets] = useState([]);
    
    // Для редактирования лота
    const [editLotForm, setEditLotForm] = useState({
        name: '',
        description: '',
        supplier_id: '',
        deadline: '',
        status: 'forming'
    });
    
    const isManager = user?.role === 'manager';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [lotsRes, positionsRes, sheetsRes, suppliersRes] = await Promise.all([
                api.get('/lots/'),
                api.get('/positions/'),
                api.get('/sheets/'),
                api.get('/suppliers/')
            ]);
            setLots(extractData(lotsRes.data));
            setPositions(extractData(positionsRes.data));
            setSheets(extractData(sheetsRes.data));
            setSuppliers(extractData(suppliersRes.data));
        } catch (err) {
            console.error('Ошибка:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLot = async () => {
        if (!lotName || selectedPositions.length === 0) {
            alert('Заполните название и выберите позиции');
            return;
        }
        
        try {
            await api.post('/lots/', {
                name: lotName,
                description: lotDescription,
                positions: selectedPositions
            });
            
            alert(`Лот "${lotName}" создан!`);
            setShowModal(false);
            setLotName('');
            setLotDescription('');
            setSelectedPositions([]);
            setFilterSheet('');
            fetchData();
        } catch (err) {
            console.error('Ошибка создания лота:', err.response?.data);
            alert('Ошибка создания лота');
        }
    };

    const handleUpdateLot = async () => {
        if (!selectedLot) return;
        
        try {
            await api.patch(`/lots/${selectedLot.id}/`, editLotForm);
            alert('Лот обновлен!');
            setShowDetailModal(false);
            fetchData();
        } catch (err) {
            console.error('Ошибка обновления:', err);
            alert('Ошибка обновления');
        }
    };

    const handleChangeStatus = async (lotId, newStatus) => {
        try {
            await api.post(`/lots/${lotId}/change_status/`, { status: newStatus });
            fetchData();
            if (selectedLot && selectedLot.id === lotId) {
                setSelectedLot({...selectedLot, status: newStatus});
            }
        } catch (err) {
            console.error('Ошибка смены статуса:', err);
            alert('Ошибка смены статуса');
        }
    };

    const handleDeleteLot = async (lotId, lotName) => {
        if (!window.confirm(`Удалить лот "${lotName}"?`)) return;
        
        try {
            await api.delete(`/lots/${lotId}/`);
            alert('Лот удален');
            fetchData();
        } catch (err) {
            console.error('Ошибка удаления:', err);
            alert('Ошибка удаления');
        }
    };

    const openLotDetail = (lot) => {
        setSelectedLot(lot);
        setEditLotForm({
            name: lot.name || '',
            description: lot.description || '',
            supplier_id: lot.supplier || '',
            deadline: lot.deadline || '',
            status: lot.status || 'forming'
        });
        setShowDetailModal(true);
    };

    const togglePosition = (posId) => {
        setSelectedPositions(prev =>
            prev.includes(posId) ? prev.filter(id => id !== posId) : [...prev, posId]
        );
    };

    const filteredPositions = filterSheet 
        ? positions.filter(p => p.sheet === parseInt(filterSheet))
        : positions;

    const getStatusBadge = (status) => {
        const statuses = {
            'forming': { label: 'Формируется', class: 'badge-pending' },
            'active': { label: 'Активный', class: 'badge-progress' },
            'completed': { label: 'Завершен', class: 'badge-success' },
            'cancelled': { label: 'Отменен', class: 'badge-pending' }
        };
        const s = statuses[status] || { label: status, class: 'badge-pending' };
        return <span className={`badge ${s.class}`}>{s.label}</span>;
    };

    const getTotalPrice = (lot) => {
        if (!lot.positions_detail) return 0;
        return lot.positions_detail.reduce((sum, p) => {
            return sum + (parseFloat(p.winner_price || p.target_price) || 0);
        }, 0);
    };

    if (loading) return <div className="loading">Загрузка...</div>;

    return (
        <>
            <div className="page-header">
                <h1>Закупочные лоты</h1>
                {isManager && (
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Создать лот
                    </button>
                )}
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Наименование</th>
                                <th>Позиций</th>
                                <th>Общая сумма</th>
                                <th>Поставщик</th>
                                <th>Статус</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {lots.map(lot => (
                                <tr key={lot.id} style={{ cursor: 'pointer' }} onClick={() => openLotDetail(lot)}>
                                    <td><strong>{lot.name}</strong></td>
                                    <td>{lot.positions?.length || 0}</td>
                                    <td>{getTotalPrice(lot).toLocaleString()} ₽</td>
                                    <td>{lot.supplier_detail?.name || '—'}</td>
                                    <td>{getStatusBadge(lot.status)}</td>
                                    <td>
                                        {isManager && (
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <select 
                                                    value={lot.status}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleChangeStatus(lot.id, e.target.value);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px' }}
                                                >
                                                    <option value="forming">Формируется</option>
                                                    <option value="active">Активный</option>
                                                    <option value="completed">Завершен</option>
                                                    <option value="cancelled">Отменен</option>
                                                </select>
<button 
    className="btn-icon" 
    onClick={(e) => { e.stopPropagation(); handleDeleteLot(lot.id, lot.name); }}
    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
    title="Удалить"
>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d32f2f" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {lots.length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Нет созданных лотов</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Модалка создания лота */}
            {showModal && (
                <div className="modal active" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '600px' }}>
                        <h2>Создание закупочного лота</h2>
                        
                        <input type="text" placeholder="Название лота *" value={lotName} onChange={e => setLotName(e.target.value)} />
                        <textarea placeholder="Описание лота" value={lotDescription} onChange={e => setLotDescription(e.target.value)} rows="2" />
                        
                        <select value={filterSheet} onChange={e => setFilterSheet(e.target.value)}>
                            <option value="">Все инженерные листы</option>
                            {sheets.map(sheet => <option key={sheet.id} value={sheet.id}>{sheet.name}</option>)}
                        </select>

                        <h4 style={{ margin: '16px 0 8px' }}>Выберите позиции ({selectedPositions.length} выбрано):</h4>
                        
                        <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '16px' }}>
                            {filteredPositions.map(pos => (
                                <label key={pos.id} style={{ display: 'block', marginBottom: '8px', padding: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={selectedPositions.includes(pos.id)} onChange={() => togglePosition(pos.id)} style={{ marginRight: '8px' }} />
                                    <strong>{pos.name_by_il}</strong>
                                    <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                                        {pos.quantity} {pos.unit} • {parseFloat(pos.target_price || 0).toLocaleString()} ₽
                                    </span>
                                </label>
                            ))}
                        </div>

                        <button className="btn-primary btn-block" onClick={handleCreateLot}>
                            Создать лот ({selectedPositions.length} позиций)
                        </button>
                        <div className="modal-close" onClick={() => setShowModal(false)}>Отмена</div>
                    </div>
                </div>
            )}

            {/* Модалка просмотра/редактирования лота */}
            {showDetailModal && selectedLot && (
                <div className="modal active" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <h2>{isManager ? 'Редактирование лота' : 'Просмотр лота'}</h2>
                        
                        {isManager ? (
                            <>
                                <div className="form-group">
                                    <label>Название</label>
                                    <input type="text" value={editLotForm.name} onChange={e => setEditLotForm({...editLotForm, name: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Описание</label>
                                    <textarea value={editLotForm.description} onChange={e => setEditLotForm({...editLotForm, description: e.target.value})} rows="2" />
                                </div>
                                <div className="form-group">
                                    <label>Поставщик</label>
                                    <select value={editLotForm.supplier_id} onChange={e => setEditLotForm({...editLotForm, supplier_id: e.target.value})}>
                                        <option value="">Не выбран</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Срок поставки</label>
                                    <input type="date" value={editLotForm.deadline} onChange={e => setEditLotForm({...editLotForm, deadline: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Статус</label>
                                    <select value={editLotForm.status} onChange={e => setEditLotForm({...editLotForm, status: e.target.value})}>
                                        <option value="forming">Формируется</option>
                                        <option value="active">Активный</option>
                                        <option value="completed">Завершен</option>
                                        <option value="cancelled">Отменен</option>
                                    </select>
                                </div>
                            </>
                        ) : (
                            <>
                                <p><strong>Название:</strong> {selectedLot.name}</p>
                                <p><strong>Описание:</strong> {selectedLot.description || '—'}</p>
                                <p><strong>Поставщик:</strong> {selectedLot.supplier_detail?.name || '—'}</p>
                                <p><strong>Срок поставки:</strong> {selectedLot.deadline || '—'}</p>
                                <p><strong>Статус:</strong> {getStatusBadge(selectedLot.status)}</p>
                            </>
                        )}
                        
                        <h4 style={{ marginTop: '20px', marginBottom: '12px' }}>Позиции в лоте:</h4>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', fontSize: '13px' }}>
                                <thead>
                                    <tr>
                                        <th>Наименование</th>
                                        <th>Кол-во</th>
                                        <th>Цена</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedLot.positions_detail?.map(pos => (
                                        <tr key={pos.id}>
                                            <td>{pos.name_by_il}</td>
                                            <td>{pos.quantity} {pos.unit}</td>
                                            <td>{(pos.winner_price || pos.target_price || 0).toLocaleString()} ₽</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <p style={{ marginTop: '16px', textAlign: 'right', fontWeight: 'bold' }}>
                            Итого: {getTotalPrice(selectedLot).toLocaleString()} ₽
                        </p>
                        
                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            {isManager && (
                                <button className="btn-primary" onClick={handleUpdateLot} style={{ flex: 1 }}>
                                    Сохранить изменения
                                </button>
                            )}
                            <button className="btn-outline" onClick={() => setShowDetailModal(false)} style={{ flex: 1 }}>
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Lots;