import { useState, useEffect, useRef } from 'react';
import './ChatPanel.css';

const ChatPanel = ({ messages, onSendMessage, currentUser }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const emojis = ['❤️', '😊', '😂', '😍', '🤩', '😢', '👏', '🎉'];

  const handleEmojiClick = (emoji) => {
    onSendMessage(emoji);
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3 className="text-white font-semibold">Chat</h3>
      </div>
      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id || `${msg.timestamp}-${msg.userId || 'system'}-${msg.message}`}
            className={`chat-message ${
              msg.type === 'system' ? 'system' : 
              msg.userId === currentUser.id ? 'own' : 'other'
            }`}
          >
            {msg.type !== 'system' && (
              <span className="message-username">{msg.username}:</span>
            )}
            <span className="message-text">{msg.message}</span>
            {msg.timestamp && (
              <span className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-emoji-bar">
        {emojis.map(emoji => (
          <button
            key={emoji}
            onClick={() => handleEmojiClick(emoji)}
            className="emoji-btn"
          >
            {emoji}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button type="submit" className="chat-send-btn">
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;

