const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/NewTouch/.gemini/antigravity-ide/brain';
const folders = fs.readdirSync(dir);
for (const f of folders) {
  const p = path.join(dir, f, '.system_generated', 'logs', 'transcript.jsonl');
  if (fs.existsSync(p)) {
    try {
      const content = fs.readFileSync(p, 'utf8');
      const matches = content.match(/Phase\s+2[0-9]\s*[-—–:][^\n\r\"\']*/gi);
      if (matches) {
        const unique = Array.from(new Set(matches.map(m => m.trim())));
        if (unique.length > 0) {
          console.log('=== FOLDER:', f, '===');
          console.log(unique);
        }
      }
    } catch(e){}
  }
}
