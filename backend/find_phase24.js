const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/NewTouch/.gemini/antigravity-ide/brain';
const folders = fs.readdirSync(dir);
for (const f of folders) {
  const p = path.join(dir, f, '.system_generated', 'logs', 'transcript.jsonl');
  if (fs.existsSync(p)) {
    try {
      const content = fs.readFileSync(p, 'utf8');
      const matches = content.match(/Phase\s+24[^\n\r\"\']*/gi);
      if (matches) {
        const filtered = matches.filter(m => 
          !m.includes('⏳') && 
          !m.includes('DONE') && 
          !m.includes('Phase 24 or') && 
          !m.includes('Phase 24+') &&
          !m.includes('Phase 24.') &&
          !m.includes('Phase 24 scope') &&
          !m.includes('Phase 24 status') &&
          !m.includes('Phase 24 workflow')
        );
        if (filtered.length > 0) {
          console.log(f, filtered);
        }
      }
    } catch(e){}
  }
}
