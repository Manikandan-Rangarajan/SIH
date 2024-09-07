import React, { useState, useEffect } from 'react';
import './App.css';
import Chat from './Components/Chat';
import Login from './Components/Login';
import { BrowserRouter as Router, Switch, Routes, Route } from 'react-router-dom';
import Signup from './Components/SignUp';

function App(){
  return (
    <Router>
     <Routes>
         <Route path='/' element={<Signup/>}/>
         <Route path='/login' element={<Login/>}/>
         <Route path='/chat' element={<Chat/>}/>
     </Routes>
    </Router>
  );
}
export default App;
