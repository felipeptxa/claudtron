/**
 * Cloudtron OneClick — Test Battery & Integrity Suite (v1.2.2)
 */

const { execSync } = require('child_process');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function report(name, passed, detail = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`[PASS] ${name}${detail ? ' — ' + detail : ''}`);
  } else {
    failedTests++;
    console.error(`[FAIL] ${name}${detail ? ' — ' + detail : ''}`);
  }
}

async function runSuite() {
  console.log('=====================================================');
  console.log('⚡ CLOUDTRON ONECLICK — BATERIA DE TESTES FUNCIONAIS');
  console.log('=====================================================\n');

  // 1. Syntax & Linting Checks
  console.log('--- 1. Validação de Sintaxe & Linting residual ---');
  try {
    execSync('node -c server.js', { stdio: 'pipe' });
    report('Sintaxe server.js', true);
  } catch (e) {
    report('Sintaxe server.js', false, e.message);
  }

  try {
    execSync('node -c main.js', { stdio: 'pipe' });
    report('Sintaxe main.js', true);
  } catch (e) {
    report('Sintaxe main.js', false, e.message);
  }

  // 2. Parsers Smoke Test
  console.log('\n--- 2. Smoke Test dos Parsers Locais ---');
  const parsers = ['pdf-parse', 'mammoth', 'xlsx', 'officeparser', 'adm-zip'];
  for (const p of parsers) {
    try {
      const mod = require(p);
      report(`Carga do módulo ${p}`, !!mod, `tipo: ${typeof mod}`);
    } catch (e) {
      report(`Carga do módulo ${p}`, false, e.message);
    }
  }

  // Functional test on adm-zip & xlsx
  try {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip();
    zip.addFile('cloudtron.txt', Buffer.from('OK'));
    const reader = new AdmZip(zip.toBuffer());
    report('adm-zip in-memory roundtrip', reader.readAsText('cloudtron.txt') === 'OK');
  } catch (e) {
    report('adm-zip in-memory roundtrip', false, e.message);
  }

  try {
    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([['A', 'B'], [1, 2]]);
    XLSX.utils.book_append_sheet(wb, ws, 'Test');
    const csv = XLSX.utils.sheet_to_csv(ws);
    report('xlsx in-memory sheet to csv', csv.trim() === 'A,B\n1,2');
  } catch (e) {
    report('xlsx in-memory sheet to csv', false, e.message);
  }

  // 3. CSS Depth in app.html
  console.log('\n--- 3. Integridade do CSS em app.html ---');
  try {
    const appHtml = fs.readFileSync('app.html', 'utf8');
    const styleMatch = appHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    if (!styleMatch) throw new Error('Tag style não encontrada');
    const css = styleMatch[1];
    let depth = 0;
    let cssErrors = 0;
    for (let i = 0; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') {
        depth--;
        if (depth < 0) { cssErrors++; depth = 0; }
      }
    }
    report('Auditoria de profundidade CSS (depth === 0)', depth === 0 && cssErrors === 0, `depth=${depth}, erros=${cssErrors}`);
  } catch (e) {
    report('Auditoria de profundidade CSS', false, e.message);
  }

  // 4. Test External URLs (Status 200/302)
  console.log('\n--- 4. Integridade de URLs da Landing Page ---');
  const criticalUrls = [
    'https://github.com/felipeptxa/cloudtron',
    'https://github.com/felipeptxa/cloudtron/releases',
    'https://github.com/felipeptxa/cloudtron/releases/tag/v1.2.2',
    'https://github.com/felipeptxa/cloudtron/releases/download/v1.2.2/Cloudtron-OneClick-Setup-1.2.2.exe',
    'https://github.com/felipeptxa/cloudtron/issues'
  ];

  function fetchStatus(urlStr) {
    return new Promise((resolve) => {
      const u = new URL(urlStr);
      https.get({
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: { 'User-Agent': 'Cloudtron-Test-Suite' }
      }, res => {
        resolve(res.statusCode);
      }).on('error', () => resolve(0));
    });
  }

  for (const url of criticalUrls) {
    const code = await fetchStatus(url);
    const ok = (code === 200 || code === 302);
    report(`URL: ${url}`, ok, `HTTP ${code}`);
  }

  // 5. Screenshots Generated
  console.log('\n--- 5. Verificação de Screenshots de Layout ---');
  const screenshotFiles = [
    'test-screenshots/landing-desktop-1920x1080.png',
    'test-screenshots/landing-mobile-390x844.png',
    'test-screenshots/app-desktop-1920x1080.png',
    'test-screenshots/app-mobile-390x844.png'
  ];
  for (const f of screenshotFiles) {
    const exists = fs.existsSync(f);
    const size = exists ? fs.statSync(f).size : 0;
    report(`Screenshot ${f}`, exists && size > 10000, `${(size / 1024).toFixed(1)} KB`);
  }

  console.log('\n=====================================================');
  console.log(`RESUMO DOS TESTES: ${passedTests}/${totalTests} PASSOU (${failedTests} falhas)`);
  console.log('=====================================================');

  if (failedTests > 0) process.exit(1);
}

runSuite().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
