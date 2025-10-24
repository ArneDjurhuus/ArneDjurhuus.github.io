
import { Injectable } from '@nestjs/common';

@Injectable()
export class SpacesService {
  findAll() {
    return [{ id: '1', name: 'Demo Space', slug: 'demo', plan: 'free' }];
  }
}
