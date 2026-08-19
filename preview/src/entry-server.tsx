import { renderToString } from "react-dom/server";

import { createThemeBootstrapScript } from "@rahulyadev/design-system/theme";
import { PREVIEW_STORAGE_KEY, PreviewApp } from "./app";

export function renderPreview() {
  return renderToString(<PreviewApp />);
}

export function getThemeBootstrapScript() {
  return createThemeBootstrapScript({ storageKey: PREVIEW_STORAGE_KEY });
}
