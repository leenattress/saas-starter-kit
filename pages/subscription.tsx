import React, { useState, useEffect } from 'react';
import { Button, Card } from 'react-daisyui';
import { useTranslation } from 'next-i18next';

const ProductDisplay = () => {
  const { t } = useTranslation();
  return (
    <Card className="rounded-md dark:border-gray-200 border border-gray-300">
      <Card.Body>
        <Card.Title tag="h2">
          {t('subscription.price')}
        </Card.Title>
        <p>{t('subscription.unlimited_ai')}</p>
      </Card.Body>
      <Card.Actions className="justify-center m-2">
        <form action="/api/stripe/create-checkout-session" method="POST">
          <input type="hidden" name="lookup_key" value={process.env.NEXT_PUBLIC_STRIPE_PRICE_1} />
          <Button
            color="primary"
            className="md:w-full w-3/4 rounded-md"
            size="md"
            type="submit"
            id="checkout-and-portal-button"
          >
            {t('subscription.checkout')}
          </Button>
        </form>
      </Card.Actions>
    </Card>
  );
};

const SuccessDisplay = ({ sessionId }) => {
  const { t } = useTranslation();
  return (
    <section>
      <div className="product Box-root">
        <Logo />
        <div className="description Box-root">
          <h3>{t('subscription.success')}</h3>
        </div>
      </div>
      <form action="/api/stripe/create-portal-session" method="POST">
        <input
          type="hidden"
          id="session-id"
          name="session_id"
          value={sessionId}
        />
        <button id="checkout-and-portal-button" type="submit">
          {t('subscription.manage_billing')}
        </button>
      </form>
    </section>
  );
};

const Message = ({ message }) => (
  <section>
    <p>{message}</p>
  </section>
);

export default function Subscribe() {
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const query = new URLSearchParams(window.location.search);

    if (query.get('success') && query.get('session_id')) {
      setSuccess(true);
      setSessionId(query.get('session_id') || '');
    }

    if (query.get('canceled')) {
      setSuccess(false);
      setMessage(
        "Order canceled -- continue to shop around and checkout when you're ready."
      );
    }
  }, [sessionId]);

  if (!success && message === '') {
    return <ProductDisplay />;
  } else if (success && sessionId !== '') {
    return <SuccessDisplay sessionId={sessionId} />;
  } else {
    return <Message message={message} />;
  }
}

const Logo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    width="14px"
    height="16px"
    viewBox="0 0 14 16"
    version="1.1"
  >
    <defs />
    <g id="Flow" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g
        id="0-Default"
        transform="translate(-121.000000, -40.000000)"
        fill="#E184DF"
      >
        <path
          d="M127,50 L126,50 C123.238576,50 121,47.7614237 121,45 C121,42.2385763 123.238576,40 126,40 L135,40 L135,56 L133,56 L133,42 L129,42 L129,56 L127,56 L127,50 Z M127,48 L127,42 L126,42 C124.343146,42 123,43.3431458 123,45 C123,46.6568542 124.343146,48 126,48 L127,48 Z"
          id="Pilcrow"
        />
      </g>
    </g>
  </svg>
);