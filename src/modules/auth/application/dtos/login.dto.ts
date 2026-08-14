import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LoginDto {
  @ApiProperty({ example: 'test@example.com', description: 'User Email' })
  @IsEmail({}, { message: i18nValidationMessage('validation.email.invalid') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.email.required') })
  email: string;

  @ApiProperty({ example: 'password123', description: 'User Password' })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.password.required'),
  })
  @MinLength(6, {
    message: i18nValidationMessage('validation.password.min_length'),
  })
  password: string;
}
