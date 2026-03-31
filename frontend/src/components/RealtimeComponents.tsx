import React, { useState } from 'react';

/**
 * Realtime Components for PyMastery
 * Contains real-time collaboration and communication features
 */

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ user: string; text: string; timestamp: Date }>>([]);
  const [inputMessage, setInputMessage] = useState('');

  const sendMessage = () => {
    if (inputMessage.trim()) {
      setMessages([...messages, {
        user: 'You',
        text: inputMessage,
        timestamp: new Date()
      }]);
      setInputMessage('');
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className="message">
            <span className="message-user">{msg.user}:</span>
            <span className="message-text">{msg.text}</span>
            <span className="message-time">{msg.timestamp.toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export const LiveCodeEditor: React.FC = () => {
  const [code, setCode] = useState('// Start coding here...');
  const [collaborators] = useState(['Alice', 'Bob']);

  return (
    <div className="live-code-editor">
      <div className="editor-header">
        <h3>Live Code Editor</h3>
        <div className="collaborators">
          {collaborators.map((collaborator, index) => (
            <span key={index} className="collaborator">
              {collaborator}
            </span>
          ))}
        </div>
      </div>
      <textarea
        className="code-editor"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Write your code here..."
      />
    </div>
  );
};

export const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }>>([]);

  const addNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    const id = Date.now().toString();
    setNotifications([...notifications, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  return (
    <div className="notification-system">
      <button onClick={() => addNotification('Test notification', 'info')}>
        Test Notification
      </button>
      <div className="notifications-container">
        {notifications.map((notification) => (
          <div key={notification.id} className={`notification notification--${notification.type}`}>
            {notification.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export const OnlineUsers: React.FC<{ users: Array<{ name: string; status: 'online' | 'away' | 'offline' }> }> = ({ 
  users 
}) => {
  return (
    <div className="online-users">
      <h3>Online Users</h3>
      <div className="users-list">
        {users.map((user, index) => (
          <div key={index} className={`user user--${user.status}`}>
            <div className="user-avatar"></div>
            <span className="user-name">{user.name}</span>
            <div className={`status-indicator status--${user.status}`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatInterface;
