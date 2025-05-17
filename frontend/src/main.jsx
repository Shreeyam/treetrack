// main.jsx
import React, { useState, useEffect } from 'react'; // Import useState
import ReactDOM from 'react-dom/client';
// Import BrowserRouter here, but not useNavigate
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
// Import useNavigate here
import { useNavigate } from 'react-router'; // Correct import for useNavigate
import App from './App';
import LandingPage from './LandingPage';
import AuthForm from './components/auth/AuthForm';
import ReloadOnErrorBoundary from '@/components/ReloadOnErrorBoundary';
import AboutPage from './AboutPage'; // Assuming AboutPage is here\
import PrivacyPage from './PrivacyPage'; // Assuming Privacy is here
import TermsOfServicePage from './TermsOfServicePage'; // Assuming Privacy is here
import PricingPage from './PricingPage';
import AccountPage from './AccountPage'; 
import { authClient } from "@/lib/auth";

function Root() {
  // --- Authentication States ---`
  const { data, isPending, error, refetch } = authClient.useSession();

  return (
    <ReloadOnErrorBoundary>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/tos" element={<TermsOfServicePage />} />
        <Route path="/app" element={<App user={data?.user} userPending={isPending} />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/login" element={<AuthForm />} />
        <Route path="/register" element={<AuthForm isRegister={true} />} />
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
