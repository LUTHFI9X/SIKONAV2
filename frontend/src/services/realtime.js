import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echoInstance = null;

const toAbsoluteAuthEndpoint = (apiBase) => {
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    return `${apiBase}/broadcasting/auth`;
  }

  const normalized = apiBase.startsWith('/') ? apiBase : `/${apiBase}`;
  return `${window.location.origin}${normalized}/broadcasting/auth`;
};

export const getEcho = () => {
  if (echoInstance) return echoInstance;

  if (!window?.Pusher) {
    window.Pusher = Pusher;
  }

  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('token');

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
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

  return echoInstance;
};

export const subscribeToUserRealtime = (userId, callback) => {
  if (!userId) return () => {};

  const echo = getEcho();
  const channelName = `users.${userId}`;

  echo.private(channelName)
    .listen('.conversation.updated', callback);

  return () => {
    echo.leave(channelName);
  };
};

export const subscribeToRoleRealtime = (roleKey, callback) => {
  if (!roleKey) return () => {};

  const echo = getEcho();
  const channelName = `roles.${roleKey}`;

  echo.private(channelName)
    .listen('.conversation.updated', callback);

  return () => {
    echo.leave(channelName);
  };
};
