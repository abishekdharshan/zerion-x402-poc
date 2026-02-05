/**
 * x402 Payment Middleware for Zerion API
 *
 * Handles HTTP 402 Payment Required responses for pay-per-request access
 * Based on Coinbase x402 spec: https://docs.cdp.coinbase.com/x402/welcome
 */

const { verifyPayment } = require('@coinbase/x402');

// Configuration
const PRICING = {
  transactions: '1000', // 0.001 USDC (6 decimals)
  portfolio: '1000',
  positions: '1000',
  charts: '2000', // More expensive queries
};

const SUPPORTED_CHAINS = {
  base: {
    chainId: 8453,
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  polygon: {
    chainId: 137,
    usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  },
  avalanche: {
    chainId: 43114,
    usdc: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  },
};

const RECIPIENT_WALLET = process.env.ZERION_PAYMENT_WALLET;

/**
 * x402 Payment Middleware
 *
 * Intercepts requests to /v1/x402/* endpoints and handles payment verification
 */
function x402PaymentMiddleware(endpoint) {
  return async (req, res, next) => {
    const paymentHeader = req.headers['x-402-payment'];

    // If no payment header, return 402 Payment Required with payment schemes
    if (!paymentHeader) {
      return res.status(402).json({
        error: 'Payment Required',
        message: 'This endpoint requires payment via x402 protocol',
        x402: {
          schemes: Object.values(SUPPORTED_CHAINS).map(chain => ({
            type: 'evm-exact',
            chainId: chain.chainId,
            token: chain.usdc,
            amount: PRICING[endpoint] || PRICING.transactions,
            recipient: RECIPIENT_WALLET,
          })),
        },
      });
    }

    // Verify payment
    try {
      const payment = JSON.parse(
        Buffer.from(paymentHeader, 'base64').toString('utf-8')
      );

      // Verify payment proof
      const isValid = await verifyPayment(payment, {
        expectedAmount: PRICING[endpoint] || PRICING.transactions,
        expectedRecipient: RECIPIENT_WALLET,
        supportedChains: Object.values(SUPPORTED_CHAINS).map(c => c.chainId),
      });

      if (!isValid) {
        return res.status(402).json({
          error: 'Invalid Payment',
          message: 'Payment verification failed',
        });
      }

      // Payment verified - continue to actual endpoint
      req.x402Payment = payment;
      next();
    } catch (error) {
      console.error('x402 verification error:', error);
      return res.status(402).json({
        error: 'Payment Verification Failed',
        message: error.message,
      });
    }
  };
}

/**
 * Helper: Check if request has valid API key (existing auth method)
 */
function hasValidApiKey(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return false;

  const apiKey = authHeader.replace('Bearer ', '');
  // Add your actual API key validation logic here
  return apiKey && apiKey.length > 10; // Placeholder
}

/**
 * Dual Auth Middleware
 * Accepts EITHER API key OR x402 payment
 */
function dualAuthMiddleware(endpoint) {
  return (req, res, next) => {
    // Check if API key is present and valid
    if (hasValidApiKey(req)) {
      req.authMethod = 'api-key';
      return next();
    }

    // Otherwise, require x402 payment
    req.authMethod = 'x402';
    return x402PaymentMiddleware(endpoint)(req, res, next);
  };
}

module.exports = {
  x402PaymentMiddleware,
  dualAuthMiddleware,
  PRICING,
  SUPPORTED_CHAINS,
};
