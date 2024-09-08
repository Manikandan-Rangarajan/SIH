import express from 'express';
import http from 'http';
import path from 'path';
import { Server as socketIo } from 'socket.io';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from "./db.js";
import RBAC, { JsonRBACProvider, RBACValidationError } from '@yanfoo/rbac-a';
// import Dataperms from './permission-data.js';

// Initialize express
const app = express();
const server = http.createServer(app);
const io = new socketIo(server);

// Serve static files from the React app
app.use(express.static(path.join(path.resolve(), '../Client/dist')));

// Middleware
app.use(bodyParser.json());
app.use(cors());


//Acl communication setup due to lacking in techsetup this feature in under devlopment if we get
//required tech support
// Authorization middleware
// function authorize(roles, permission) {
//   return async (req, res, next) => {
//     try {
//       const hasPermission = await Promise.all(roles.map(role => rbac.can(role, permission)));
//       if (hasPermission.some(permission => permission)) {
//         next(); // Proceed if permission is granted
//       } else {
//         res.status(403).send('Forbidden: You do not have access to this resource.');
//       }
//     } catch (err) {
//       console.error('Error checking permissions:', err);
//       res.status(500).send('Internal server error');
//     }
//   };
// }

// const rbac = new RBAC({
//   provider: new JsonRBACProvider(Dataperms),
//   checkOptions: {
//     onError: err => {
//       if (err instanceof RBACValidationError) {
//         console.error('Error while checking %s with user roles %s',
//           JSON.stringify(err.user),
//           JSON.stringify(err.role),
//           err
//         );
//       } else {
//         console.error(err);
//       }
//     }
//   }
// });

// async function checkPermissions(userId, actions) {
//   try {
//     const result = await rbac.check(userId, actions);

//     if (isNaN(result)) {
//       console.log('User does not have the required permissions or the action is not recognized.');
//     } else {
//       console.log(`Access level for user ${userId} with actions '${actions}': ${result}`);
//     }
//   } catch (error) {
//     console.error('Error checking permissions:', error);
//   }
// }

// // Example usage
// await checkPermissions(3, 'login');       // Check if user #3 can 'login'
// await checkPermissions(2, 'create, edit'); // Check if user #2 can 'create' and 'edit'
// await checkPermissions(1, 'edit');        // Check if user #1 can 'edit'


// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/chat")
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { email, username, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
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
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'error', message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });

    res.status(200).json({ status: 'success', message: 'Login successful', token, userId: user._id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// Get contacts endpoint
app.get('/contacts/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate('contacts', '_id username');
    if (user) {
      res.status(200).json(user.contacts);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Search users endpoint
app.get('/search-users', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Query parameter is required' });
  }

  try {
    const users = await User.find({ username: new RegExp(query, 'i') }).select('_id username');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// // Approve freight forwarder endpoint
// app.post('/approveFreightForwarder', authorize(['client', 'admin'], 'approve_ff'), async (req, res) => {
//   const { clientId, freightForwarderId } = req.body;

//   try {
//     const freightForwarder = await User.findById(freightForwarderId);
//     if (!freightForwarder) {
//       return res.status(404).json({ message: 'Freight forwarder not found' });
//     }

//     freightForwarder.role = 'approvedFreightForwarder';
//     await freightForwarder.save();

//     res.status(200).json({ message: 'Freight forwarder approved successfully' });
//   } catch (error) {
//     console.error('Error approving freight forwarder:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// Socket.IO configuration
io.on('connection', (socket) => {
  console.log('A user connected');

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

  socket.on('private message', async (msg) => {
    const { recipientId, text } = msg;
    const recipient = await User.findById(recipientId);

    if (recipient && recipient.socketId) {
      const sender = await User.findOne({ socketId: socket.id });

      if (sender) {
        if (!sender.contacts.includes(recipient._id)) {
          sender.contacts.push(recipient._id);
          await sender.save();
        }
        if (!recipient.contacts.includes(sender._id)) {
          recipient.contacts.push(sender._id);
          await recipient.save();
        }

        io.to(recipient.socketId).emit('chat message', {
          text,
          sender: sender.username,
        });

        console.log(`Message sent from ${sender.username} to ${recipient.username}`);
      }
    } else {
      console.log('Recipient not found or not connected');
    }
  });

  socket.on('chat message', async (msg) => {
    const user = await User.findOne({ socketId: socket.id });
    const senderUsername = user ? user.username : 'Anonymous';
    io.emit('chat message', { text: msg.text, sender: senderUsername });
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected');
    await User.findOneAndUpdate({ socketId: socket.id }, { socketId: null });
  });
});

// All other routes should return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(path.resolve(), '../Client/dist', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
