const https = require('https');

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const type = process.argv[2]; // 'success' or 'failure'

if (!token || !chatId) {
  console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
  process.exit(1);
}

const divider = '─────────────────────';

let text;
if (type === 'success') {
  text = [
    `✅ <b>IPO Master 배포 성공!</b>`,
    ``,
    `IPO 정보가 성공적으로 업데이트되었습니다.`,
    ``,
    `🔗 <a href="https://bsjuuny2026.mycafe24.com/ipomaster/">웹사이트 바로가기</a>`,
    `📋 <a href="https://github.com/bsjuuny/ipo-master/actions">Actions 로그 확인</a>`,
  ].join('\n');
} else {
  text = [
    `❌ <b>IPO Master 배포 실패!</b>`,
    ``,
    `데이터 업데이트 또는 빌드 과정에서 오류가 발생했습니다.`,
    ``,
    `📋 <a href="https://github.com/bsjuuny/ipo-master/actions">Actions 로그 확인</a>`,
  ].join('\n');
}

const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' });

const req = https.request({
  hostname: 'api.telegram.org',
  path: `/bot${token}/sendMessage`,
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json; charset=utf-8', 
    'Content-Length': Buffer.byteLength(body) 
  },
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (!result.ok) { 
        console.error('Telegram API error:', result); 
        process.exit(1); 
      }
      console.log('Telegram notification sent.');
    } catch (e) {
      console.error('Failed to parse Telegram response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (e) => { 
  console.error('Request error:', e); 
  process.exit(1); 
});

req.write(body);
req.end();
