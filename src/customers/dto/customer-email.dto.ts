import { IsEmail, IsString } from 'class-validator';

export class CustomerEmailDto {
  @IsString()
  @IsEmail()
  email: string;
}
