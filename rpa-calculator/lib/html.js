import htm from "htm";
import React from "react";

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
