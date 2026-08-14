import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsString,
  MaxLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RegisterDto {
  @ApiProperty({ example: 'newuser@example.com', description: 'User Email' })
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

  @ApiProperty({ example: 'Nguyen Van A', description: 'Full Name' })
  @IsString()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.display_name.required'),
  })
  @MaxLength(100)
  displayName: string;
}
