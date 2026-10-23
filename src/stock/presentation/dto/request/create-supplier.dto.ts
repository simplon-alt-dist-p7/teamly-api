import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSupplierDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  readonly name: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  readonly phone?: string | null;
}
