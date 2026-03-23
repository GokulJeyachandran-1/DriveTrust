import api from './axios';

/**
 * Creates a Razorpay order for a specific bid.
 * Amount is derived server-side, never from the client.
 */
export const createPaymentOrder = async (bidId) => {
  const res = await api.post('/payments/create-order', { bidId });
  return res.data;
};

/**
 * Verifies the payment after Razorpay checkout success.
 * Sends the signature for HMAC-SHA256 verification on the server.
 */
export const verifyPayment = async (data) => {
  const res = await api.post('/payments/verify', data);
  return res.data;
};

/**
 * Checks payment status for a given order.
 */
export const getPaymentStatus = async (orderId) => {
  const res = await api.get(`/payments/status/${orderId}`);
  return res.data;
};

/**
 * Opens Razorpay checkout modal and returns a promise.
 * Handles timeout, cancellation, and errors gracefully.
 */
export const openRazorpayCheckout = ({ orderId, amount, currency, keyId, customerName, customerEmail, bidId }) => {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Razorpay SDK not loaded. Please refresh.'));
      return;
    }

    const options = {
      key: keyId,
      amount: amount,
      currency: currency || 'INR',
      name: 'DriveTrust',
      description: 'Freight Payment — Escrow',
      order_id: orderId,
      prefill: {
        name: customerName || '',
        email: customerEmail || '',
      },
      theme: {
        color: '#2563EB',
      },
      timeout: 300, // 5 minute timeout
      handler: (response) => {
        // Payment successful — resolve with Razorpay response
        resolve({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          bidId,
        });
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled by user'));
        },
        escape: true,
        confirm_close: true,
        animation: true,
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (response) => {
      reject(new Error(response.error?.description || 'Payment failed'));
    });

    rzp.open();
  });
};
