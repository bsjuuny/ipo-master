import { chromium, Browser, Page } from 'playwright';
import { IPO, BrokerCompetition } from '@/types/ipo';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';

dotenv.config();

const FINUTS_BASE_URL = 'https://www.finuts.co.kr';
const LOGIN_PAGE_URL = `${FINUTS_BASE_URL}/html/user/login.php`;
const LIST_URL = `${FINUTS_BASE_URL}/html/ipo/ipoList.php`;

async function login(page: Page) {
  const email = process.env.NEXT_PUBLIC_FINUTS_EMAIL;
  const password = process.env.NEXT_PUBLIC_FINUTS_PASSWORD;

  if (!email || !password) {
    console.warn('Finuts credentials not found. Skipping login.');
    return false;
  }

  try {
    const navigateWithRetry = async (url: string, retries = 2) => {
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`[Finuts] Navigating to ${url} (Attempt ${i + 1})...`);
          return await page.goto(url, { waitUntil: 'load', timeout: 45000 });
        } catch (e) {
          if (i === retries - 1) throw e;
          console.warn(`[Finuts] Navigation failed, retrying in 2s...`);
          await page.waitForTimeout(2000);
        }
      }
    };

    await navigateWithRetry(LOGIN_PAGE_URL);

    // Diagnostic logging
    const title = await page.title();
    console.log(`[Finuts] Page Title: "${title}"`);

    // Wait for form elements with detailed failure info
    try {
      await page.waitForSelector('#user_id', { timeout: 20000 });
    } catch (e) {
      const currentUrl = page.url();
      const content = await page.content();
      console.error(`[Finuts] #user_id not found on ${currentUrl}.`);
      console.log(`[Finuts] Page Title: "${title}"`);
      console.log('[Finuts] Page Content Snippet:', content.substring(0, 1000));
      
      if (content.includes('Cloudflare') || content.includes('_captcha')) {
        console.error('[Finuts] Anti-bot (Cloudflare/Captcha) detected!');
      }
      return false;
    }

    await page.waitForSelector('#user_pwd', { timeout: 10000 });

    // Fill login form
    await page.fill('#user_id', email);
    await page.fill('#user_pwd', password);
    
    console.log('[Finuts] Submitting login form via #btn_login...');
    // Click login button and wait for navigation or state change
    await page.click('#btn_login');
    
    // Wait for either navigation or success UI
    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }),
        page.waitForSelector('a:has-text("로그아웃"), .btn-logout, text="로그아웃"', { timeout: 30000 })
      ]);
    } catch (e) {
      console.warn('[Finuts] Login post-action wait timed out, checking final state...');
    }

    const postLoginUrl = page.url();
    const finalContent = await page.content();
    console.log('[Finuts] Post-login URL:', postLoginUrl);
    
    // Final verification
    if (finalContent.includes('로그아웃') || finalContent.includes('마이페이지') || postLoginUrl.includes('index.php')) {
      console.log('[Finuts] Login successful.');
      return true;
    }

    console.error('[Finuts] Login failed. Final URL:', postLoginUrl);
    return false;
  } catch (error) {
    console.error('[Finuts] Error during login:', error);
    return false;
  }
}

