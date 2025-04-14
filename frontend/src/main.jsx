import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import LandingPage from './LandingPage';
import AuthForm from './components/auth/AuthForm';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<App />} />
        <Route path="/login" element={<AuthForm />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
