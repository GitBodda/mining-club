import { createRoot } from "react-dom/client";
import posthog from "posthog-js";
import App from "./App";
import "./index.css";

if (import.meta.env.VITE_POSTHOG_API_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_API_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: { password: true },
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
