import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'


import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import GlobalModal from './components/layout/GlobalModal';



import { BrowserRouter as Router } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <UIProvider>
          <Router>
            <App />
            <GlobalModal />
          </Router>
        </UIProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
