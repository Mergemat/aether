// biome-ignore assist/source/organizeImports: <must be imported before React and React DOM>
import { scan } from "react-scan";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./app.tsx";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Missing root element");
}
createRoot(rootElement).render(<App />);

scan({
  enabled: true,
});
