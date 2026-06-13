import { useEffect } from 'react';
import { initializePaddle, Paddle } from '@paddle/paddle-js';

let paddleInstance: Paddle | null = null;

export function usePaddleCheckout() {
  const vendorId = import.meta.env.VITE_PADDLE_VENDOR_ID;
  const sandbox = import.meta.env.VITE_PADDLE_SANDBOX === 'true';

  useEffect(() => {
    const initPaddle = async () => {
      if (!paddleInstance && vendorId) {
        paddleInstance = await initializePaddle({
          token: vendorId,
          environment: sandbox ? 'sandbox' : 'production',
          eventCallback: (data) => {
            if (data.name === 'checkout.completed') {
              // Handle success - redirect or toast
              window.location.href = '/checkout/success';
            }
          },
        });
      }
    };
    initPaddle();
  }, [vendorId, sandbox]);

  const openCheckout = (priceId: string, email?: string) => {
    if (!paddleInstance) {
      console.error('Paddle not initialized');
      return;
    }

    paddleInstance.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: email ? { email } : undefined,
      customData: { source: 'idea-forge' },
    });
  };

  return { openCheckout, isSandbox: sandbox };
}