/**
 * Zerion API - x402 Payment Integration Demo
 *
 * This demonstrates how to add x402 payment support to existing endpoints
 */

require('dotenv').config();
const express = require('express');
const { x402PaymentMiddleware } = require('./x402-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ============================================================================
// EXISTING API ENDPOINTS (API Key Required)
// ============================================================================

/**
 * Existing endpoint - requires API key
 */
app.get('/v1/wallets/:address/transactions', requireApiKey, async (req, res) => {
  // Your existing transactions logic
  const { address } = req.params;
  const transactions = await fetchTransactions(address);
  res.json({ data: transactions });
});

// ============================================================================
// NEW x402 ENDPOINTS (Payment-Based Access)
// ============================================================================

/**
 * NEW: x402 payment-based transactions endpoint
 * No API key required - pay per request
 */
app.get(
  '/v1/x402/wallets/:address/transactions',
  x402PaymentMiddleware('transactions'),
  async (req, res) => {
    try {
      const { address } = req.params;

      // Same logic as API key version
      const transactions = await fetchTransactions(address);

      // Log payment for tracking
      console.log('x402 payment received:', {
        endpoint: 'transactions',
        address,
        payment: req.x402Payment,
        timestamp: new Date().toISOString(),
      });

      res.json({
        data: transactions,
        meta: {
          authMethod: 'x402',
          paid: true,
        },
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * NEW: x402 portfolio endpoint (easy to add more)
 */
app.get(
  '/v1/x402/wallets/:address/portfolio',
  x402PaymentMiddleware('portfolio'),
  async (req, res) => {
    const { address } = req.params;
    const portfolio = await fetchPortfolio(address);
    res.json({ data: portfolio });
  }
);

// ============================================================================
// HELPER FUNCTIONS (Replace with your actual implementation)
// ============================================================================

function requireApiKey(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'API key required' });
  }

  const apiKey = authHeader.replace('Bearer ', '');
  // TODO: Validate API key against your database
  if (!isValidApiKey(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
}

function isValidApiKey(apiKey) {
  // TODO: Replace with actual validation
  // Check against database, validate format, check expiration, etc.
  return apiKey && apiKey.length > 10;
}

async function fetchTransactions(address) {
  // TODO: Replace with actual Zerion transactions logic
  // This is where you'd call your indexer, database, etc.
  return [
    {
      hash: '0x123...',
      from: address,
      to: '0xabc...',
      value: '1000000000000000000',
      timestamp: Date.now(),
      type: 'transfer',
    },
    // ... more transactions
  ];
}

async function fetchPortfolio(address) {
  // TODO: Replace with actual Zerion portfolio logic
  return {
    totalValue: '12345.67',
    chains: {
      ethereum: '10000',
      base: '2345.67',
    },
  };
}

// ============================================================================
// SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Zerion API x402 Demo running on port ${PORT}`);
  console.log();
  console.log('Endpoints:');
  console.log(`  API Key:    GET http://localhost:${PORT}/v1/wallets/:address/transactions`);
  console.log(`  x402:       GET http://localhost:${PORT}/v1/x402/wallets/:address/transactions`);
  console.log();
  console.log('Try it:');
  console.log(`  curl http://localhost:${PORT}/v1/x402/wallets/0x123.../transactions`);
  console.log('  (Should return 402 Payment Required)');
});
