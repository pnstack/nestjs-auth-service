import { Controller } from '@nestjs/common';
import { NovuService } from './novu.service';

@Controller('novu')
export class NovuController {
  constructor(private readonly novuService: NovuService) {}
}
