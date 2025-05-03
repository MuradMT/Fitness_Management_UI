import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { backendUrl } from '../utils/constants';

export default function PrivateRoute({ children, role }) {
  const { user } = useAuth();
  const token = localStorage.getItem('accessToken');
  const [allowed, setAllowed] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    // if not logged in
    if (!user || !token) {
      setAllowed(false);
      return;
    }
    // fetch admin status once
    const fetchAdmin = async () => {
      try {
        const res = await axios.get(
          `${backendUrl}/users/is-admin`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsAdmin(res.data.success === true);
      } catch {
        setIsAdmin(false);
      }
    };
    fetchAdmin();
  }, [user, token]);

  useEffect(() => {
    // wait until admin status resolved
    if (isAdmin === null) return;
    // no specific role required
    if (!role) {
      setAllowed(true);
      return;
    }
    if (role === 'admin') {
      setAllowed(isAdmin);
    } else if (role === 'trainer') {
      setAllowed(user.isTrainer === true);
    } else if (role === 'member') {
      setAllowed(!user.isTrainer && !isAdmin);
    } else {
      setAllowed(false);
    }
  }, [role, isAdmin, user]);

  if (allowed === null) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Checking permissions...</div>;
  }
  if (!allowed) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
