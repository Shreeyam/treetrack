import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import LandingPage from './LandingPage2';
// import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* If you prefer to load these fonts via a link tag, consider adding them to your index.html */}
    <App />
    {/* <LandingPage /> */}
  </React.StrictMode>
);
