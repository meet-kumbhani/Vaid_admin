import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Demo from './Demo';
import Dashboard from './Dashboard';
import 'bootstrap/dist/css/bootstrap.css';
// import ProtectedRoute from './ProtectedRoute';
import { auth } from './firebase.config';
import Evidences from './Evidences';
import EvidenceDetails from './EvidenceDetails';
// import PublicRoute from './PublicRoute';

const App = () => {
  const [user, setUser] = useState(null);
  console.log(user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <h1>Loading...</h1>
    );
  }

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Demo />} />
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />
          <Route
            path="/evidence"
            element={<Evidences />}
          />
          <Route
            path="/evidencedetails/:id"
            element={<EvidenceDetails />}
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
