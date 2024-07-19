
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import CallData from './components/CallData';
import AddNotes from './components/AddNotes';
import Login from './components/Login';

const App = () => {
  return (
      <Router>
        <Header />
        <div className="container mt-4">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/calls" element={<CallData />} />
            <Route path="/calls/:id" element={<AddNotes />} />
          </Routes>
        </div>
      </Router>
  );
};

export default App;