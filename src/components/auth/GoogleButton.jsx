import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/auth.api';
import { readJwtPayload } from '../../services/apiClient';
import './GoogleButton.css';

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID
  || '99651564944-tvufomf1gr0jbjbh9fhurcdes5qpg3ok.apps.googleusercontent.com';
const scriptUrl = 'https://accounts.google.com/gsi/client';
let loadingScript;
let initializedGoogle;
let activeCredentialHandler;

function initializeGoogle(google) {
  if (initializedGoogle === google) return;
  google.initialize({
    client_id: clientId,
    ux_mode: 'popup',
    callback: (response) => activeCredentialHandler?.(response),
  });
  initializedGoogle = google;
}

function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (!loadingScript) {
    loadingScript = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = scriptUrl;
      script.onload = () => resolve(window.google?.accounts?.id);
      script.onerror = () => {
        script.remove();
        loadingScript = undefined;
        reject(new Error('Google Sign-In could not load.'));
      };
      document.head.append(script);
    });
  }
  return loadingScript;
}

function getGoogleAvatar(credential) {
  try {
    const picture = new URL(readJwtPayload(credential)?.picture);
    if (picture.protocol === 'https:' && picture.hostname.endsWith('.googleusercontent.com')) {
      return picture.href;
    }
  } catch {
    // The Google profile may have no picture.
  }
  return undefined;
}

export default function GoogleButton() {
  const container = useRef(null);
  const signingIn = useRef(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const { saveSession } = useAuth();

  useEffect(() => {
    const element = container.current;
    let active = true;
    const handleCredential = async ({ credential }) => {
      if (!active || !credential || signingIn.current) return;
      signingIn.current = true;
      setError('');
      setStatus('Signing in with Google…');
      try {
        const result = await authApi.signInWithGoogle(credential);
        if (active) {
          await saveSession(result.tokens, {
            userId: result.user?.id,
            isOnboarded: result.is_onboarded,
            avatarUrl: getGoogleAvatar(credential),
          });
        }
      } catch (error) {
        if (active) setError(error.message);
      } finally {
        signingIn.current = false;
        if (active) setStatus('');
      }
    };

    loadGoogle().then((google) => {
      if (!active) return;
      if (!google) throw new Error('Google Sign-In could not load.');
      initializeGoogle(google);
      activeCredentialHandler = handleCredential;
      google.renderButton(element, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: Math.max(200, Math.min(400, Math.floor(element.clientWidth))),
      });
    }).catch((error) => {
      if (active) setError(error.message);
    });

    return () => {
      active = false;
      if (activeCredentialHandler === handleCredential) activeCredentialHandler = undefined;
      element.replaceChildren();
    };
  }, [saveSession]);

  return (
    <div className="auth-google">
      <div ref={container} aria-busy={Boolean(status)} style={{ minHeight: 40 }} />
      {status && <p role="status">{status}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
