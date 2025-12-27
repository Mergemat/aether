import { createRoot } from "react-dom/client";
import { scan } from "react-scan"; // must be imported before React and React DOM

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
