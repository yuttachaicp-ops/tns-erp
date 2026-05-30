const fs = require('fs');

// SVG cat face generator by color
const catSVG = (bg, ear, face, stripe, pattern) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="55" r="32" fill="${bg}"/>
  <polygon points="22,30 35,52 8,52" fill="${ear}"/>
  <polygon points="78,30 65,52 92,52" fill="${ear}"/>
  <polygon points="25,32 36,50 14,50" fill="${face}"/>
  <polygon points="75,32 64,50 86,50" fill="${face}"/>
  ${stripe}
  <circle cx="38" cy="52" r="7" fill="white"/>
  <circle cx="62" cy="52" r="7" fill="white"/>
  <circle cx="39" cy="53" r="4" fill="#1a1a2e"/>
  <circle cx="63" cy="53" r="4" fill="#1a1a2e"/>
  <circle cx="40" cy="52" r="1.5" fill="white"/>
  <circle cx="64" cy="52" r="1.5" fill="white"/>
  <ellipse cx="50" cy="63" rx="5" ry="3.5" fill="${ear}"/>
  <path d="M42,67 Q50,72 58,67" stroke="#c0c0c0" stroke-width="1.5" fill="none"/>
  <line x1="55" y1="62" x2="75" y2="58" stroke="#c0c0c0" stroke-width="1"/>
  <line x1="55" y1="64" x2="75" y2="64" stroke="#c0c0c0" stroke-width="1"/>
  <line x1="45" y1="62" x2="25" y2="58" stroke="#c0c0c0" stroke-width="1"/>
  <line x1="45" y1="64" x2="25" y2="64" stroke="#c0c0c0" stroke-width="1"/>
</svg>`;

const CAT_COLORS = [
  { id: 'orange', label: 'ส้ม (Ginger)', bg: '#e8823a', ear: '#c86820', face: '#f0a060', stripe: '<line x1="38" y1="38" x2="62" y2="38" stroke="#c86820" stroke-width="2"/><line x1="35" y1="44" x2="65" y2="44" stroke="#c86820" stroke-width="2"/>' },
  { id: 'black', label: 'ดำ (Black)', bg: '#1a1a1a', ear: '#111111', face: '#2a2a2a', stripe: '' },
  { id: 'white', label: 'ขาว (White)', bg: '#f0f0f0', ear: '#ffd0d0', face: '#fff5f5', stripe: '' },
  { id: 'gray', label: 'เทา (Gray)', bg: '#7a7a8a', ear: '#5a5a6a', face: '#9a9aaa', stripe: '<line x1="38" y1="38" x2="62" y2="38" stroke="#5a5a6a" stroke-width="2"/><line x1="35" y1="44" x2="65" y2="44" stroke="#5a5a6a" stroke-width="2"/>' },
  { id: 'brown', label: 'น้ำตาล (Brown)', bg: '#8B5E3C', ear: '#6B3E1C', face: '#A07850', stripe: '' },
  { id: 'cream', label: 'ครีม (Cream)', bg: '#F5DEB3', ear: '#DEB887', face: '#FFF8DC', stripe: '' },
  { id: 'tabby_brown', label: 'ลายเสือน้ำตาล (Brown Tabby)', bg: '#A0714F', ear: '#7A5030', face: '#C09070', stripe: '<line x1="35" y1="36" x2="65" y2="36" stroke="#6B3E1C" stroke-width="2.5"/><line x1="33" y1="42" x2="67" y2="42" stroke="#6B3E1C" stroke-width="2"/><line x1="36" y1="48" x2="64" y2="48" stroke="#6B3E1C" stroke-width="1.5"/>' },
  { id: 'tabby_gray', label: 'ลายเสือเทา (Gray Tabby)', bg: '#808090', ear: '#606070', face: '#A0A0B0', stripe: '<line x1="35" y1="36" x2="65" y2="36" stroke="#404050" stroke-width="2.5"/><line x1="33" y1="42" x2="67" y2="42" stroke="#404050" stroke-width="2"/><line x1="36" y1="48" x2="64" y2="48" stroke="#404050" stroke-width="1.5"/>' },
  { id: 'calico', label: 'สามสี (Calico)', bg: '#f0f0f0', ear: '#ffd0d0', face: '#fff5f5', stripe: '<circle cx="35" cy="45" r="10" fill="#e8823a" opacity="0.8"/><circle cx="65" cy="40" r="8" fill="#1a1a1a" opacity="0.7"/>' },
  { id: 'tuxedo', label: 'ทักซิโด (Tuxedo)', bg: '#1a1a1a', ear: '#111111', face: '#2a2a2a', stripe: '<ellipse cx="50" cy="65" rx="12" ry="8" fill="white"/><circle cx="50" cy="55" r="6" fill="white"/>' },
  { id: 'siamese', label: 'สยาม (Siamese)', bg: '#F5DEB3', ear: '#8B4513', face: '#FFF8DC', stripe: '<circle cx="50" cy="55" r="15" fill="#D2691E" opacity="0.3"/>' },
  { id: 'blue_gray', label: 'เทาน้ำเงิน (Blue/Russian Blue)', bg: '#6a7fa0', ear: '#4a5f80', face: '#8a9fc0', stripe: '' },
];

// Write SVG files
const svgDir = 'public/cat-avatars';
if (!fs.existsSync('public')) fs.mkdirSync('public');
if (!fs.existsSync(svgDir)) fs.mkdirSync(svgDir, { recursive: true });

CAT_COLORS.forEach(c => {
  const svg = catSVG(c.bg, c.ear, c.face, c.stripe, c.id);
  fs.writeFileSync(`${svgDir}/${c.id}.svg`, svg, 'utf8');
});

// Write colors config
fs.writeFileSync('src/lib/cat-colors.ts',
`export const CAT_COLORS = ${JSON.stringify(CAT_COLORS, null, 2)} as const;
export type CatColorId = typeof CAT_COLORS[number]['id'];
`, 'utf8');

console.log('Generated', CAT_COLORS.length, 'cat avatars');