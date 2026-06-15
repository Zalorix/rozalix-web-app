/*
 * Rozalix Console service worker.
 *
 * Today it does two jobs: (1) makes the app installable + gives a graceful
 * offline screen, and (2) is wired for Web Push so that — once the backend
 * sends notifications (VAPID) — clients get "new lead" / "AI escalated a chat"
 * alerts even when the app is closed. No push subscription happens until a
 * backend public key exists, so this is inert-but-ready for now.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Minimal offline fallback for page navigations. Dynamic data and auth are left
// to the network — we only show a friendly screen when the device is offline.
const OFFLINE_HTML =
  '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">' +
  "<title>Offline — Rozalix</title><style>" +
  "html,body{height:100%;margin:0}body{display:flex;align-items:center;justify-content:center;" +
  "font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0F172A;background:#F1F5F9;" +
  "text-align:center;padding:24px}.c{max-width:320px}.d{width:56px;height:56px;border-radius:16px;" +
  "background:#4F46E5;margin:0 auto 16px}h1{font-size:18px;margin:0 0 6px}p{color:#64748B;margin:0}" +
  "</style></head><body><div class=c><div class=d></div><h1>You're offline</h1>" +
  "<p>Reconnect to the internet and try again.</p></div></body></html>";

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode !== "navigate") return; // let everything else hit the network normally
  event.respondWith(
    fetch(req).catch(
      () =>
        new Response(OFFLINE_HTML, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
    ),
  );
});

// --- Web Push (ready for the backend) ---
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: "Rozalix", body: event.data.text() };
  }
  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [100, 50, 100],
    data: { url: data.url || "/" },
  };
  event.waitUntil(
    self.registration.showNotification(data.title || "Rozalix", options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((list) => {
      for (const c of list) {
        if ("focus" in c) return c.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
