import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./app.tsx";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Missing root element");
}
createRoot(rootElement).render(<App />);
