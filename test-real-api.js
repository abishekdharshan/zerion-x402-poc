/**
 * Test script for integrating with real Zerion API
 *
 * This demonstrates how to fetch real data from Zerion API
 * and integrate it into our x402 endpoints
 */

require('dotenv').config();
const axios = require('axios');

const ZERION_API_KEY = process.env.ZERION_API_KEY;
const ZERION_BASE_URL = 'https://api.zerion.io';

/**
 * Test fetching real transactions from Zerion API
 */
async function testRealTransactions() {
  const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // vitalik

  try {
    console.log('🧪 Testing Real Zerion API Integration\n');
    console.log(`Fetching transactions for: ${address}\n`);

    const response = await axios.get(
      `${ZERION_BASE_URL}/v1/wallets/${address}/transactions`,
      {
        auth: {
          username: ZERION_API_KEY,
          password: '', // Zerion uses API key as username, password is empty
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Successfully fetched from Zerion API');
    console.log(`   Transactions: ${response.data.data?.length || 0}`);
    console.log(`   Status: ${response.status}\n`);

    // Show sample transaction
    if (response.data.data?.[0]) {
      console.log('📊 Sample transaction:');
      console.log(JSON.stringify(response.data.data[0], null, 2));
    }

    return response.data;
  } catch (error) {
    console.error('❌ Error fetching from Zerion API:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${error.response.data.error || error.response.statusText}`);
    } else {
      console.error(`   ${error.message}`);
    }
    throw error;
  }
}

/**
 * Test portfolio endpoint
 */
async function testRealPortfolio() {
  const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

  try {
    console.log('\n\n🧪 Testing Portfolio Endpoint\n');

    const response = await axios.get(
      `${ZERION_BASE_URL}/v1/wallets/${address}/portfolio`,
      {
        auth: {
          username: ZERION_API_KEY,
          password: '',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Successfully fetched portfolio');
    console.log(`   Total Value: $${response.data.data?.attributes?.total?.value || 'N/A'}`);

    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data?.error);
    throw error;
  }
}

// Run tests
if (require.main === module) {
  if (!ZERION_API_KEY) {
    console.error('❌ ZERION_API_KEY not found in .env file');
    console.error('   Add: ZERION_API_KEY=your_key_here\n');
    process.exit(1);
  }

  testRealTransactions()
    .then(() => testRealPortfolio())
    .then(() => {
      console.log('\n✅ All API tests passed!');
      console.log('\n💡 Next step: Integrate this into server.js to use real Zerion data');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Tests failed');
      process.exit(1);
    });
}

module.exports = { testRealTransactions, testRealPortfolio };
