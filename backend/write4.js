const fs = require('fs');
const p = 'src/app/personal/cat-health/page.tsx';
let c = fs.readFileSync(p, 'utf8');

// 1. Replace CAT_AVATARS line
c = c.replace(
  "const CAT_AVATARS = ['\uD83D\uDC31','\uD83D\uDC08','\uD83D\uDC08\u200D\u2B1B','\uD83D\uDE3A','\uD83D\uDE38','\uD83D\uDE3B','\uD83D\uDE3D','\uD83D\uDE40','\uD83D\uDE3F','\uD83D\uDE3E','\uD83E\uDD81','\uD83D\uDC2F','\uD83D\uDC06']",
  "import { CAT_COLORS } from '@/lib/cat-colors'"
);

// 2. Default avatar
c = c.replace("avatar: '\uD83D\uDC31' }", "avatar: 'orange' }");

// 3. Cat card avatar (emoji div -> img)
c = c.replace(
  "<div style={{ fontSize: 36, marginBottom: 6 }}>{c.avatar || '\uD83D\uDC31'}</div>",
  "<img src={'/cat-avatars/'+(c.avatar||'orange')+'.svg'} width={48} height={48} alt={c.name} style={{ borderRadius: 8 }} />"
);

// 4. Profile header avatar
c = c.replace(
  "{selectedCat.avatar || '\uD83D\uDC31'}",
  "<img src={'/cat-avatars/'+(selectedCat.avatar||'orange')+'.svg'} width={80} height={80} alt={selectedCat.name} />"
);

// 5. Empty state icon
c = c.replace(
  "<div style={{ fontSize: 64, marginBottom: 16 }}>\uD83D\uDC31</div>",
  "<img src=\"/cat-avatars/orange.svg\" width={80} height={80} alt=\"cat\" style={{ marginBottom: 16 }} />"
);

// 6. Avatar picker - find and replace the whole CAT_AVATARS.map block
const oldPicker = `{CAT_AVATARS.map(a => (
                <button key={a} onClick={() => setCatEd({ ...catEd, avatar: a })}
                  style={{ fontSize: 28, padding: '6px', borderRadius: 10, border: catEd.avatar === a ? '2px solid #6366f1' : '2px solid transparent', background: catEd.avatar === a ? 'rgba(99,102,241,0.2)' : 'transparent', cursor: 'pointer' }}>
                  {a}
                </button>
              ))}`;

const newPicker = `{CAT_COLORS.map(cc => (
                <button key={cc.id} onClick={() => setCatEd({ ...catEd, avatar: cc.id })}
                  style={{ padding: '4px', borderRadius: 10, border: catEd.avatar === cc.id ? '2px solid #6366f1' : '2px solid transparent', background: catEd.avatar === cc.id ? 'rgba(99,102,241,0.2)' : 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
                  <img src={'/cat-avatars/'+cc.id+'.svg'} width={52} height={52} alt={cc.label} />
                  <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2, maxWidth: 56, textAlign: 'center' as const }}>{cc.label.split(' ')[0]}</div>
                </button>
              ))}`;

c = c.replace(oldPicker, newPicker);

fs.writeFileSync(p, c, 'utf8');
console.log('done, CAT_COLORS found:', c.includes('CAT_COLORS'));
console.log('old avatar found:', c.includes('CAT_AVATARS'));