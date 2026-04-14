import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echoInstance = null;
let echoDisabledLogged = false;

const DEFAULT_REVERB_CONFIG = {
  key: 'qothysbfflfhyoj9xbt9',
  host: 'sikonav2-production.up.railway.app',
  port: 443,
  scheme: 'https',
};

const toAbsoluteAuthEndpoint = (apiBase) => {
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    return `${apiBase}/broadcasting/auth`;
  }

  const normalized = apiBase.startsWith('/') ? apiBase : `/${apiBase}`;
  return `${window.location.origin}${normalized}/broadcasting/auth`;
};

export const getEcho = () => {
  if (echoInstance) return echoInstance;

  const reverbKey = (import.meta.env.VITE_REVERB_APP_KEY || DEFAULT_REVERB_CONFIG.key).trim();
  const reverbHost = (import.meta.env.VITE_REVERB_HOST || DEFAULT_REVERB_CONFIG.host).trim();
  const rawPort = Number(import.meta.env.VITE_REVERB_PORT || DEFAULT_REVERB_CONFIG.port);
  const reverbPort = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : DEFAULT_REVERB_CONFIG.port;
  const reverbScheme = (import.meta.env.VITE_REVERB_SCHEME || DEFAULT_REVERB_CONFIG.scheme) === 'http' ? 'http' : 'https';

  if (!reverbKey) {
    if (!echoDisabledLogged) {
      console.warn('[Realtime] VITE_REVERB_APP_KEY is missing. Realtime features are disabled.');
      echoDisabledLogged = true;
    }
    return null;
  }

  if (!window?.Pusher) {
    window.Pusher = Pusher;
  }

  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('token');

  try {
    echoInstance = new Echo({
      broadcaster: 'reverb',
      key: reverbKey,
      wsHost: reverbHost,
      wsPort: reverbPort,
      wssPort: reverbPort,
      forceTLS: reverbScheme === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: toAbsoluteAuthEndpoint(apiBase),
      auth: {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    });
  } catch (error) {
    if (!echoDisabledLogged) {
      console.warn('[Realtime] Failed to initialize Echo. Realtime features are disabled.', error);
      echoDisabledLogged = true;
    }
    return null;
  }

  return echoInstance;
};

export const subscribeToUserRealtime = (userId, callback) => {
  if (!userId) return () => {};

  const echo = getEcho();
  if (!echo) return () => {};

  const channelName = `users.${userId}`;

  try {
    echo.private(channelName)
      .listen('.conversation.updated', callback);
  } catch (error) {
    console.warn('[Realtime] User channel subscription failed.', error);
    return () => {};
  }

  return () => {
    echo.leave(channelName);
  };
};

export const subscribeToRoleRealtime = (roleKey, callback) => {
  if (!roleKey) return () => {};

  const echo = getEcho();
  if (!echo) return () => {};

  const channelName = `roles.${roleKey}`;

  try {
    echo.private(channelName)
      .listen('.conversation.updated', callback);
  } catch (error) {
    console.warn('[Realtime] Role channel subscription failed.', error);
    return () => {};
  }

  return () => {
    echo.leave(channelName);
  };
};
