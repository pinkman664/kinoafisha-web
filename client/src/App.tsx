import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import MovieDetail from './pages/MovieDetail';
import Admin from './pages/Admin';
import SeatSelection from './pages/SeatSelection';
import Payment from './pages/Payment';
import { Layout } from './components/Layout';
import { ModalProvider } from './context/ModalContext';

function App() {
  return (
    <ModalProvider>
      <BrowserRouter>
        {/* Глобальный фон */}
        <div className="bg-blobs">
          <div className="blob"></div>
          <div className="blob blob--2"></div>
        </div>

        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/login" element={<Layout hideNavbar><Login /></Layout>} />
          <Route path="/register" element={<Layout hideNavbar><Register /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/movie/:id" element={<Layout><MovieDetail /></Layout>} />
          <Route path="/admin" element={<Layout><Admin /></Layout>} />
          <Route path="/session/:sessionId/seats" element={<Layout><SeatSelection /></Layout>} />
          <Route path="/payment/:ticketId" element={<Layout><Payment /></Layout>} />
        </Routes>
      </BrowserRouter>
    </ModalProvider>
  );
}

export default App;
