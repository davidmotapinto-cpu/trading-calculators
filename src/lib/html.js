// JSX-like tagged-template helper for a build-free environment (no Node/bundler here).
// In a bundled app, swap every `html\`...\`` call for real JSX and delete this file —
// the component logic underneath is unchanged either way.
import htm from "htm";
import React from "react";

// React's DOM renderer expects `className`/`htmlFor`, not the HTML attribute
// names `class`/`for` used throughout these templates (htm is renderer-agnostic
// and normally pairs with Preact, which accepts `class` directly) — translate
// here so every component can use plain HTML attribute names.
function h(type, props, ...children) {
  if (props && typeof type === "string") {
    if ("class" in props) {
      const { class: className, ...rest } = props;
      props = { ...rest, className };
    }
    if ("for" in props) {
      const { for: htmlFor, ...rest } = props;
      props = { ...rest, htmlFor };
    }
  }
  return React.createElement(type, props, ...children);
}

export const html = htm.bind(h);
