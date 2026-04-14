import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echoInstance = null;
let echoDisabledLogged = false;
const RUNTIME_CONFIG_KEY = 'sikona_realtime_config';

const DISALLOWED_REVERB_HOSTS = new Set([
  'sikonav2-production.up.railway.app',
]);

const disableRealtime = (message, error) => {
  if (!echoDisabledLogged && import.meta.env.DEV) {
    console.warn(message, error);
    echoDisabledLogged = true;
  }
  if (!echoDisabledLogged) {
    echoDisabledLogged = true;
  }
  return null;
};

const getRuntimeConfig = () => {
  try {
    const raw = localStorage.getItem(RUNTIME_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
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

  const runtimeConfig = getRuntimeConfig();
  const reverbKey = (import.meta.env.VITE_REVERB_APP_KEY || runtimeConfig?.key || '').trim();
  const reverbHost = (import.meta.env.VITE_REVERB_HOST || runtimeConfig?.host || '').trim();
  const portCandidate = Number(import.meta.env.VITE_REVERB_PORT || runtimeConfig?.port || 443);
  const reverbPort = Number.isFinite(portCandidate) && portCandidate > 0 ? portCandidate : 443;
  const reverbScheme = (import.meta.env.VITE_REVERB_SCHEME || runtimeConfig?.scheme || 'https') === 'http' ? 'http' : 'https';

  if (!reverbKey || !reverbHost) {
    return disableRealtime('[Realtime] VITE_REVERB_APP_KEY or VITE_REVERB_HOST is missing. Realtime features are disabled.');
  }

  if (DISALLOWED_REVERB_HOSTS.has(reverbHost)) {
    return disableRealtime('[Realtime] VITE_REVERB_HOST is still using API domain. Set it to the dedicated Railway Reverb domain.');
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
    return disableRealtime('[Realtime] Failed to initialize Echo. Realtime features are disabled.', error);
  }

  return echoInstance;
};

export const subscribeToUserRealtime = (userId, callback) => {
  if (!userId) return () => {};

  const channelName = `users.${userId}`;
  let unsub = () => {};
  let retryId = null;

  const attachListener = () => {
    const echo = getEcho();
    if (!echo) return false;

    try {
      echo.private(channelName)
        .listen('.conversation.updated', callback);
      unsub = () => {
        echo.leave(channelName);
      };
      return true;
    } catch (error) {
      console.warn('[Realtime] User channel subscription failed.', error);
      return false;
    }
  };

  if (!attachListener()) {
    retryId = window.setInterval(() => {
      if (attachListener() && retryId) {
        window.clearInterval(retryId);
        retryId = null;
      }
    }, 3000);
  }

  return () => {
    if (retryId) {
      window.clearInterval(retryId);
    }
    unsub();
  };
};

export const subscribeToRoleRealtime = (roleKey, callback) => {
  if (!roleKey) return () => {};

  const channelName = `roles.${roleKey}`;
  let unsub = () => {};
  let retryId = null;

  const attachListener = () => {
    const echo = getEcho();
    if (!echo) return false;

    try {
      echo.private(channelName)
        .listen('.conversation.updated', callback);
      unsub = () => {
        echo.leave(channelName);
      };
      return true;
    } catch (error) {
      console.warn('[Realtime] Role channel subscription failed.', error);
      return false;
    }
  };

  if (!attachListener()) {
    retryId = window.setInterval(() => {
      if (attachListener() && retryId) {
        window.clearInterval(retryId);
        retryId = null;
      }
    }, 3000);
  }

  return () => {
    if (retryId) {
      window.clearInterval(retryId);
    }
    unsub();
  };
};
