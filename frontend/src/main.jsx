import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import AgeGate from "./AgeGate.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AgeGate>
      <App />
    </AgeGate>
  </StrictMode>
);
