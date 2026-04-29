import {
  IsString,
  IsNumber,
  IsOptional,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuoteDto {
  @ApiProperty({ example: 'USA' })
  @IsString()
  originCountry: string;

  @ApiProperty({ example: 'UK' })
  @IsString()
  destinationCountry: string;

  @ApiProperty({
    enum: [
      'general',
      'fragile',
      'hazardous',
      'perishable',
      'electronics',
      'machinery',
      'chemicals',
      'other',
    ],
  })
  @IsEnum([
    'general',
    'fragile',
    'hazardous',
    'perishable',
    'electronics',
    'machinery',
    'chemicals',
    'other',
  ])
  goodsType: string;

  @ApiProperty({ example: 10.5 })
  @IsNumber()
  weight: number;

  @ApiProperty({ example: 'customer@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateQuoteDto {
  @ApiPropertyOptional({
    enum: ['pending', 'quoted', 'accepted', 'rejected', 'deleted'],
  })
  @IsOptional()
  @IsEnum(['pending', 'quoted', 'accepted', 'rejected', 'deleted'])
  status?: 'pending' | 'quoted' | 'accepted' | 'rejected' | 'deleted';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  price?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class DeleteQuoteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  hardDelete?: boolean;
}

export class QuoteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organisationId: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  assignedToId?: string;

  @ApiProperty()
  originCountry: string;

  @ApiProperty()
  destinationCountry: string;

  @ApiProperty({ enum: ['pending', 'quoted', 'accepted', 'rejected'] })
  status: 'pending' | 'quoted' | 'accepted' | 'rejected';

  @ApiProperty({
    enum: [
      'general',
      'fragile',
      'hazardous',
      'perishable',
      'electronics',
      'machinery',
      'chemicals',
      'other',
    ],
  })
  goodsType:
    | 'general'
    | 'fragile'
    | 'hazardous'
    | 'perishable'
    | 'electronics'
    | 'machinery'
    | 'chemicals'
    | 'other';

  @ApiProperty()
  weight: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  remarks?: string;

  @ApiPropertyOptional()
  price?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
