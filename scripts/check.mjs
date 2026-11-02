// Repeatable pre-deploy check for the privacy policy page. No dependencies.
// Usage: node site/scripts/check.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const siteDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(siteDir, 'index.html'), 'utf8');
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
const css = styleMatch ? styleMatch[1] : '';

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

// 1. Tags are balanced (void elements and self-closing tags excluded).
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const stack = [];
for (const match of html.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)(\/?)>/g)) {
  const [, closing, rawTag, , selfClosing] = match;
  const tag = rawTag.toLowerCase();
  if (voidTags.has(tag) || selfClosing === '/') continue;
  if (!closing) {
    stack.push(tag);
    continue;
  }
  const open = stack.pop();
  check(open === tag, `unbalanced tag: </${tag}> closes <${open}>`);
}
check(stack.length === 0, `unclosed tags: ${stack.join(', ')}`);

// 2. Self-contained: inline style present, no JS, no external resource loads.
check(css.length > 0, 'missing inline <style> block');
check(!/<script/i.test(html), 'page must not contain <script>');
check(!/<(img|iframe|video|audio|object|embed)\b/i.test(html), 'page must not embed media');
const linkAttrs = [...html.matchAll(/<link\b([^>]*)>/gi)].map((match) => match[1]);
const loadedRefs = linkAttrs
  .filter((attrs) => !/rel="(?:canonical|alternate)"/i.test(attrs))
  .map((attrs) => (attrs.match(/href="([^"]+)"/i) || [])[1])
  .filter(Boolean);
const externalResources = loadedRefs.filter((ref) => /^(https?:)?\/\//i.test(ref));
check(externalResources.length === 0, `external resource load found: ${externalResources.join(', ')}`);

// 3. Anchors resolve and ids are unique.
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
check(duplicateIds.length === 0, `duplicate ids: ${duplicateIds.join(', ')}`);
const missing = anchors.filter((anchor) => !ids.includes(anchor));
check(missing.length === 0, `missing anchor targets: ${missing.join(', ')}`);

// 4. Required policy content.
const required = {
  'app name': 'PDF All-in-One: Ký &amp; Chỉnh Sửa',
  'support email': 'dlong.work06@gmail.com',
  'last updated date': '02/11/2026',
  'controller name': 'Nguyễn Đức Long',
  'data protection law': '91/2025/QH15',
  'skip link': 'class="skip-link"',
  'table captions': '<caption class="sr-only">',
  'backup disclosure': 'Auto Backup',
};
for (const [label, value] of Object.entries(required)) {
  check(html.includes(value), `missing ${label}: ${value}`);
}

// 5. No placeholder text or outdated app name.
check(!/TODO|FIXME|lorem ipsum|PDF Gọn/i.test(html), 'placeholder or outdated app name found');

// 6. Banned absolute claims (see tasks/feature-pdf-privacy-policy-site/privacy-evidence-matrix.md).
const bannedClaims = [
  /không rời khỏi thiết bị/i,
  /chỉ nằm trên thiết bị/i,
  /không bao giờ (rời|ghi|thu thập)/i,
  /xoá vĩnh viễn/i,
  /mã hoá khi lưu trữ/i,
  /dữ liệu không bao giờ/i,
];
for (const pattern of bannedClaims) {
  check(!pattern.test(html), `banned absolute claim: ${pattern}`);
}

// 7. Accessibility and theming tokens exist in the inline stylesheet.
for (const token of ['--on-primary', '--warn-bg', 'prefers-color-scheme', ':focus-visible', '@media print']) {
  check(css.includes(token), `missing CSS token/rule: ${token}`);
}

console.log(`index.html: ${html.split('\n').length} lines (single file, ${css.split('\n').length} CSS lines)`);
if (failures.length > 0) {
  console.error(`FAIL (${failures.length})`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log('PASS: structure, anchors, no scripts, no external resources, required content, no banned claims');
