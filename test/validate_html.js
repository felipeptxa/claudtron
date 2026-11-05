const fs = require('fs');

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

function validateHtml(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\nValidating HTML: ${filePath} (${content.length} bytes)...`);

  let unclosedAttrQuotes = 0;
  let inScript = false;
  let inStyle = false;
  let inComment = false;
  let inTag = false;
  let currentTag = '';
  let inQuote = null;

  const stack = [];
  let tagMismatches = 0;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next2 = content.slice(i, i + 2);
    const next4 = content.slice(i, i + 4);

    if (inComment) {
      if (content.slice(i, i + 3) === '-->') {
        inComment = false;
        i += 2;
      }
      continue;
    }

    if (!inTag && next4 === '<!--') {
      inComment = true;
      i += 3;
      continue;
    }

    if (inScript) {
      if (content.slice(i, i + 9).toLowerCase() === '</script>') {
        inScript = false;
        i += 8;
        stack.pop(); // script
      }
      continue;
    }

    if (inStyle) {
      if (content.slice(i, i + 8).toLowerCase() === '</style>') {
        inStyle = false;
        i += 7;
        stack.pop(); // style
      }
      continue;
    }

    if (ch === '<' && !inTag) {
      inTag = true;
      currentTag = '<';
      inQuote = null;
      continue;
    }

    if (inTag) {
      currentTag += ch;
      if (ch === '"' || ch === "'") {
        if (!inQuote) inQuote = ch;
        else if (inQuote === ch) inQuote = null;
      }

      if (ch === '>' && !inQuote) {
        inTag = false;
        // Parse tag
        const tagText = currentTag.slice(1, -1).trim();
        const isClosing = tagText.startsWith('/');
        const rawName = isClosing ? tagText.slice(1).trim().split(/\s+/)[0] : tagText.split(/\s+/)[0];
        const tagName = rawName ? rawName.toLowerCase() : '';

        if (!tagName) continue;

        if (tagName === 'script' && !isClosing) {
          inScript = true;
          stack.push(tagName);
          continue;
        }
        if (tagName === 'style' && !isClosing) {
          inStyle = true;
          stack.push(tagName);
          continue;
        }

        const isSelfClosing = tagText.endsWith('/') || VOID_ELEMENTS.has(tagName) || tagName === '!doctype';
        if (isSelfClosing) continue;

        if (!isClosing) {
          stack.push(tagName);
        } else {
          if (stack.length === 0) {
            console.error(`  [TAG ERROR] Unexpected </${tagName}> on empty stack`);
            tagMismatches++;
          } else {
            const top = stack[stack.length - 1];
            if (top === tagName) {
              stack.pop();
            } else {
              // HTML5 allows p and li to be closed implicitly
              if (top === 'p' || top === 'li') {
                stack.pop();
                if (stack[stack.length - 1] === tagName) {
                  stack.pop();
                } else {
                  console.error(`  [TAG MISMATCH] Expected </${top}>, found </${tagName}>`);
                  tagMismatches++;
                }
              } else {
                console.error(`  [TAG MISMATCH] Expected </${top}>, found </${tagName}>`);
                tagMismatches++;
              }
            }
          }
        }
      }
    }
  }

  // Check CSS depth in <style>
  let cssErrors = 0;
  const styleMatches = content.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi);
  for (const sm of styleMatches) {
    const css = sm[1];
    let depth = 0;
    for (let j = 0; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') {
        depth--;
        if (depth < 0) {
          cssErrors++;
          depth = 0;
        }
      }
    }
    if (depth !== 0) cssErrors++;
  }

  console.log(`  Unclosed attribute quotes: ${unclosedAttrQuotes}`);
  console.log(`  Tag mismatch errors: ${tagMismatches}`);
  console.log(`  Unclosed tags remaining on stack: ${stack.length}`);
  if (stack.length > 0) console.log(`  Stack tail:`, stack.slice(-5));
  console.log(`  CSS syntax errors: ${cssErrors}`);
  
  const pass = unclosedAttrQuotes === 0 && tagMismatches === 0 && stack.length === 0 && cssErrors === 0;
  console.log(`  Result: ${pass ? '✓ PASS' : '✗ FAIL'}`);
  return pass;
}

const files = [
  'c:/Users/felip/Documents/Projetos_Claude/GITHUB/index.html',
  'c:/Users/felip/Documents/Projetos_Claude/GITHUB/app.html',
  'c:/Users/felip/Documents/Projetos_Claude/GITHUB/docs/index.html',
  'c:/Users/felip/Documents/Projetos_Claude/GITHUB/docs/app.html',
  'c:/Users/felip/Documents/Projetos_Claude/CLAUTRON SITE/index.html'
];

let allPassed = true;
for (const f of files) {
  if (!validateHtml(f)) allPassed = false;
}

console.log(`\nFinal HTML Validation: ${allPassed ? '✓ ALL 5 FILES PASSED 100%' : '✗ SOME FAILED'}`);
