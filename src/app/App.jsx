import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import AuthPage from '../features/auth/AuthPage.jsx';
import HostDashboard from '../features/guests/HostDashboard.jsx';
import { signOutHost } from '../features/auth/authService.js';
import PublicEventPage from '../features/event/PublicEventPage.jsx';
import EditRsvpPage from '../features/rsvp/EditRsvpPage.jsx';
import { getFirebaseClient } from '../services/firebase/client.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [configurationError, setConfigurationError] = useState('');
  const pathSegments = window.location.pathname.split('/').filter(Boolean);

  useEffect(() => {
    try {
      const { auth } = getFirebaseClient();
      return onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setReady(true);
      });
    } catch (error) {
      setConfigurationError(error.message);
      setReady(true);
    }
  }, []);

  if (!ready) return <main className="page-loading" role="status">Carregando...</main>;
  if (configurationError) {
    return (
      <main className="page-loading" role="alert">
        <h1>Configuração necessária</h1>
        <p>{configurationError}</p>
        <p>Copie `.env.example` para `.env.local` e preencha a configuração pública do Firebase.</p>
      </main>
    );
  }
  if (pathSegments[0] === 'event' && pathSegments[1]) {
    return <PublicEventPage eventId={decodeURIComponent(pathSegments[1])} />;
  }
  if (pathSegments[0] === 'edit' && pathSegments[1]) {
    return <EditRsvpPage token={decodeURIComponent(pathSegments[1])} />;
  }
  if (!user) return <AuthPage />;

  return <HostDashboard user={{ ...user, signOut: signOutHost }} />;
}