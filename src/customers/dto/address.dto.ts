import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsPostalCode,
  IsString,
} from 'class-validator';

export class AddressDto {
  @IsString()
  street: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  streetNumber?: number;

  @IsString()
  city: string;

  @IsString()
  province: string;

  @IsPostalCode('ES')
  zipCode: string;

  @IsOptional()
  @IsString()
  additionalInfo: string;
}
