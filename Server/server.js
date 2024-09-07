const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Import your User model
const User = require('./db'); // Ensure this model file is correctly set up

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../Client/dist')));

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Use CORS middleware

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/chat")
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { email, username, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({ email, username, password: hashedPassword, realpassword: password });
    await newUser.save();

    res.status(201).json({ status: 'success', message: 'User registered successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Generate token (optional)
    const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });

    res.status(200).json({ status: 'success', message: 'Login successful', token, userId: user._id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// Search users endpoint
app.get('/search-users', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Query parameter is required' });
  }

  try {
    // Use regex to allow partial matching (case-insensitive)
    const users = await User.find({ username: new RegExp(query, 'i') }).select('_id username');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Socket.IO configuration
io.on('connection', (socket) => {
  console.log('A user connected');

  // Store socketId with user
  socket.on('set username', async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('Invalid userId');
      return;
    }
    const user = await User.findByIdAndUpdate(userId, { socketId: socket.id });
    if (user) {
      console.log(`${user.username} connected with socket ID: ${socket.id}`);
    }
  });

  // Handle private messaging
  socket.on('private message', async (msg) => {
    const { recipientId, text } = msg;
    const recipient = await User.findById(recipientId);

    if (recipient && recipient.socketId) {
      const sender = await User.findOne({ socketId: socket.id });
      const senderUsername = sender ? sender.username : 'Anonymous';

      // Send message to the recipient only
      io.to(recipient.socketId).emit('chat message', {
        text,
        sender: senderUsername,
      });

      console.log(`Message sent from ${senderUsername} to ${recipient.username}`);
    } else {
      console.log('Recipient not found or not connected');
    }
  });

  // Broadcast chat message
  socket.on('chat message', async (msg) => {
    const user = await User.findOne({ socketId: socket.id });
    const senderUsername = user ? user.username : 'Anonymous';
    io.emit('chat message', { text: msg.text, sender: senderUsername });
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('User disconnected');
    await User.findOneAndUpdate({ socketId: socket.id }, { socketId: null });
  });
});

// All other routes should return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../Client/dist', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
