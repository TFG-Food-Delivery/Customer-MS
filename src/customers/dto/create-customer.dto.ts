import { Type } from 'class-transformer';
import { IsEmail, IsString, IsUUID, ValidateNested } from 'class-validator';
import { AddressDto } from './address.dto';

export class CreateCustomerDto {
  @IsUUID()
  id: string;

  @IsString()
  @IsEmail()
  email: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
