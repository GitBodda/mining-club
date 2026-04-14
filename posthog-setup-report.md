<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the BlockMint mining platform. The `posthog-node` SDK client (`server/posthog.ts`) serves as a shared singleton. `server/index.ts` captures exceptions in the Express error middleware and calls `posthog.shutdown()` on graceful shutdown. User identification (`posthog.identify`) is called on every auth sync, linking backend events to the user's profile. Client-side distinct IDs are forwarded via `X-POSTHOG-DISTINCT-ID` headers for cross-domain event correlation. This session added 7 new events covering earn withdrawals, mining withdrawals, orders, feedback rewards, PIN security, biometric auth, and ambassador applications.

| Event | Description | File |
|---|---|---|
| `user_signed_up` | New user created via `/api/auth/sync` | `server/routes.ts` |
| `user_logged_in` | Existing user successfully syncs auth | `server/routes.ts` |
| `mining_package_purchased` | User purchases a mining package | `server/routes.ts` |
| `withdrawal_requested` | User submits a crypto withdrawal request | `server/routes.ts` |
| `deposit_requested` | User submits a crypto deposit request | `server/routes.ts` |
| `earn_subscription_created` | User subscribes to an earn plan | `server/routes.ts` |
| `earn_subscription_withdrawn` | User withdraws earn subscription principal + earnings | `server/routes.ts` |
| `mining_earnings_withdrawn` | User withdraws accumulated mining earnings | `server/routes.ts` |
| `order_created` | User creates a product order | `server/routes.ts` |
| `stripe_payment_completed` | Stripe `payment_intent.succeeded` webhook received | `server/routes.ts` |
| `stripe_payment_failed` | Stripe `payment_intent.payment_failed` webhook received | `server/routes.ts` |
| `referral_applied` | User applies a referral code | `server/routes.ts` |
| `support_ticket_created` | User submits a support ticket | `server/routes.ts` |
| `two_fa_enabled` | User successfully sets up and verifies 2FA | `server/routes.ts` |
| `account_deleted` | User deletes their account | `server/routes.ts` |
| `feedback_reward_claimed` | User claims a feedback reward (hashrate + credits) | `server/routes.ts` |
| `pin_set` | User sets or updates their 6-digit security PIN | `server/routes.ts` |
| `biometric_toggled` | User enables or disables biometric authentication | `server/routes.ts` |
| `ambassador_applied` | User submits an ambassador application | `server/growth-routes.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/381194/dashboard/1463907
  - **Signup → Mining Purchase Funnel**: https://us.posthog.com/project/381194/insights/7ON8DaDR
  - **Revenue Events (Weekly)**: https://us.posthog.com/project/381194/insights/J55pKdP0
  - **User Growth & Referrals (Weekly)**: https://us.posthog.com/project/381194/insights/S619sxZn
  - **Churn Signals (Weekly)**: https://us.posthog.com/project/381194/insights/coKloj0L
  - **Security Feature Adoption (Weekly)**: https://us.posthog.com/project/381194/insights/f2YfUh6n

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
