import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echoInstance = null;
let echoDisabledLogged = false;

const toAbsoluteAuthEndpoint = (apiBase) => {
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    return `${apiBase}/broadcasting/auth`;
  }

  const normalized = apiBase.startsWith('/') ? apiBase : `/${apiBase}`;
  return `${window.location.origin}${normalized}/broadcasting/auth`;
};

export const getEcho = () => {
  if (echoInstance) return echoInstance;

  const reverbKey = (import.meta.env.VITE_REVERB_APP_KEY || '').trim();
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
      wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
      wsPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
      wssPort: Number(import.meta.env.VITE_REVERB_PORT || 443),
      forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'https') === 'https',
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
