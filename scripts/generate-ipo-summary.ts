import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { IPO } from '../src/types/ipo';

const dataPath = path.join(process.cwd(), 'public/data/ipo_list.json');
const outputPath = path.join(process.cwd(), 'ipo-summary.txt');

function getKSTDate() {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  return kstDate.toISOString().split('T')[0].replace(/-/g, '.');
}

function formatPrice(price: number) {
  return price > 0 ? `${price.toLocaleString()}원` : '미정';
}

function isSameDate(target: string | undefined, today: string, start?: string): boolean {
  if (!target || !today) return false;
  if (target === today) return true;
  
  // Handle MM.DD format (requires start date to derive year)
  if (target.split('.').length === 2 && start && start.split('.').length === 3) {
    const year = start.split('.')[0];
    return `${year}.${target}` === today;
  }
  return false;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function generateSummary() {
  if (!fs.existsSync(dataPath)) {
    console.error('Data file not found');
    process.exit(1);
  }

  const data: IPO[] = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const today = getKSTDate();
  console.log(`Generating summary for KST ${today}...`);

  const categories = {
    start: [] as IPO[],
    end: [] as IPO[],
    refund: [] as IPO[],
    listing: [] as IPO[]
  };

  data.forEach(ipo => {
    if (ipo.subscriptionStart === today) {
      categories.start.push(ipo);
    }
    
    if (isSameDate(ipo.subscriptionEnd, today, ipo.subscriptionStart)) {
      categories.end.push(ipo);
    }
    
    if (isSameDate(ipo.refundDate, today, ipo.subscriptionStart)) {
      categories.refund.push(ipo);
    }
    
    if (isSameDate(ipo.listingDate, today, ipo.subscriptionStart)) {
      categories.listing.push(ipo);
    }
  });

  const sections: string[] = [];

  if (categories.start.length > 0) {
    sections.push(`<b>🚀 청약 시작 (${categories.start.length})</b>\n` + 
      categories.start.map(ipo => `  • ${escapeHtml(ipo.companyName)} (${formatPrice(ipo.offeringPrice)})`).join('\n'));
  }

  if (categories.end.length > 0) {
    sections.push(`<b>🏁 청약 마감 (${categories.end.length})</b>\n` + 
      categories.end.map(ipo => `  • ${escapeHtml(ipo.companyName)}`).join('\n'));
  }

  if (categories.refund.length > 0) {
    sections.push(`<b>💰 오늘 환불 (${categories.refund.length})</b>\n` + 
      categories.refund.map(ipo => `  • ${escapeHtml(ipo.companyName)}`).join('\n'));
  }

  if (categories.listing.length > 0) {
    sections.push(`<b>📈 오늘 상장 (${categories.listing.length})</b>\n` + 
      categories.listing.map(ipo => `  • ${escapeHtml(ipo.companyName)}`).join('\n'));
  }

  if (sections.length === 0) {
    sections.push('📅 오늘은 예정된 주요 IPO 일정이 없습니다.');
  }

  const header = '✅ <b>IPO Master 정보 업데이트 성공!</b>';
  const divider = '━━━━━━━━━━━━━━━━━━━━━';
  const footer = `🔗 웹사이트 바로가기: <a href="https://bsjuun2026.mycafe24.com/ipomaster/">바로가기</a>\n🔗 리포지토리: <a href="https://github.com/bsjuuny/ipo-master/actions">확인하기</a>`;

  const finalMessage = `${header}\n\n${divider}\n${sections.join('\n\n')}\n${divider}\n\n${footer}`;
  
  fs.writeFileSync(outputPath, finalMessage, 'utf8');
  console.log('Summary generated successfully:');
  console.log(finalMessage);

  // Send to Telegram if requested via flag
  if (process.argv.includes('--send')) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set');
      process.exit(1);
    }

    try {
      console.log('Sending notification to Telegram...');
      const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: finalMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }, {
        timeout: 15000 // 15 seconds timeout
      });
      console.log('Telegram notification sent successfully. Response status:', response.status);
    } catch (error: any) {
      console.error('Failed to send Telegram notification.');
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Response Data:', JSON.stringify(error.response.data));
        console.error('Response Status:', error.response.status);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received. Error Request:', error.message);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error Message:', error.message);
      }
      process.exit(1);
    }
  }
}

generateSummary().catch(err => {
  console.error(err);
  process.exit(1);
});
