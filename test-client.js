/**
 * x402 Test Client
 *
 * Demonstrates how users/agents would interact with Zerion x402 endpoints
 * Similar to Zapper's example client
 */

require('dotenv').config();
const axios = require('axios');

// Mock x402 payment client (in production, would use @coinbase/x402)
class MockX402Client {
  constructor(privateKey) {
    this.privateKey = privateKey;
  }

  async createPayment(schemes) {
    // In production, this would:
    // 1. Select a payment scheme (chain + token)
    // 2. Create and sign the payment transaction
    // 3. Submit to blockchain
    // 4. Return payment proof

    console.log('💳 Creating payment...');
    console.log('   Available schemes:', schemes.length);
    console.log('   Selected:', schemes[0]);

    // Mock payment proof
    const payment = {
      scheme: schemes[0],
      txHash: '0xmock_transaction_hash_' + Date.now(),
      timestamp: Date.now(),
    };

    return Buffer.from(JSON.stringify(payment)).toString('base64');
  }
}

/**
 * Main test function
 */
async function testX402Flow() {
  const ZERION_API = process.env.ZERION_API_URL || 'http://localhost:3000';
  const TEST_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
  const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || '0x...';

  const client = new MockX402Client(PRIVATE_KEY);

  console.log('🧪 Testing Zerion x402 Integration');
  console.log('====================================\n');

  try {
    // Step 1: Make initial request without payment
    console.log('1️⃣  Making request WITHOUT payment header...');
    const endpoint = `/v1/x402/wallets/${TEST_ADDRESS}/transactions`;

    let response;
    try {
      response = await axios.get(`${ZERION_API}${endpoint}`);
    } catch (error) {
      if (error.response?.status === 402) {
        console.log('✅ Received 402 Payment Required (expected)\n');

        const paymentRequirements = error.response.data.x402;
        console.log('💰 Payment requirements:');
        console.log(JSON.stringify(paymentRequirements, null, 2));
        console.log();

        // Step 2: Create payment
        console.log('2️⃣  Creating payment...');
        const paymentHeader = await client.createPayment(
          paymentRequirements.schemes
        );
        console.log('✅ Payment created\n');

        // Step 3: Retry with payment header
        console.log('3️⃣  Retrying request WITH payment header...');
        response = await axios.get(`${ZERION_API}${endpoint}`, {
          headers: {
            'x-402-payment': paymentHeader,
          },
        });

        console.log('✅ Request successful!\n');
        console.log('📊 Response:');
        console.log(JSON.stringify(response.data, null, 2));

        return response.data;
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

/**
 * Test with axios wrapper (like Zapper example)
 */
async function testWithWrapper() {
  // This demonstrates how the x402 axios wrapper would work
  // The wrapper automatically handles 402 responses

  console.log('\n\n🧪 Testing with x402 Axios Wrapper');
  console.log('====================================\n');

  const ZERION_API = process.env.ZERION_API_URL || 'http://localhost:3000';
  const TEST_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

  // In production, would use:
  // const api = wrapAxiosWithPayment(axios.create({...}), x402Client);

  const api = axios.create({
    baseURL: ZERION_API,
    headers: { 'Content-Type': 'application/json' },
  });

  // This would automatically handle 402 → payment → retry
  try {
    const response = await api.get(`/v1/x402/wallets/${TEST_ADDRESS}/transactions`);
    console.log('✅ Transactions:', response.data);
  } catch (error) {
    console.log('ℹ️  Wrapper would handle payment automatically');
    console.log('   Error:', error.response?.status, error.response?.statusText);
  }
}

// Run tests
if (require.main === module) {
  testX402Flow()
    .then(() => testWithWrapper())
    .then(() => {
      console.log('\n✅ All tests complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testX402Flow, testWithWrapper };
