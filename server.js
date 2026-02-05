/**
 * Zerion API - x402 Payment Integration Demo
 *
 * This demonstrates how to add x402 payment support to existing endpoints
 *
 * AUTHENTICATION: Zerion API uses HTTP Basic Auth
 * - Username: Your API key (zk_dev_... or zk_prod_...)
 * - Password: Empty string
 * - Get API keys from: https://dashboard.zerion.io
 * - Rate Limits: Dev keys = 300 calls/day
 */

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { x402PaymentMiddleware } = require('./x402-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Zerion API configuration
const ZERION_API_BASE = 'https://api.zerion.io/v1';
const ZERION_API_KEY = process.env.ZERION_API_KEY;

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
  // Real Zerion API integration using HTTP Basic Auth
  try {
    const response = await axios.get(
      `${ZERION_API_BASE}/wallets/${address}/transactions`,
      {
        auth: {
          username: ZERION_API_KEY,
          password: '', // Zerion requires empty password
        },
        params: {
          'page[size]': 10, // Limit to 10 most recent
        },
      }
    );

    // Return in Zerion's format
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error.response?.status, error.message);

    // Return error in consistent format
    throw {
      error: 'Failed to fetch transactions',
      status: error.response?.status || 500,
      message: error.message,
    };
  }
}

async function fetchPortfolio(address) {
  // Real Zerion API integration using HTTP Basic Auth
  try {
    const response = await axios.get(
      `${ZERION_API_BASE}/wallets/${address}/portfolio`,
      {
        auth: {
          username: ZERION_API_KEY,
          password: '', // Zerion requires empty password
        },
        params: {
          currency: 'usd',
        },
      }
    );

    // Return in Zerion's format:
    // data.attributes.positions_distribution_by_type
    // data.attributes.positions_distribution_by_chain
    return response.data;
  } catch (error) {
    console.error('Error fetching portfolio:', error.response?.status, error.message);

    throw {
      error: 'Failed to fetch portfolio',
      status: error.response?.status || 500,
      message: error.message,
    };
  }
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
