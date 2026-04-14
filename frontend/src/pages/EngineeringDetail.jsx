// frontend/src/pages/EngineeringDetail.jsx
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function EngineeringDetail({ user }) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sheetId = searchParams.get('id');
    
    const [sheet, setSheet] = useState(null);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [comments, setComments] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [docType, setDocType] = useState('tor');
    
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [completeForm, setCompleteForm] = useState({
        winner_price: '',
        supplier_id: '',
        supplier_name: '',
        deadline: ''
    });
    const [finalDocument, setFinalDocument] = useState(null);
    
    const [editingPosition, setEditingPosition] = useState(null);
    const [editForm, setEditForm] = useState({
        name_by_il: '',
        name_by_cp: '',
        quantity: 0,
        unit: '',
        target_price: 0,
        status: 'in_work'
    });
    
    const fileInputRef = useRef(null);
    const isManager = user?.role === 'manager';

    const extractData = (responseData) => {
        if (Array.isArray(responseData)) return responseData;
        if (responseData && Array.isArray(responseData.results)) return responseData.results;
        return [];
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!sheetId) { setLoading(false); return; }
            
            try {
                const [sheetRes, positionsRes, suppliersRes] = await Promise.all([
                    api.get(`/sheets/${sheetId}/`),
                    api.get(`/positions/?sheet=${sheetId}`),
                    api.get('/suppliers/')
                ]);
                
                setSheet(sheetRes.data);
                setPositions(extractData(positionsRes.data));
                setSuppliers(extractData(suppliersRes.data));
            } catch (err) {
                console.error('Ошибка загрузки:', err);
                setPositions([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [sheetId]);

    const loadPositionDetails = async (position) => {
        setSelectedPosition(position);
        try {
            const [commentsRes, docsRes] = await Promise.all([
                api.get(`/comments/?position=${position.id}`),
                api.get(`/documents/?position=${position.id}`)
            ]);
            setComments(extractData(commentsRes.data));
            setDocuments(extractData(docsRes.data));
        } catch (err) {
            console.error('Ошибка загрузки деталей:', err);
            setComments([]);
            setDocuments([]);
        }
    };

    const addComment = async () => {
        if (!selectedPosition || !newComment.trim()) {
            alert('Выберите позицию и введите комментарий');
            return;
        }
        try {
            await api.post('/comments/', { position: selectedPosition.id, text: newComment });
            setNewComment('');
            const res = await api.get(`/comments/?position=${selectedPosition.id}`);
            setComments(extractData(res.data));
            const positionsRes = await api.get(`/positions/?sheet=${sheetId}`);
            setPositions(extractData(positionsRes.data));
        } catch (err) {
            alert('Ошибка при отправке комментария');
        }
    };

    const uploadDocument = async (file) => {
        if (!selectedPosition || !file) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('position', selectedPosition.id);
        formData.append('doc_type', docType);
        
        setUploadingDoc(true);
        try {
            await api.post('/documents/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert('Документ загружен!');
            const docsRes = await api.get(`/documents/?position=${selectedPosition.id}`);
            setDocuments(extractData(docsRes.data));
            const positionsRes = await api.get(`/positions/?sheet=${sheetId}`);
            setPositions(extractData(positionsRes.data));
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            alert('Ошибка загрузки документа');
        } finally {
            setUploadingDoc(false);
        }
    };

    const openCompleteModal = (position) => {
        setSelectedPosition(position);
        setCompleteForm({
            winner_price: position.winner_price || '',
            supplier_id: position.winner_supplier?.id || '',
            supplier_name: position.winner_supplier_name || '',
            deadline: position.winner_deadline || ''
        });
        setFinalDocument(null);
        setShowCompleteModal(true);
    };

    const completeTender = async () => {
        if (!selectedPosition) return;
        const formData = new FormData();
        formData.append('winner_price', completeForm.winner_price);
        formData.append('supplier_id', completeForm.supplier_id);
        formData.append('supplier_name', completeForm.supplier_name);
        formData.append('deadline', completeForm.deadline);
        if (finalDocument) formData.append('final_document', finalDocument);
        
        try {
            await api.post(`/positions/${selectedPosition.id}/complete_tender/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Торги завершены!');
            setShowCompleteModal(false);
            const positionsRes = await api.get(`/positions/?sheet=${sheetId}`);
            const newPositions = extractData(positionsRes.data);
            setPositions(newPositions);
            const updated = newPositions.find(p => p.id === selectedPosition.id);
            if (updated) setSelectedPosition(updated);
        } catch (err) {
            alert('Ошибка при завершении торгов');
        }
    };

    const startEditing = (position) => {
        setEditingPosition(position);
        setEditForm({
            name_by_il: position.name_by_il || '',
            name_by_cp: position.name_by_cp || '',
            quantity: position.quantity || 0,
            unit: position.unit || 'шт',
            target_price: position.target_price || 0,
            status: position.status || 'in_work'
        });
    };

    const savePosition = async () => {
        try {
            await api.patch(`/positions/${editingPosition.id}/`, editForm);
            alert('Позиция обновлена!');
            const positionsRes = await api.get(`/positions/?sheet=${sheetId}`);
            setPositions(extractData(positionsRes.data));
            setEditingPosition(null);
        } catch (err) {
            alert('Ошибка сохранения');
        }
    };

    const exportToCSV = () => {
        const headers = ['ID', 'Наименование по ИЛ', 'Наименование по КП', 'Количество', 'Ед.', 'Целевая цена', 'Цена победителя', 'Поставщик', 'Статус'];
        const rows = filteredPositions.map(p => [
            p.id, p.name_by_il, p.name_by_cp || '', p.quantity, p.unit,
            p.target_price || '', p.winner_price || '', p.winner_supplier_name || '',
            p.status === 'in_work' ? 'В работе' : p.status === 'completed' ? 'Завершен' : 'Отменен'
        ]);
        const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${sheet?.name || 'export'}.csv`;
        link.click();
    };

    const getDocTypeName = (type) => {
        const types = { 'tor': 'ТЗ', 'commercial': 'КП', 'drawing': 'Чертеж', 'final': 'Итоговый', 'protocol': 'Протокол', 'contract': 'Договор' };
        return types[type] || type;
    };

    const filteredPositions = Array.isArray(positions) ? positions.filter(pos => {
        const matchesSearch = !searchTerm || 
            (pos.name_by_il && pos.name_by_il.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (pos.name_by_cp && pos.name_by_cp.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = !statusFilter || pos.status === statusFilter;
        return matchesSearch && matchesStatus;
    }) : [];

    if (loading) return <div className="loading">Загрузка...</div>;
    if (!sheet) return <div>Лист не найден</div>;

    return (
        <>
            <div className="back-link" onClick={() => navigate('/engineering-lists')}>← Назад к списку</div>
            
            <div className="page-header">
                <h1>{sheet.name}</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-outline" onClick={exportToCSV}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Экспорт CSV
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <input type="text" placeholder="🔍 Поиск по наименованию..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    style={{ flex: 1, padding: '12px 16px', borderRadius: '60px', border: '1px solid #E9EEF3', fontSize: '14px' }} />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    style={{ padding: '12px 16px', borderRadius: '60px', border: '1px solid #E9EEF3', fontSize: '14px', minWidth: '150px' }}>
                    <option value="">Все статусы</option>
                    <option value="in_work">В работе</option>
                    <option value="completed">Завершен</option>
                    <option value="cancelled">Отменен</option>
                </select>
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th><th>Наименование по ИЛ</th><th>Количество</th><th>Целевая цена</th>
                                <th>Цена победителя</th><th>Статус</th><th>Документы</th><th>Комментарии</th>
                                {isManager && <th></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPositions.length === 0 ? (
                                <tr><td colSpan={isManager ? 9 : 8} style={{ textAlign: 'center', padding: '40px' }}>Нет позиций</td></tr>
                            ) : (
                                filteredPositions.map(pos => (
                                    <tr key={pos.id} style={{ cursor: 'pointer', background: selectedPosition?.id === pos.id ? '#f0f7ff' : 'transparent' }} onClick={() => loadPositionDetails(pos)}>
                                        <td className="text-muted">#{pos.id}</td>
                                        <td><strong>{pos.name_by_il}</strong></td>
                                        <td>{pos.quantity} {pos.unit}</td>
                                        <td>{pos.target_price ? Number(pos.target_price).toLocaleString() + ' ₽' : '—'}</td>
                                        <td>{pos.winner_price ? Number(pos.winner_price).toLocaleString() + ' ₽' : '—'}</td>
                                        <td><span className={`badge ${pos.status === 'completed' ? 'badge-success' : 'badge-progress'}`}>
                                            {pos.status === 'in_work' ? 'В работе' : pos.status === 'completed' ? 'Завершен' : 'Отменен'}
                                        </span></td>
                                        <td style={{ textAlign: 'center' }}>
                                            {pos.documents_count > 0 ? (
                                                <>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A99A8" style={{ marginRight: '4px' }}>
                                                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                                    </svg>
                                                    {pos.documents_count}
                                                </>
                                            ) : '—'}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {pos.comments_count > 0 ? (
                                                <>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A99A8" style={{ marginRight: '4px' }}>
                                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                    </svg>
                                                    {pos.comments_count}
                                                </>
                                            ) : '—'}
                                        </td>
                                        {isManager && (
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button 
                                                        className="btn-icon" 
                                                        onClick={(e) => { e.stopPropagation(); startEditing(pos); }} 
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                                        title="Редактировать"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2C6E9F" strokeWidth="2">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                                                        </svg>
                                                    </button>
                                                    {pos.status !== 'completed' && (
                                                        <button 
                                                            className="btn-icon" 
                                                            onClick={(e) => { e.stopPropagation(); openCompleteModal(pos); }} 
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                                            title="Завершить торги"
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ED6C02" strokeWidth="2">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <path d="M12 6v6l4 2" />
                                                                <path d="M8 12h8" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedPosition && (
                <div className="card" style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3>Позиция: {selectedPosition.name_by_il}</h3>
                        <button className="btn-outline" onClick={() => setSelectedPosition(null)} style={{ padding: '4px 8px' }}>✕ Закрыть</button>
                    </div>
                    
                    <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        <div><strong>Количество:</strong> {selectedPosition.quantity} {selectedPosition.unit}</div>
                        <div><strong>Целевая цена:</strong> {selectedPosition.target_price ? Number(selectedPosition.target_price).toLocaleString() : '—'} ₽</div>
                        <div><strong>Цена победителя:</strong> {selectedPosition.winner_price ? Number(selectedPosition.winner_price).toLocaleString() : '—'} ₽</div>
                        <div><strong>Поставщик:</strong> {selectedPosition.winner_supplier_name || '—'}</div>
                    </div>
                    
                    <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ marginBottom: '12px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ marginRight: '8px' }}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                            Документы
                        </h4>

                        {isManager && (
                            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <select value={docType} onChange={e => setDocType(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}>
                                    <option value="tor">Техническое задание</option>
                                    <option value="commercial">Коммерческое предложение</option>
                                    <option value="drawing">Чертеж</option>
                                    <option value="protocol">Протокол</option>
                                    <option value="contract">Договор</option>
                                    <option value="final">Итоговый документ</option>
                                </select>
                                <input ref={fileInputRef} type="file" onChange={e => uploadDocument(e.target.files[0])} disabled={uploadingDoc} style={{ padding: '8px' }} />
                                {uploadingDoc && <span style={{ color: '#2C6E9F' }}>Загрузка...</span>}
                            </div>
                        )}
                        
                        <div className="documents-list">
                            {documents.length === 0 ? (
                                <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Нет документов</p>
                            ) : (
                                documents.map(doc => (
                                    <div key={doc.id} style={{ padding: '12px', marginBottom: '8px', background: '#f9f9f9', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>
                                            <span className="badge badge-info" style={{ marginRight: '8px' }}>{getDocTypeName(doc.doc_type)}</span>
                                            {doc.file?.split('/').pop() || 'Файл'}
                                            <br />
                                            <span style={{ fontSize: '12px', color: '#999' }}>{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleString() : ''}</span>
                                        </span>
                                        <button onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = `http://localhost:8000${doc.file}`;
                                            link.download = doc.file.split('/').pop();
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }} style={{ color: '#2C6E9F', textDecoration: 'none', padding: '8px 16px', background: '#e3f2fd', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ marginRight: '4px' }}>
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            Скачать
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    
                    <div>
                        <h4 style={{ marginBottom: '12px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ marginRight: '8px' }}>
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            Комментарии
                        </h4>
                        {isManager && (
                            <div className="comment-input" style={{ marginBottom: '16px' }}>
                                <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Напишите комментарий..." rows="3"
                                    style={{ width: '100%', marginBottom: '8px', padding: '12px', resize: 'vertical', borderRadius: '8px', border: '1px solid #ddd' }} />
                                <button className="btn-primary" onClick={addComment}>Отправить комментарий</button>
                            </div>
                        )}
                        <div className="comments-list">
                            {comments.length === 0 ? (
                                <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Нет комментариев</p>
                            ) : (
                                comments.map(c => (
                                    <div key={c.id} style={{ padding: '12px', marginBottom: '8px', background: '#f9f9f9', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <strong>{c.author?.username || c.author?.full_name || 'Пользователь'}</strong>
                                            <span style={{ fontSize: '12px', color: '#999' }}>{c.created_at ? new Date(c.created_at).toLocaleString() : ''}</span>
                                        </div>
                                        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{c.text}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {showCompleteModal && selectedPosition && (
                <div className="modal active" onClick={() => setShowCompleteModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>🏆 Завершение торгов</h2>
                        <p style={{ marginBottom: '16px', color: '#666' }}>Позиция: <strong>{selectedPosition.name_by_il}</strong></p>
                        <input type="number" step="0.01" placeholder="Цена победителя (₽)" value={completeForm.winner_price} onChange={e => setCompleteForm({...completeForm, winner_price: e.target.value})} />
                        <select value={completeForm.supplier_id} onChange={e => setCompleteForm({...completeForm, supplier_id: e.target.value})}>
                            <option value="">Выберите поставщика</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <input type="text" placeholder="Или введите название поставщика" value={completeForm.supplier_name} onChange={e => setCompleteForm({...completeForm, supplier_name: e.target.value})} />
                        <input type="date" value={completeForm.deadline} onChange={e => setCompleteForm({...completeForm, deadline: e.target.value})} />
                        <input type="file" onChange={e => setFinalDocument(e.target.files[0])} />
                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button className="btn-primary" onClick={completeTender} style={{ flex: 1 }}>Завершить торги</button>
                            <button className="btn-outline" onClick={() => setShowCompleteModal(false)} style={{ flex: 1 }}>Отмена</button>
                        </div>
                    </div>
                </div>
            )}
            
            {editingPosition && (
                <div className="modal active" onClick={() => setEditingPosition(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Редактирование позиции #{editingPosition.id}</h2>
                        
                        <div className="form-group">
                            <label>Наименование по ИЛ</label>
                            <input type="text" value={editForm.name_by_il} 
                                onChange={e => setEditForm({...editForm, name_by_il: e.target.value})} />
                        </div>
                        
                        <div className="form-group">
                            <label>Наименование по КП</label>
                            <input type="text" value={editForm.name_by_cp} 
                                onChange={e => setEditForm({...editForm, name_by_cp: e.target.value})} />
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label>Количество</label>
                                <input type="number" step="0.01" value={editForm.quantity} 
                                    onChange={e => setEditForm({...editForm, quantity: parseFloat(e.target.value) || 0})} />
                            </div>
                            <div className="form-group">
                                <label>Ед. изм.</label>
                                <input type="text" value={editForm.unit} 
                                    onChange={e => setEditForm({...editForm, unit: e.target.value})} />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Целевая цена (₽)</label>
                            <input type="number" step="0.01" value={editForm.target_price} 
                                onChange={e => setEditForm({...editForm, target_price: parseFloat(e.target.value) || 0})} />
                        </div>
                        
                        <div className="form-group">
                            <label>Статус</label>
                            <select 
                                value={editForm.status} 
                                onChange={e => setEditForm({...editForm, status: e.target.value})}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                            >
                                <option value="in_work">В работе</option>
                                <option value="completed">Завершен</option>
                                <option value="cancelled">Отменен</option>
                            </select>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button className="btn-primary" onClick={savePosition} style={{ flex: 1 }}>
                                Сохранить
                            </button>
                            <button className="btn-outline" onClick={() => setEditingPosition(null)} style={{ flex: 1 }}>
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default EngineeringDetail;