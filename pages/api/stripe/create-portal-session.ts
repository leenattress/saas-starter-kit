import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const YOUR_DOMAIN = process.env.NEXTAUTH_URL || 'http://localhost:4002';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const { session_id } = req.body;
        const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: checkoutSession.customer as string,
            return_url: YOUR_DOMAIN,
        });

        return res.redirect(303, portalSession.url);
    } catch (err: any) {
        console.error('Stripe API error:', err);
        return res.status(500).json({ error: err.message });
    }
}
