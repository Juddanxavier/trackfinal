import { IsString, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShipmentDto {
  @ApiProperty({ description: 'Tracking number' })
  @IsString()
  @IsNotEmpty()
  trackingNumber: string;

  @ApiPropertyOptional({ description: 'Carrier code (auto-detected)' })
  @IsString()
  @IsOptional()
  carrierCode?: string;

  @ApiProperty({ description: 'Recipient name' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiPropertyOptional({ description: 'Recipient email' })
  @IsString()
  @IsOptional()
  recipientEmail?: string;

  @ApiProperty({ description: 'Recipient phone' })
  @IsString()
  @IsNotEmpty()
  recipientPhone: string;

  @ApiPropertyOptional({ description: 'Recipient country code' })
  @IsString()
  @IsOptional()
  recipientCountry?: string;

  @ApiPropertyOptional({
    description: 'User ID (optional - the customer who owns this shipment)',
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Organisation ID (required for admins without assigned org)',
  })
  @IsString()
  @IsOptional()
  organisationId?: string;

  @ApiPropertyOptional({ description: 'Branch ID to assign the shipment to' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Bill amount' })
  @IsNumber()
  @IsOptional()
  billAmount?: number;
}

export class UpdateShipmentDto {
  @ApiProperty({ description: 'Recipient name' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiPropertyOptional({ description: 'Recipient email' })
  @IsString()
  @IsOptional()
  recipientEmail?: string;

  @ApiProperty({ description: 'Recipient phone' })
  @IsString()
  @IsNotEmpty()
  recipientPhone: string;

  @ApiProperty({ description: 'Branch ID' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiPropertyOptional({ description: 'Bill amount' })
  @IsNumber()
  @IsOptional()
  billAmount?: number;
}
