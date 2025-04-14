import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import App from './App';
import LandingPage from './LandingPage';
import AuthForm from './components/auth/AuthForm';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Route for the landing page */}
        <Route path="/" element={<LandingPage />} />
        {/* Default route renders App */}
        <Route path="/app" element={<App />} />
        <Route path="/login" element={<AuthForm />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
