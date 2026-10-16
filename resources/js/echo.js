import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

let echoInstance = null;

export function getEcho() {
  if (echoInstance) return echoInstance;

  const key = import.meta.env.VITE_PUSHER_APP_KEY;
  const cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap1';

  if (!key) {
    console.warn('[ZECRUS Realtime] VITE_PUSHER_APP_KEY belum diisi di .env. Realtime WebSocket dalam mode standby.');
    return null;
  }

  try {
    echoInstance = new Echo({
      broadcaster: 'pusher',
      key: key,
      cluster: cluster,
      forceTLS: true
    });
    return echoInstance;
  } catch (err) {
    console.error('[ZECRUS Realtime] Gagal inisialisasi Pusher Echo:', err);
    return null;
  }
}

export default getEcho;
