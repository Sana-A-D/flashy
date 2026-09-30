const fs = require('fs');
const path = require('path');

function replaceInFile(filepath, searchValue, replaceValue) {
  const fullPath = path.resolve(__dirname, filepath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(searchValue, replaceValue);
    fs.writeFileSync(fullPath, content);
  }
}

function replaceAllInFile(filepath, searchValue, replaceValue) {
  const fullPath = path.resolve(__dirname, filepath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.split(searchValue).join(replaceValue);
    fs.writeFileSync(fullPath, content);
  }
}

// items-images.controller.ts
replaceAllInFile('src/modules/items/item-images.controller.ts', 'const userId = req.user.id;', 'const userId = (req.user as any).id;');

// item-recognition.controller.ts
replaceAllInFile('src/modules/items/item-recognition.controller.ts', 'const userId = req.user.id;', 'const userId = (req.user as any).id;');

// item-images.service.ts
const imgServicePath = 'src/modules/items/item-images.service.ts';
if (fs.existsSync(path.resolve(__dirname, imgServicePath))) {
  let content = fs.readFileSync(path.resolve(__dirname, imgServicePath), 'utf8');
  content = content.replace(
    /data: {\s*itemId,\s*storageKey: data.storageKey,\s*mimeType: data.mimeType,\s*fileSize: data.fileSize,\s*originalFilename: data.originalFilename,\s*width: data.width,\s*height: data.height,\s*sortOrder: 0,\s*isPrimary: isFirst,\s*}/g,
    `data: (() => {
          const d = { itemId, storageKey: data.storageKey, mimeType: data.mimeType, fileSize: data.fileSize, originalFilename: data.originalFilename, width: data.width, height: data.height, sortOrder: 0, isPrimary: isFirst } as any;
          Object.keys(d).forEach(k => d[k] === undefined && delete d[k]);
          return d;
        })()`
  );
  fs.writeFileSync(path.resolve(__dirname, imgServicePath), content);
}

console.log('Fixed typescript issues in controllers and services');
