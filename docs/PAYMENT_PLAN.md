# Payment Integration Plan: Stripe Connect

To achieve the goal of allowing Event Creators to sell tickets while we take a 15% platform fee, **Stripe Connect** is the industry standard solution.

## Strategy: Stripe Connect (Standard or Express)
We will use **Direct Charges** or **Destination Charges** depending on the specific flow, but **Destination Charges** are easier for platforms where the user (Event Creator) doesn't need to handle complex Stripe logic themselves.

### Flow
1.  **Onboarding**: 
    - Event Creator goes to "Settings" -> "Payouts".
    - Clicks "Connect Stripe".
    - Redirected to Stripe hosted onboarding flow.
    - Returns to TiQly with a `stripe_account_id`.

2.  **Ticket Purchase**:
    - Buyer pays for a ticket (e.g., $100).
    - We create a PaymentIntent on our Platform Stripe Account.
    - We specify `transfer_data[destination]` as the Event Creator's `stripe_account_id`.
    - We calculate the `application_fee_amount`.
        - Ticket Price: $100
        - TiQly Fee (15%): $15
        - Stripe Processing Fees (approx 2.9% + 30c): ~$3.20 (deducted from the total or split, usually deducted from the destination amount unless specified).
    - Result:
        - TiQly keeps $15.
        - Event Creator receives $85 (minus Stripe processing fees).

### Implementation Steps
1.  **Backend (Supabase Edge Functions)**:
    - `connect-stripe`: Generates an implementation link.
    - `webhook`: Listens for successful payments and transfers.
    - `create-payment-intent`: Calculates fee and initiates charge.

2.  **Frontend (Web & Mobile)**:
    - **Stripe SDK**: `stripe-js` (Web) and `@stripe/stripe-react-native` (Mobile).
    - **Payment Sheet**: Use the native UI for collecting card details.

## Note on "Tangible" Demo
For the current demo phase without a backend, we will **Mock** this experience:
- "Connect Stripe" button will show a success toast "Stripe Account Connected (Mock)".
- "Buy Ticket" button will show a modal "Payment Successful (Mock) - 15% fee calculated".
