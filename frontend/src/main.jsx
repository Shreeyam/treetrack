import React, { useState } from 'react'; // Import useState
import ReactDOM from 'react-dom/client';
// Import BrowserRouter here, but not useNavigate
import { BrowserRouter, Routes, Route } from 'react-router';
// Import useNavigate here
import { useNavigate } from 'react-router'; // Correct import for useNavigate
import App from './App';
import LandingPage from './LandingPage';
import AuthForm from './components/auth/AuthForm';
import ReloadOnErrorBoundary from '@/components/ReloadOnErrorBoundary';
import AboutPage from './AboutPage'; // Assuming AboutPage is here

// Define a Root component to hold state
function Root() {
  // --- Authentication States ---
  const [user, setUser] = useState(null); 
  const navigate = useNavigate(); 

  // You might want a function here to handle successful login/registration
  const handleLogin = (userData) => {
    setUser(userData);
    navigate('/app'); // Redirect to the app page after login
  };

  return (
    <ReloadOnErrorBoundary>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        {/* Pass user state to App */}
        <Route path="/app" element={<App user={user} setUser={setUser} />} />
        {/* Pass setUser or a handler function to AuthForm */}
        <Route path="/login" element={<AuthForm onLogin={handleLogin} />} />
        <Route path="/register" element={<AuthForm isRegister={true} onLogin={handleLogin} />} />
      </Routes>
    </ReloadOnErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>
);
