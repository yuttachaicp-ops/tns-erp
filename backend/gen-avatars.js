const fs = require('fs');
const d = 'public/cat-avatars';
fs.mkdirSync(d, { recursive: true });

const svg = (bg, e, f, x) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="20,50 30,15 44,50" fill="${e}"/><polygon points="56,50 70,15 80,50" fill="${e}"/><polygon points="24,47 30,22 40,47" fill="${f}" opacity=".7"/><polygon points="60,47 70,22 76,47" fill="${f}" opacity=".7"/><circle cx="50" cy="57" r="34" fill="${bg}"/><ellipse cx="50" cy="70" rx="16" ry="12" fill="${f}" opacity=".45"/>${x}<ellipse cx="37" cy="50" rx="5" ry="6" fill="#111"/><ellipse cx="63" cy="50" rx="5" ry="6" fill="#111"/><circle cx="38.5" cy="48.5" r="1.8" fill="white"/><circle cx="64.5" cy="48.5" r="1.8" fill="white"/><polygon points="50,63 47,68 53,68" fill="#f090a0"/><path d="M47,68 Q43,73 40,71" stroke="#888" stroke-width="1.2" fill="none"/><path d="M53,68 Q57,73 60,71" stroke="#888" stroke-width="1.2" fill="none"/></svg>`;

const cats = [
  ['orange','#e8823a','#c86820','#f0a060','<line x1="38" y1="38" x2="62" y2="38" stroke="#c86820" stroke-width="2"/><line x1="35" y1="44" x2="65" y2="44" stroke="#c86820" stroke-width="2"/>'],
  ['black','#1a1a1a','#111111','#2a2a2a',''],
  ['white','#f0f0f0','#ffd0d0','#fff5f5',''],
  ['gray','#7a7a8a','#5a5a6a','#9a9aaa','<line x1="38" y1="38" x2="62" y2="38" stroke="#5a5a6a" stroke-width="2"/><line x1="35" y1="44" x2="65" y2="44" stroke="#5a5a6a" stroke-width="2"/>'],
  ['brown','#8B5E3C','#6B3E1C','#A07850',''],
  ['cream','#F5DEB3','#DEB887','#FFF8DC',''],
  ['tabby_brown','#A0714F','#7A5030','#C09070','<line x1="35" y1="36" x2="65" y2="36" stroke="#6B3E1C" stroke-width="2.5"/><line x1="33" y1="42" x2="67" y2="42" stroke="#6B3E1C" stroke-width="2"/><line x1="36" y1="48" x2="64" y2="48" stroke="#6B3E1C" stroke-width="1.5"/>'],
  ['tabby_gray','#808090','#606070','#A0A0B0','<line x1="35" y1="36" x2="65" y2="36" stroke="#404050" stroke-width="2.5"/><line x1="33" y1="42" x2="67" y2="42" stroke="#404050" stroke-width="2"/><line x1="36" y1="48" x2="64" y2="48" stroke="#404050" stroke-width="1.5"/>'],
  ['calico','#f0f0f0','#ffd0d0','#fff5f5','<circle cx="35" cy="45" r="10" fill="#e8823a" opacity=".8"/><circle cx="65" cy="40" r="8" fill="#1a1a1a" opacity=".7"/>'],
  ['tuxedo','#1a1a1a','#111111','#2a2a2a','<ellipse cx="50" cy="65" rx="12" ry="8" fill="white"/><circle cx="50" cy="55" r="6" fill="white"/>'],
  ['siamese','#F5DEB3','#8B4513','#FFF8DC','<circle cx="50" cy="55" r="15" fill="#D2691E" opacity=".3"/>'],
  ['blue_gray','#6a7fa0','#4a5f80','#8a9fc0',''],
];

cats.forEach(([id, bg, e, f, x]) => {
  fs.writeFileSync(`${d}/${id}.svg`, svg(bg, e, f, x));
  console.log('created', id + '.svg');
});
console.log('Done!');