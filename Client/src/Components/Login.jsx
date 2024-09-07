import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
    console.log('Email:', email);
    console.log('Password:', password);
    navigate('/chat');
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-bold mb-2">Email:</label>
            <input 
              type="email" 
              id="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              placeholder="Enter your email"
              required 
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 font-bold mb-2">Password:</label>
            <input 
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              placeholder="Enter your password"
              required 
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
