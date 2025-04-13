import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import LandingPage from './LandingPage';

const { pathname } = window.location;

const ComponentToRender = pathname === '/landing' ? <LandingPage /> : <App />;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {ComponentToRender}
  </React.StrictMode>
);
