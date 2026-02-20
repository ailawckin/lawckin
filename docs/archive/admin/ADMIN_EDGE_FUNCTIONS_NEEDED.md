# Admin Panel Edge Functions Required

The admin panel now includes integrations that require Supabase Edge Functions. These need to be created and deployed.

## Required Edge Functions

### 1. `process-refund` (Stripe Refund Processing)

**Location**: `supabase/functions/process-refund/index.ts`

**Purpose**: Process actual Stripe refunds when admin clicks "Refund" in Bookings & Payments

**Request Body**:
```typescript
{
  paymentIntentId: string;
  amount: number;
  bookingId: string;
}
```

**Implementation**:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

serve(async (req) => {
  try {
    const { paymentIntentId, amount, bookingId } = await req.json();

    // Process refund via Stripe API
    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/refunds`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          payment_intent: paymentIntentId,
          amount: Math.round(amount * 100), // Convert to cents
        }),
      }
    );

    if (!stripeResponse.ok) {
      const error = await stripeResponse.json();
      throw new Error(error.message || "Stripe refund failed");
    }

    const refund = await stripeResponse.json();

    return new Response(
      JSON.stringify({ success: true, refundId: refund.id }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

**Environment Variables Needed**:
- `STRIPE_SECRET_KEY` - Add to Supabase Dashboard → Edge Functions → Secrets

---

### 2. `send-support-email` (Support Ticket Email)

**Location**: `supabase/functions/send-support-email/index.ts`

**Purpose**: Send email to user when admin responds to support ticket

**Request Body**:
```typescript
{
  to: string;
  subject: string;
  message: string;
  ticketId: string;
}
```

**Implementation**:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  try {
    const { to, subject, message, ticketId } = await req.json();

    // Send email via Resend API (or your email service)
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Lawckin Support <support@lawckin.com>",
        to: [to],
        subject: subject,
        html: `
          <div>
            <p>${message.replace(/\n/g, "<br>")}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              This is a response to your support ticket #${ticketId}
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.json();
      throw new Error(error.message || "Email sending failed");
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

**Environment Variables Needed**:
- `RESEND_API_KEY` - Add to Supabase Dashboard → Edge Functions → Secrets
- Or use another email service (SendGrid, Mailgun, etc.)

---

## Deployment Steps

1. **Create Edge Functions**:
   ```bash
   # Create function directories
   mkdir -p supabase/functions/process-refund
   mkdir -p supabase/functions/send-support-email
   ```

2. **Add the code** (see implementations above)

3. **Set Environment Variables**:
   - Go to Supabase Dashboard → Edge Functions → Secrets
   - Add `STRIPE_SECRET_KEY` and `RESEND_API_KEY`

4. **Deploy**:
   ```bash
   supabase functions deploy process-refund
   supabase functions deploy send-support-email
   ```

   Or use Supabase Dashboard → Edge Functions → Deploy

---

## Current Behavior Without Functions

- **Stripe Refunds**: Shows error message asking admin to process manually
- **Support Emails**: Ticket status updates, but email is not sent (logs warning)

The admin panel will continue to work for all other features, but these two features require the Edge Functions to be fully functional.

