import { createRoot } from "react-dom/client";
import { html } from "./lib/html.js";
import { App } from "./App.js";

const root = createRoot(document.getElementById("root"));
root.render(html`<${App} />`);
