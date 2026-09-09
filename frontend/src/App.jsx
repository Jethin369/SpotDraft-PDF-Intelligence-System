import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Viewer from './pages/Viewer';

function PrivateRoute({ children }) {
  const user = localStorage.getItem('userId');
  return user ? children : <Navigate to="/" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/view/:docId" element={<Viewer />} />
        <Route path="/shared/:linkId" element={<Viewer />} />
      </Routes>
    </Router>
  );
}

export default App;