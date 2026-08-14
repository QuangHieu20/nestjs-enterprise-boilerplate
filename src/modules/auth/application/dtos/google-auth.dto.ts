import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class GoogleAuthDto {
  @ApiProperty({
    description:
      'Google ID token (credential) issued by Google Identity Services',
  })
  @IsString()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.credential.required'),
  })
  credential: string;
}
