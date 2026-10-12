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
  const footer = `🔗 웹사이트 바로가기: <a href="https://bsjuuny2026.mycafe24.com/ipomaster/">바로가기</a>\n🔗 리포지토리: <a href="https://github.com/bsjuuny/ipo-master/actions">확인하기</a>`;

  const finalMessage = `${header}\n\n${divider}\n${sections.join('\n\n')}\n${divider}\n\n${footer}`;
  
  fs.writeFileSync(outputPath, finalMessage, 'utf8');
  console.log('Summary generated successfully:');
  console.log(finalMessage);

  // Send to Telegram if requested via flag
  if (process.argv.includes('--send') || process.argv.includes('--failure')) {
    const isFailure = process.argv.includes('--failure');
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set');
      process.exit(1);
    }

    const message = isFailure 
      ? `🚨 <b>IPO Master 배포 실패!</b>\n\n데이터 업데이트 또는 빌드 과정에서 오류가 발생했습니다.\n🔗 리포지토리: <a href="https://github.com/bsjuuny/ipo-master/actions">확인하기</a>`
      : finalMessage;

    console.log(`Sending ${isFailure ? 'failure' : 'success'} notification to Telegram...`);
    const { sent, attempts } = await sendTelegram(token, chatId, message);
    if (!sent) {
      // 예전엔 실패를 console.warn 으로만 남기고 exit 0 으로 끝났다. 스케줄러(lib/shell.mjs
      // run)는 성공한 명령의 stderr 를 버리므로 실패가 어디에도 안 남았다(2026-10-07·09·12
      // 미발송). 이제 비정상 종료해서 스케줄러 로그에 남고 watchdog 이 알린다.
      console.error(`[ipo-notify] Telegram 전송 최종 실패 (${attempts}회 시도)`);
      process.exit(1);
    }
  }
}

const MAX_SEND_ATTEMPTS = 3;

/** 실패 원인 한 줄. error.config·error.request 에는 봇 토큰이 든 URL 이 있어 쓰지 않는다. */
function describeSendError(error: any): string {
  if (error?.response) {
    const data = error.response.data;
    const detail = data?.description ?? JSON.stringify(data ?? '').slice(0, 300);
    return `HTTP ${error.response.status} ${detail}`;
  }
  const code = error?.code ? `${error.code} ` : '';
  return `${code}${error?.message ?? String(error)}`.replace(/bot\d+:[A-Za-z0-9_-]+/g, 'bot<redacted>');
}

async function sendTelegram(token: string, chatId: string, text: string): Promise<{ sent: boolean; attempts: number }> {
  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
    try {
      const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }, {
        timeout: 15000,
        // scheduler/run-tg-report.mjs 와 같은 이유로 IPv4 고정(IPv6 ENETUNREACH 방지).
        family: 4,
      });
      console.log(`Telegram notification sent successfully. Response status: ${response.status} (attempt ${attempt}/${MAX_SEND_ATTEMPTS})`);
      return { sent: true, attempts: attempt };
    } catch (error: any) {
      const status: number | undefined = error?.response?.status;
      console.error(`[ipo-notify] Telegram 전송 실패 (시도 ${attempt}/${MAX_SEND_ATTEMPTS}): ${describeSendError(error)}`);
      // 429 를 뺀 4xx 는 다시 보내도 같다 - 토큰·chat_id·HTML 파싱 문제라 바로 멈춘다.
      if (status !== undefined && status >= 400 && status < 500 && status !== 429) return { sent: false, attempts: attempt };
      if (attempt < MAX_SEND_ATTEMPTS) {
        const retryAfterSec = Number(error?.response?.data?.parameters?.retry_after) || 0;
        await new Promise((resolve) => setTimeout(resolve, retryAfterSec > 0 ? retryAfterSec * 1000 : 2000 * attempt));
      }
    }
  }
  return { sent: false, attempts: MAX_SEND_ATTEMPTS };
}

generateSummary().catch(err => {
  console.error(err);
  process.exit(1);
});
