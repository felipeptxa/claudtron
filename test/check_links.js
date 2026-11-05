const fs = require('fs');
const https = require('https');
const http = require('http');

function extractUrls(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.matchAll(/(?:href|src|content)=["'](https?:\/\/[^"'>\s]+)["']/g);
  const urls = new Set();
  for (const m of matches) {
    let u = m[1].replace(/&amp;/g, '&');
    if (!u.includes('schema.org') && !u.includes('w3.org') && !u.includes('SEU-USUARIO')) {
      urls.add(u);
    }
  }
  return Array.from(urls);
}

function checkUrl(urlStr, redirects = 0) {
  return new Promise((resolve) => {
    if (redirects > 5) return resolve({ url: urlStr, status: 'TOO_MANY_REDIRECTS', ok: false });
    let u;
    try {
      u = new URL(urlStr);
    } catch (_) {
      return resolve({ url: urlStr, status: 'INVALID_URL', ok: false });
    }

    const client = u.protocol === 'https:' ? https : http;
    const req = client.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let nextUrl = res.headers.location;
        if (!nextUrl.startsWith('http')) {
          nextUrl = new URL(nextUrl, urlStr).toString();
        }
        res.resume();
        return checkUrl(nextUrl, redirects + 1).then(r => resolve({ ...r, originalUrl: urlStr }));
      }
      res.resume();
      resolve({ url: urlStr, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
    });

    req.on('error', err => resolve({ url: urlStr, status: err.message, ok: false }));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ url: urlStr, status: 'TIMEOUT', ok: false });
    });
    req.end();
  });
}

async function run() {
  const files = [
    'c:/Users/felip/Documents/Projetos_Claude/CLAUTRON SITE/index.html',
    'c:/Users/felip/Documents/Projetos_Claude/GITHUB/index.html',
    'c:/Users/felip/Documents/Projetos_Claude/GITHUB/docs/index.html'
  ];

  const allUrls = new Set();
  files.forEach(f => extractUrls(f).forEach(u => allUrls.add(u)));

  console.log(`[LINK INTEGRITY TEST] Testing ${allUrls.size} unique URLs...`);
  const results = [];
  for (const u of allUrls) {
    const res = await checkUrl(u);
    const displayUrl = res.originalUrl || res.url;
    console.log(`${res.ok ? '✓ PASS' : '✗ FAIL'} [HTTP ${res.status}] ${displayUrl}`);
    results.push(res);
  }

  const failed = results.filter(r => !r.ok);
  console.log(`\nResults: ${results.length - failed.length}/${results.length} passed.`);
  if (failed.length > 0) {
    console.log('Failed URLs:', failed);
  }
}

run();
