import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000');

function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Retrieve user ID from local storage
    const userId = localStorage.getItem('userId');

    if (userId) {
      // Fetch username from backend
      axios.get(`http://localhost:5000/user/${userId}`)
        .then(response => {
          setUsername(response.data.username);
          socket.emit('set username', userId);
        })
        .catch(error => {
          console.error('Error fetching user:', error);
        });
    }

    socket.on('connect', () => {
      if (userId) {
        socket.emit('set username', userId);
      }
    });

    socket.on('chat message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off('connect');
      socket.off('chat message');
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() !== '') {
      socket.emit('chat message', { text: message });
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <h1 className="text-2xl font-bold text-center p-4 bg-blue-600 text-white">Chat Application</h1>

      <div className="flex-grow p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message mb-4 p-3 rounded-lg w-2/3
              ${msg.sender === username ? 'ml-auto bg-blue-500 text-white' : 'mr-auto bg-gray-200 text-black'}`}
          >
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex p-4 bg-white border-t border-gray-300">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
          placeholder="Type a message"
        />
        <button
          type="submit"
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
