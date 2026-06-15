/*
 * Rozalix chat widget loader.
 *
 * Paste on any site:
 *   <script src="https://app.rozalix.com/embed.js" data-rozalix-key="CLIENT_KEY" async></script>
 *
 * Injects a floating launcher; on click it opens an iframe (served from this
 * script's origin) hosting the chat. Optional attributes:
 *   data-accent="#4F46E5"   launcher colour
 *   data-position="left"    bottom-left instead of bottom-right
 *   data-teaser="..."       teaser message text (set "" to disable)
 *   data-icon="🙂"          override the launcher icon with an emoji
 *                           (default is the Rozalix robot mark)
 */
(function () {
  "use strict";

  // Resolve our own <script> tag (for attributes + origin).
  var script = document.currentScript;
  if (!script) {
    var all = document.getElementsByTagName("script");
    for (var i = all.length - 1; i >= 0; i--) {
      if (all[i].src && all[i].src.indexOf("embed.js") !== -1) {
        script = all[i];
        break;
      }
    }
  }
  if (!script) return;

  var key = script.getAttribute("data-rozalix-key") || "";
  var accent = script.getAttribute("data-accent") || "#4F46E5";
  var side = script.getAttribute("data-position") === "left" ? "left" : "right";
  var teaserText = script.getAttribute("data-teaser");
  if (teaserText === null) teaserText = "👋 Hi there! Have a question?";
  var iconChar = script.getAttribute("data-icon"); // emoji override; default = robot mark
  var origin = new URL(script.src).origin;

  if (window.__rozalixWidgetLoaded) return; // guard against double-include
  window.__rozalixWidgetLoaded = true;

  var open = false;
  var bubble, panel, teaser;

  // Launcher icon = the in-chat agent avatar. Default is the Rozalix "Visor"
  // robot mark (white body, accent visor reads as a cut-out to the disc, lighter
  // ears). A data-icon emoji overrides it to match a custom agent icon.
  var ROBOT_LITE = "color-mix(in srgb," + accent + " 45%,#fff)";
  var ROBOT_SVG =
    '<svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">' +
    '<circle cx="12" cy="2.7" r="1.2" fill="#fff"/>' +
    '<rect x="11.25" y="3.3" width="1.5" height="2.5" rx=".7" fill="#fff"/>' +
    '<rect x="2.6" y="9.6" width="1.6" height="4.2" rx=".8" fill="' + ROBOT_LITE + '"/>' +
    '<rect x="19.8" y="9.6" width="1.6" height="4.2" rx=".8" fill="' + ROBOT_LITE + '"/>' +
    '<rect x="4.5" y="5.8" width="15" height="12.4" rx="4.2" fill="#fff"/>' +
    '<rect x="6.8" y="9.4" width="10.4" height="4.8" rx="2.4" fill="' + accent + '"/>' +
    '<circle cx="9.7" cy="11.8" r="1.05" fill="#fff"/>' +
    '<circle cx="14.3" cy="11.8" r="1.05" fill="#fff"/>' +
    "</svg>";
  var ICON_CHAT = iconChar
    ? '<span style="font-size:27px;line-height:1;display:block">' + iconChar + "</span>"
    : ROBOT_SVG;
  var ICON_CLOSE =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

  function css(el, styles) {
    el.style.cssText = styles.join(";");
  }

  function injectStyles() {
    var s = document.createElement("style");
    s.textContent =
      "@keyframes rzx-teaser-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}" +
      "@keyframes rzx-teaser-pulse{0%{transform:scale(1)}50%{transform:scale(1.035)}100%{transform:scale(1)}}" +
      "@media (prefers-reduced-motion: reduce){.rzx-teaser{animation:rzx-teaser-in .25s ease forwards!important}}";
    document.head.appendChild(s);
  }

  function build() {
    injectStyles();

    // Panel (holds the iframe)
    panel = document.createElement("div");
    css(panel, [
      "position:fixed",
      "z-index:2147483000",
      side + ":20px",
      "bottom:90px",
      "width:400px",
      "max-width:calc(100vw - 40px)",
      "height:600px",
      "max-height:calc(100vh - 120px)",
      "border-radius:16px",
      "overflow:hidden",
      "box-shadow:0 18px 50px rgba(15,23,42,.22),0 4px 12px rgba(15,23,42,.10)",
      "opacity:0",
      "transform:translateY(8px) scale(.98)",
      "transform-origin:bottom " + side,
      "transition:opacity .18s ease,transform .18s ease",
      "display:none",
      "background:#fff",
    ]);
    var iframe = document.createElement("iframe");
    iframe.src = origin + "/embed?key=" + encodeURIComponent(key);
    iframe.title = "Chat";
    iframe.allow = "clipboard-write";
    css(iframe, ["width:100%", "height:100%", "border:0", "display:block"]);
    panel.appendChild(iframe);

    // Launcher bubble
    bubble = document.createElement("button");
    bubble.type = "button";
    bubble.setAttribute("aria-label", "Open chat");
    css(bubble, [
      "position:fixed",
      "z-index:2147483001",
      side + ":20px",
      "bottom:20px",
      "width:58px",
      "height:58px",
      "border-radius:9999px",
      "border:0",
      "cursor:pointer",
      // Solid brand disc with an accent-tinted glow (driven off the client's
      // own colour, so it adapts to any accent — no fixed colours baked in).
      "background:" + accent,
      "box-shadow:0 10px 26px color-mix(in srgb," + accent + " 45%,transparent)",
      "color:#fff",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "transition:transform .15s ease",
    ]);
    bubble.innerHTML = ICON_CHAT;
    bubble.onmouseenter = function () {
      bubble.style.transform = "scale(1.06)";
    };
    bubble.onmouseleave = function () {
      bubble.style.transform = "scale(1)";
    };
    bubble.onclick = toggle;

    document.body.appendChild(panel);
    document.body.appendChild(bubble);

    maybeShowTeaser();
  }

  function maybeShowTeaser() {
    if (!teaserText) return;
    // Intentionally not persisted — the teaser greets the visitor on every
    // fresh page load. Dismissing/opening only hides it for the current view.

    teaser = document.createElement("div");
    teaser.className = "rzx-teaser";
    css(teaser, [
      "position:fixed",
      "z-index:2147483000",
      side + ":20px",
      "bottom:90px",
      "max-width:230px",
      "background:#fff",
      "color:#0F172A",
      "font:500 13.5px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif",
      "padding:12px 30px 12px 14px",
      "border-radius:14px",
      "border-bottom-" + side + "-radius:4px",
      "box-shadow:0 12px 30px rgba(15,23,42,.18)",
      "cursor:pointer",
      "opacity:0",
      "transform-origin:bottom " + side,
      "animation:rzx-teaser-in .25s ease forwards,rzx-teaser-pulse 2.4s ease-in-out .6s infinite",
    ]);
    teaser.textContent = teaserText;
    teaser.onclick = function () {
      dismissTeaser();
      if (!open) toggle();
    };

    var x = document.createElement("button");
    x.type = "button";
    x.setAttribute("aria-label", "Dismiss");
    x.innerHTML = "&times;";
    css(x, [
      "position:absolute",
      "top:6px",
      "right:8px",
      "border:0",
      "background:transparent",
      "color:#94A3B8",
      "font-size:18px",
      "line-height:1",
      "cursor:pointer",
      "padding:2px",
    ]);
    x.onclick = function (e) {
      e.stopPropagation();
      dismissTeaser();
    };
    teaser.appendChild(x);

    setTimeout(function () {
      if (!open && document.body) document.body.appendChild(teaser);
    }, 1600);
  }

  function dismissTeaser() {
    if (teaser && teaser.parentNode) teaser.parentNode.removeChild(teaser);
    teaser = null;
  }

  function toggle() {
    open = !open;
    dismissTeaser();
    if (open) {
      panel.style.display = "block";
      void panel.offsetHeight; // reflow so the transition runs
      panel.style.opacity = "1";
      panel.style.transform = "translateY(0) scale(1)";
      bubble.innerHTML = ICON_CLOSE;
      bubble.setAttribute("aria-label", "Close chat");
    } else {
      panel.style.opacity = "0";
      panel.style.transform = "translateY(8px) scale(.98)";
      bubble.innerHTML = ICON_CHAT;
      bubble.setAttribute("aria-label", "Open chat");
      setTimeout(function () {
        if (!open) panel.style.display = "none";
      }, 200);
    }
  }

  if (document.body) build();
  else document.addEventListener("DOMContentLoaded", build);
})();
