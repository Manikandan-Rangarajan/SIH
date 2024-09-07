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

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://Manikandan:Sayonara2022@jstore.udxro.mongodb.net/?retryWrites=true&w=majority&appName=Jstore";


// Connect to MongoDB
mongoose.connect(uri, {
  
 })
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


// API route example
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});

// All other routes should return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../Client/dist', 'index.html'));
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
    await User.findByIdAndUpdate(userId, { socketId: socket.id });
  });

  socket.on('chat message', async (msg) => {
    // Find user by socket ID
    const user = await User.findOne({ socketId: socket.id });
    const senderUsername = user ? user.username : 'Anonymous';

    // Emit the message with sender info
    io.emit('chat message', { text: msg.text, sender: senderUsername });
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected');
    // Clear socketId on disconnect
    await User.findOneAndUpdate({ socketId: socket.id }, { socketId: null });
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
