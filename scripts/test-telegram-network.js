const axios = require('axios');

async function testNetwork() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN not set');
    process.exit(1);
  }

  console.log('Testing connectivity to api.telegram.org...');
  try {
    const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`, { timeout: 10000 });
    console.log('Connectivity OK!');
    console.log('Bot Info:', JSON.stringify(response.data));
  } catch (error) {
    console.error('Connectivity Failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data));
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testNetwork();
