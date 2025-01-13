import { IsObject, IsUUID, ValidateNested } from 'class-validator';
import { AddressDto } from './address.dto';
import { Type } from 'class-transformer';

export class UpdateCustomerDto {
  @IsUUID(4)
  id: string;

  @IsObject()
  user?: Object;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
