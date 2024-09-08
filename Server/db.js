import mongoose from "mongoose";

const UsersSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  realpassword: { type: String, required: true },
  socketId: { type: String },
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // storing contacts of previously texted users
});

// Using default export for the User model
const User = mongoose.model('User', UsersSchema);
export default User;
