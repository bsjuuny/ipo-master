
import axios from 'axios';
import iconv from 'iconv-lite';

async function test() {
  const start = Date.now();
  console.log('Fetching schedule...');
  const res = await axios.get('http://www.38.co.kr/html/fund/?o=k&page=1', {
    responseType: 'arraybuffer',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  });
  console.log(`Schedule fetched in ${Date.now() - start}ms`);
  
  const start2 = Date.now();
  console.log('Fetching detail...');
  // Use a known ID if possible, or just first one
  const res2 = await axios.get('http://www.38.co.kr/html/fund/index.htm?o=v&no=2285', {
    responseType: 'arraybuffer',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  });
  console.log(`Detail fetched in ${Date.now() - start2}ms`);
}

test().catch(console.error);
