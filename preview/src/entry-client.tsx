import { hydrateRoot } from "react-dom/client";

import "@rahulyadev/design-system/styles.css";
import "../preview.css";
import { PreviewApp } from "./app";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Preview root element is missing.");
}

let hydrationRecovered = false;

hydrateRoot(rootElement, <PreviewApp />, {
  onRecoverableError(error) {
    hydrationRecovered = true;
    console.error("Recoverable hydration error", error);
  },
});

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    if (!hydrationRecovered) {
      rootElement.dataset.hydrated = "true";
    }
  });
});
