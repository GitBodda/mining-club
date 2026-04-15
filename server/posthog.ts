import { PostHog } from "posthog-node";

const posthog = new PostHog(process.env.POSTHOG_API_KEY || "dev-placeholder", {
  host: process.env.POSTHOG_HOST,
  enableExceptionAutocapture: !!process.env.POSTHOG_API_KEY,
  disabled: !process.env.POSTHOG_API_KEY,
});

export default posthog;
