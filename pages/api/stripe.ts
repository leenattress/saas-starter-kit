import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

const YOUR_DOMAIN = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      if (req.url === '/api/stripe/create-checkout-session') {
        const prices = await stripe.prices.list({
          lookup_keys: [req.body.lookup_key],
          expand: ['data.product'],
        });

        const session = await stripe.checkout.sessions.create({
          billing_address_collection: 'auto',
          line_items: [
            {
              price: prices.data[0].id,
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: `${YOUR_DOMAIN}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${YOUR_DOMAIN}?canceled=true`,
        });

        return res.redirect(303, session.url);
      }

      if (req.url === '/api/stripe/create-portal-session') {
        const { session_id } = req.body;
        const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: checkoutSession.customer,
          return_url: YOUR_DOMAIN,
        });

        return res.redirect(303, portalSession.url);
      }

      if (req.url === '/api/stripe/webhook') {
        const sig = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        let event;

        try {
          event = stripe.webhooks.constructEvent(
            req.body,
            sig as string,
            endpointSecret as string
          );
        } catch (err: any) {
          console.log(`⚠️ Webhook signature verification failed.`, err.message);
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        let subscription;
        let status;

        switch (event.type) {
          case 'customer.subscription.trial_will_end':
          case 'customer.subscription.deleted':
          case 'customer.subscription.created':
          case 'customer.subscription.updated':
            subscription = event.data.object;
            status = subscription.status;
            console.log(`Subscription status is ${status}.`);
            break;
          case 'entitlements.active_entitlement_summary.updated':
            subscription = event.data.object;
            console.log(`Active entitlement summary updated for ${subscription}.`);
            break;
          default:
            console.log(`Unhandled event type ${event.type}.`);
        }

        return res.json({ received: true });
      }
    } catch (err: any) {
      console.error('Stripe API error:', err);
      return res.status(500).json({ error: err.message });
    }
  }
  
  res.setHeader('Allow', 'POST');
  res.status(405).end('Method Not Allowed');
}
