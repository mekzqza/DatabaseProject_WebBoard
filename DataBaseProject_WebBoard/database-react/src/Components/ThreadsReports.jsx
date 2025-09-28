import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function ThreadsReports() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const role = (user && user.role) || (() => {
      try {
        const raw = localStorage.getItem('user');
        if (raw) return JSON.parse(raw).role;
      } catch (e) { }
      return null;
    })();
    if (!role || String(role).toLowerCase() !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Thread Reports (Admin)</h2>
      <p>This is a placeholder admin page — you can list reported threads here.</p>
      {/* TODO: implement reports listing */}
    </div>
  );
}