export async function scrapeFinutsCompetition(): Promise<Map<string, Partial<IPO>>> {
  const competitionMap = new Map<string, Partial<IPO>>();
  let browser: Browser | null = null;

  try {
    console.log('[Finuts] Launching browser...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    const isLoggedIn = await login(page);
    if (!isLoggedIn) {
      console.error('[Finuts] Could not log in. Skipping competition data.');
      await browser.close();
      return competitionMap;
    }

    // Verify session on list page before proceeding
    console.log('[Finuts] Verifying session on list page...');
    await page.goto(LIST_URL, { waitUntil: 'load' });
    const listContent = await page.content();
    if (listContent.includes('로그인 후 열람') || listContent.includes('member_login.php')) {
      console.error('[Finuts] Session not active on list page. Aborting.');
      await browser.close();
      return competitionMap;
    }

    // 1. Fetch IPO List using the API
    console.log('[Finuts] Fetching IPO list via API...');
    const listData = await page.evaluate(async () => {
      const response = await fetch('/html/task/ipo/ipoListQuery.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: 'active=ipo-011&search_text='
      });
      return response.json();
    });

    if (!listData || !listData.data || !Array.isArray(listData.data)) {
      console.error('[Finuts] Invalid list data received.');
      await browser.close();
      return competitionMap;
    }

    const items = listData.data.map((entry: { ENT_NM: string; IPO_SN: string }) => ({
      name: entry.ENT_NM,
      detailUrl: `${FINUTS_BASE_URL}/html/ipo/ipoView.php?ipo_sn=${entry.IPO_SN}`
    }));

    console.log(`[Finuts] Found ${items.length} items. Scraping first 60...`);

    for (const item of items.slice(0, 60)) {
      try {
        console.log(`[Finuts] Navigating to: ${item.name}`);
        await page.goto(item.detailUrl, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(1500); 

        // Positive check for session
        const logoutExists = await page.locator('a:has-text("로그아웃"), .btn-logout').count() > 0;
        const loginRequiredVisible = await page.locator('text="로그인 후 열람"').isVisible();

        if (!logoutExists || loginRequiredVisible || page.url().includes('login.php')) {
          console.error(`[Finuts] Session inactive for ${item.name}. (Url: ${page.url()}, Logout: ${logoutExists}, LoginReq: ${loginRequiredVisible})`);
          console.log(`[Finuts] Current Page Title: "${await page.title()}"`);
          console.log('[Finuts] Attempting re-login...');
          const reLoggedIn = await login(page);
          if (!reLoggedIn) {
            console.error('[Finuts] Re-login failed.');
            continue;
          }
          await page.goto(item.detailUrl, { waitUntil: 'load' });
          await page.waitForTimeout(1000);
        }

        const html = await page.content();
        const $detail = cheerio.load(html);
        const brokers: BrokerCompetition[] = [];
        
        // Target the specific subscription summary table
        $detail('.tbl-type1 tr, .tbl-type2 tr, #ipo-subscription table tr').each((_, tr) => {
          const cells = $detail(tr).find('td');
          if (cells.length >= 3) {
            const brokerName = $detail(cells[0]).text().trim();
            // Filter out noise
            if (brokerName && !brokerName.includes('주간사') && !brokerName.includes('구분') && !brokerName.includes('기관')) {
              const compRate = $detail(cells[1]).text().trim();
              brokers.push({
                brokerName,
                competitionRate: compRate,
                equalAllocation: $detail(cells[2]).text().trim(),
                proportionalAllocation: compRate, // On Finuts, this is the proportional rate
              });
            }
          }
        });

        // Robust total competition extraction
        let totalComp = 'N/A';
        $detail('th, td').each((_, el) => {
          const text = $detail(el).text().trim();
          if (text === '기관경쟁률') {
            totalComp = $detail(el).next('td').text().trim();
          } else if (text === '청약경쟁률' && totalComp === 'N/A') {
             // Fallback if no specific institutional rate
             const nextVal = $detail(el).next('td').text().trim();
             if (nextVal) totalComp = nextVal;
          }
        });

        if (brokers.length > 0) {
          console.log(`[Finuts] Extracted ${brokers.length} brokers for ${item.name}`);
        }

        competitionMap.set(item.name, {
          companyName: item.name,
          competitionData: brokers,
          totalCompetition: totalComp !== 'N/A' ? totalComp : (brokers.length > 0 ? brokers[0].competitionRate : 'N/A'),
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error(`[Finuts] Error fetching ${item.name}:`, err);
      }
    }

    await browser.close();
    return competitionMap;
  } catch (error) {
    console.error('[Finuts] Global error during scraping:', error);
    if (browser) await browser.close();
    return competitionMap;
  }
}
