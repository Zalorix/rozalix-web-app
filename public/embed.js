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
  var origin = new URL(script.src).origin;

  if (window.__rozalixWidgetLoaded) return; // guard against double-include
  window.__rozalixWidgetLoaded = true;

  var open = false;
  var bubble, panel;

  var ICON_CHAT =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>';
  var ICON_CLOSE =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

  function css(el, styles) {
    el.style.cssText = styles.join(";");
  }

  function build() {
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
      "z-index:2147483000",
      side + ":20px",
      "bottom:20px",
      "width:58px",
      "height:58px",
      "border-radius:9999px",
      "border:0",
      "cursor:pointer",
      "box-shadow:0 10px 26px rgba(15,23,42,.26)",
      "background:" + accent,
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
  }

  function toggle() {
    open = !open;
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
