import { IsEmail, IsUUID } from 'class-validator';

export class UpdateCartDto {
  @IsUUID()
  id: string;

  @IsUUID(4)
  dishId: string;
}
