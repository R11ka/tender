// frontend/src/pages/Suppliers.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';

const extractData = (responseData) => {
    if (Array.isArray(responseData)) return responseData;
    if (responseData && Array.isArray(responseData.results)) return responseData.results;
    return [];
};

function Suppliers({ user }) {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        inn: '',
        kpp: ''
    });

    const isManager = user?.role === 'manager';

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/suppliers/');
            setSuppliers(extractData(res.data));
        } catch (err) {
            console.error('Ошибка загрузки поставщиков:', err);
            setSuppliers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            alert('Введите наименование поставщика');
            return;
        }
        
        try {
            await api.post('/suppliers/', formData);
            alert('Поставщик добавлен!');
            setShowModal(false);
            setFormData({ 
                name: '', 
                contact_person: '', 
                email: '', 
                phone: '', 
                address: '',
                inn: '',
                kpp: ''
            });
            fetchSuppliers();
        } catch (err) {
            console.error('Ошибка добавления:', err);
            alert('Ошибка добавления');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Удалить поставщика "${name}"?`)) return;
        
        try {
            await api.delete(`/suppliers/${id}/`);
            alert('Поставщик удален');
            fetchSuppliers();
        } catch (err) {
            console.error('Ошибка удаления:', err);
            alert('Ошибка удаления');
        }
    };

    const filteredSuppliers = suppliers.filter(sup => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            sup.name?.toLowerCase().includes(term) ||
            sup.contact_person?.toLowerCase().includes(term) ||
            sup.email?.toLowerCase().includes(term) ||
            sup.phone?.toLowerCase().includes(term) ||
            sup.inn?.toLowerCase().includes(term)
        );
    });

    if (loading) return <div className="loading">Загрузка...</div>;

    return (
        <>
            <div className="page-header">
                <h1>Поставщики</h1>
                {isManager && (
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Добавить поставщика
                    </button>
                )}
            </div>

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="🔍 Поиск..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ 
                        width: '100%', 
                        padding: '12px 16px', 
                        borderRadius: '60px', 
                        border: '1px solid #E9EEF3',
                        fontSize: '14px'
                    }}
                />
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Наименование</th>
                                <th>Контактное лицо</th>
                                <th>Email</th>
                                <th>Телефон</th>
                                <th>ИНН</th>
                                {isManager && <th></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={isManager ? 6 : 5} style={{ textAlign: 'center', padding: '40px' }}>
                                        {searchTerm ? 'Поставщики не найдены' : 'Нет поставщиков'}
                                    </td>
                                </tr>
                            ) : (
                                filteredSuppliers.map(sup => (
                                    <tr key={sup.id}>
                                        <td><strong>{sup.name}</strong></td>
                                        <td>{sup.contact_person || '—'}</td>
                                        <td>{sup.email || '—'}</td>
                                        <td>{sup.phone || '—'}</td>
                                        <td>{sup.inn || '—'}</td>
                                        {isManager && (
                                            <td>
                                                <button 
    className="btn-icon" 
    onClick={(e) => { e.stopPropagation(); handleDelete(sup.id, sup.name); }}
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
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Модалка добавления поставщика - ИСПОЛЬЗУЕМ СТАНДАРТНЫЕ КЛАССЫ */}
            {showModal && (
                <div className="modal active" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Добавление поставщика</h2>
                        <form onSubmit={handleSubmit}>
                            <input 
                                type="text" 
                                placeholder="Наименование *" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                required 
                            />
                            <input 
                                type="text" 
                                placeholder="Контактное лицо" 
                                value={formData.contact_person} 
                                onChange={e => setFormData({...formData, contact_person: e.target.value})} 
                            />
                            <input 
                                type="email" 
                                placeholder="Email" 
                                value={formData.email} 
                                onChange={e => setFormData({...formData, email: e.target.value})} 
                            />
                            <input 
                                type="tel" 
                                placeholder="Телефон" 
                                value={formData.phone} 
                                onChange={e => setFormData({...formData, phone: e.target.value})} 
                            />
                            <input 
                                type="text" 
                                placeholder="ИНН" 
                                value={formData.inn} 
                                onChange={e => setFormData({...formData, inn: e.target.value})} 
                            />
                            <input 
                                type="text" 
                                placeholder="КПП" 
                                value={formData.kpp} 
                                onChange={e => setFormData({...formData, kpp: e.target.value})} 
                            />
                            <textarea 
                                placeholder="Адрес" 
                                value={formData.address} 
                                onChange={e => setFormData({...formData, address: e.target.value})} 
                                rows="2"
                            />
                            <button type="submit" className="btn-primary btn-block">Сохранить →</button>
                        </form>
                        <div className="modal-close" onClick={() => setShowModal(false)}>Отмена</div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Suppliers;