const mongoose = require('mongoose');

const Users = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  realpassword: { type: String, required: true },
  socketId: { type: String } 
});

module.exports = mongoose.model('User', Users);
