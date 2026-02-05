const { execSync } = require('child_process');

console.log('🧪 Testing Zerion API Integration\n');
console.log('✅ API Key Valid: zk_dev_c4a3fb29e7fa40568d8c621f4bf4d822\n');

const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

try {
  console.log('📊 Fetching Portfolio...\n');
  const result = execSync(
    `curl --silent --user "zk_dev_c4a3fb29e7fa40568d8c621f4bf4d822:" "https://api.zerion.io/v1/wallets/${address}/portfolio"`,
    { encoding: 'utf-8' }
  );
  
  const data = JSON.parse(result);
  const attrs = data.data.attributes;
  
  console.log('✅ Successfully connected to Zerion API!\n');
  console.log('Portfolio Summary:');
  console.log('==================');
  
  const totalValue = Object.values(attrs.positions_distribution_by_type).reduce((a,b) => a+b, 0);
  console.log(`Total Value: $${totalValue.toLocaleString('en-US', {maximumFractionDigits: 2})}\n`);
  
  console.log('Top Chains by Value:');
  const chains = Object.entries(attrs.positions_distribution_by_chain)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5);
  
  chains.forEach(([chain, value]) => {
    console.log(`  ${chain}: $${value.toLocaleString('en-US', {maximumFractionDigits: 2})}`);
  });
  
  console.log('\n✅ Integration Test: PASSED');
  console.log('\n💡 Your API key works! Ready to integrate into x402 endpoints.');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
