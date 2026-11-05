import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { AvisosProvider } from './components/Avisos.jsx';
import { iniciarTema } from './utils/tema.js';
import './index.css';

// Restaura el modo oscuro/claro antes de dibujar la primera pantalla
iniciarTema();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AvisosProvider>
            <App />
          </AvisosProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
