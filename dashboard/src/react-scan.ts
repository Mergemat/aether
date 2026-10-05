// Dev-only: injected ahead of main.tsx by vite.config.ts so React Scan hooks
// in before React loads, and stays out of production builds
import { scan } from "react-scan";

scan({
  enabled: true,
});
