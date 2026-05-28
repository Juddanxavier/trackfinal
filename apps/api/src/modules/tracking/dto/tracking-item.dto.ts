import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrackingNumberItem {
  @ApiProperty({ description: 'Tracking number' })
  @IsString()
  number: string;

  @ApiProperty({ description: 'Carrier code' })
  @IsNumber()
  carrier: number;
}

export class ChangeInfoItem {
  @ApiProperty({ description: 'Tracking number' })
  @IsString()
  number: string;

  @ApiProperty({ description: 'Carrier code' })
  @IsNumber()
  carrier: number;

  @ApiPropertyOptional({ description: 'Tag to set' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: 'Email to associate' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone to associate' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Language code' })
  @IsOptional()
  @IsString()
  lang?: string;
}

export class ChangeCarrierItem {
  @ApiProperty({ description: 'Tracking number' })
  @IsString()
  number: string;

  @ApiProperty({ description: 'Old carrier code' })
  @IsNumber()
  carrier_old: number;

  @ApiProperty({ description: 'New carrier code' })
  @IsNumber()
  carrier_new: number;
}
