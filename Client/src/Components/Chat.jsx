import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

// Connect to the server
const socket = io('http://localhost:5000');

function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [searchInitiated, setSearchInitiated] = useState(false); // Track if search was initiated

  useEffect(() => {
    // Retrieve user ID from local storage
    const userId = localStorage.getItem('userId');
    console.log('User ID from local storage:', userId); // Check user ID

    if (userId) {
      setCurrentUserId(userId);

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

    socket.on('private message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off('connect');
      socket.off('chat message');
      socket.off('private message');
    };
  }, []);

  // Handle search users
  const handleSearchUsers = async () => {
    if (searchQuery.trim() !== '') {
      setSearchInitiated(true); // Mark search as initiated
      try {
        const response = await axios.get(`http://localhost:5000/search-users?query=${searchQuery}`);
        console.log('All Users:', response.data); // Check all users
        setSearchResults(response.data);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    }
  };

  // Select a user to send a private message
  const handleSelectUser = (user) => {
    setRecipientId(user._id);
    setSelectedUser(user);
    setMessages([]); // Clear previous messages when selecting a new user
    setSearchQuery(''); // Clear search query
    setSearchResults([]); // Clear search results
    setSearchInitiated(false); // Reset search initiation state
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() !== '' && recipientId) {
      // Emit private message event
      socket.emit('private message', { recipientId, text: message, sender: username });
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header with FreightX and search bar */}
      <div className="flex items-center p-4 bg-blue-600 text-white">
        <h1 className="text-2xl font-bold flex-grow pl-4">FreightX</h1>
        <div className="flex-shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border border-gray-400 rounded-md bg-white text-gray-800 focus:outline-none focus:border-blue-500"
            placeholder="Search users to chat"
          />
          <button
            onClick={handleSearchUsers}
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Search
          </button>
        </div>
      </div>

      {/* Display current recipient */}
      <div className="text-center p-2 bg-gray-200">
        {selectedUser ? `Currently chatting with: ${selectedUser.username}` : 'Select a user to start chatting'}
      </div>

      {/* Conditionally render search results */}
      {searchInitiated && (
        <div className="p-4 bg-white border border-gray-300 rounded-md shadow-md">
          {searchResults.length > 0 ? (
            searchResults.map((user) => (
              <div
                key={user._id}
                onClick={() => handleSelectUser(user)}
                className={`p-2 cursor-pointer ${selectedUser && selectedUser._id === user._id ? 'bg-blue-100' : 'bg-gray-100'} rounded-md`}
              >
                {user.username}
              </div>
            ))
          ) : (
            <div className="p-2 text-gray-500">No users found</div>
          )}
        </div>
      )}

      <div className="flex-grow p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex mb-4 ${msg.sender === username ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`p-3 rounded-lg max-w-xs ${msg.sender === username ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}`}
            >
              <strong>{msg.sender}:</strong> {msg.text}
            </div>
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

      {/* Footer with current user */}
      <div className="p-2 text-center text-black bg-gray-200 border-t border-gray-300">
        Logged in as: {username || 'Loading...'}
      </div>
    </div>
  );
}

export default Chat;
