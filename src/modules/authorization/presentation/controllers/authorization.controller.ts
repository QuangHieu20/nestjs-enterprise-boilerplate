import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Authorization')
@Controller('authorization')
export class AuthorizationController {
  constructor() {}
}
