import { ebayService } from './src/modules/ebay/ebay.service';

const url = ebayService.generateOAuthUrl('test_user', 'test_url');
console.log('GENERATED_URL:', url);
