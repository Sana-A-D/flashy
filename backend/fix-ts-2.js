const fs = require('fs');
const path = require('path');

function replaceAllInFile(filepath, searchValue, replaceValue) {
  const fullPath = path.resolve(__dirname, filepath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.split(searchValue).join(replaceValue);
    fs.writeFileSync(fullPath, content);
  }
}

function replaceRegexInFile(filepath, regex, replaceValue) {
  const fullPath = path.resolve(__dirname, filepath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(regex, replaceValue);
    fs.writeFileSync(fullPath, content);
  }
}

// auth.controller.ts
replaceRegexInFile('src/modules/auth/auth.controller.ts', /error\.errors/g, '(error as z.ZodError<any>).errors');

// sale.controller.ts
replaceRegexInFile('src/modules/sales/sale.controller.ts', /\(error as z\.ZodError\)\.errors/g, '(error as z.ZodError<any>).errors');
replaceRegexInFile('src/modules/sales/sale.controller.ts', /error\.errors/g, '(error as z.ZodError<any>).errors'); // fallback

// item-images.controller.ts
replaceAllInFile('src/modules/items/item-images.controller.ts', "import { handleError } from '../../shared/errors/error-handler';", "");
replaceAllInFile('src/modules/items/item-images.controller.ts', "return handleError(error, reply);", "if ((error as any).statusCode) return reply.status((error as any).statusCode).send({ error: (error as any).message }); return reply.status(500).send({ error: 'Internal Server Error' });");

// item-recognition.controller.ts
replaceAllInFile('src/modules/items/item-recognition.controller.ts', 'const data = req.body;', 'const data = req.body as any;');

// sale.service.spec.ts
replaceRegexInFile('src/modules/sales/sale.service.spec.ts', /salePrice: 50,\s*marketplaceListingId: 'listing-1'/g, 'salePrice: 50, marketplaceListingId: "listing-1", marketplaceFees: 0, shippingCost: 0, otherExpenses: 0');
replaceRegexInFile('src/modules/sales/sale.service.spec.ts', /salePrice: 100,\s*marketplaceListingId: 'invalid-listing'/g, 'salePrice: 100, marketplaceListingId: "invalid-listing", marketplaceFees: 0, shippingCost: 0, otherExpenses: 0');

// ebay.adapter.spec.ts
replaceRegexInFile('src/modules/marketplaces/adapters/ebay.adapter.spec.ts', /invCall\(/g, 'invCall!(');
replaceRegexInFile('src/modules/marketplaces/adapters/ebay.adapter.spec.ts', /offerCall\(/g, 'offerCall!(');

// delisting.service.spec.ts
replaceRegexInFile('src/modules/marketplaces/delisting.service.spec.ts', /adapter\./g, 'adapter!.');
