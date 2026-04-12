// frontend/src/pages/Chats.jsx
import { useState } from 'react';

const chatsData = {
    cable: { name: 'ООО "КабельСнаб"', avatar: 'КС', messages: [
        { text: 'Добрый день! Цена по кабелю согласована на уровне 118 000 ₽', sender: 'supplier', time: '10:30' },
        { text: 'Отлично, ждем протокол для подписания', sender: 'me', time: '10:35' },
    ]},
    electro: { name: 'ООО "ЭлектроЩит"', avatar: 'ЭЩ', messages: [
        { text: 'Уточните пожалуйста сроки поставки щитов', sender: 'supplier', time: 'вчера' },
        { text: 'Срок — 21 день с момента подписания', sender: 'me', time: 'вчера' },
    ]},
};

function Chats({ user }) {
    const [currentChat, setCurrentChat] = useState(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState({ ...chatsData });
    const isManager = user?.role === 'manager';

    const sendMessage = () => {
        if (!message.trim() || !currentChat) return;
        
        const newMessage = {
            text: message,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages(prev => ({
            ...prev,
            [currentChat]: {
                ...prev[currentChat],
                messages: [...(prev[currentChat]?.messages || []), newMessage]
            }
        }));
        setMessage('');
    };

    const currentData = currentChat ? messages[currentChat] : null;

    return (
        <>
            <div className="page-header">
                <h1>Чаты с поставщиками</h1>
            </div>

            <div className="chats-container">
                <div className="chat-list-panel">
                    {Object.entries(chatsData).map(([id, chat]) => (
                        <div 
                            key={id}
                            className={`chat-contact ${currentChat === id ? 'active' : ''}`}
                            onClick={() => setCurrentChat(id)}
                        >
                            <div className="chat-contact-avatar">{chat.avatar}</div>
                            <div className="chat-contact-info">
                                <div className="chat-contact-name">{chat.name}</div>
                                <div className="chat-contact-preview">
                                    {chat.messages[chat.messages.length - 1]?.text.slice(0, 30)}...
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="chat-main-panel">
                    {currentChat ? (
                        <>
                            <div className="chat-messages">
                                {currentData?.messages.map((msg, idx) => (
                                    <div key={idx} className={`message ${msg.sender === 'me' ? 'outgoing' : 'incoming'}`}>
                                        <div className="message-bubble">
                                            {msg.text}
                                            <div className="message-time">{msg.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {isManager && (
                                <div className="chat-input-area">
                                    <input 
                                        type="text" 
                                        placeholder="Введите сообщение..." 
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && sendMessage()}
                                    />
                                    <button className="btn-primary" onClick={sendMessage}>Отправить →</button>
                                </div>
                            )}
                            {!isManager && (
                                <div className="chat-input-area" style={{ justifyContent: 'center', color: '#999' }}>
                                    У вас нет прав для отправки сообщений
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="empty-chat">Выберите диалог слева</div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Chats;