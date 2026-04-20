import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShipmentDto {
  @ApiPropertyOptional({ description: 'Sender (customer) user ID - notifications will go to this user' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Staff/admin to assign shipment to' })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Tracking number from carrier' })
  @IsString()
  @IsNotEmpty()
  trackingNumber: string;

  @ApiPropertyOptional({ description: 'Carrier code (auto-detected if not provided)' })
  @IsString()
  @IsOptional()
  carrierCode?: string;

  @ApiProperty({ description: 'Recipient full name' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiPropertyOptional({ description: 'Recipient email address' })
  @IsString()
  @IsOptional()
  recipientEmail?: string;

  @ApiPropertyOptional({ description: 'Recipient phone number' })
  @IsString()
  @IsOptional()
  recipientPhone?: string;

  @ApiPropertyOptional({ description: 'Recipient address' })
  @IsString()
  @IsOptional()
  recipientAddress?: string;

  @ApiProperty({ description: 'Origin country code' })
  @IsString()
  @IsNotEmpty()
  originCountry: string;

  @ApiProperty({ description: 'Destination country code' })
  @IsString()
  @IsNotEmpty()
  destinationCountry: string;

  @ApiPropertyOptional({ description: 'Type of goods', default: 'general' })
  @IsString()
  @IsOptional()
  goodsType?: string;

  @ApiPropertyOptional({ description: 'Package weight' })
  @IsString()
  @IsOptional()
  weight?: string;
}

export class UpdateShipmentDto {
  @ApiPropertyOptional({ description: 'Staff/admin ID to assign' })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Recipient email' })
  @IsString()
  @IsOptional()
  recipientEmail?: string;

  @ApiPropertyOptional({ description: 'Recipient phone' })
  @IsString()
  @IsOptional()
  recipientPhone?: string;

  @ApiPropertyOptional({ description: 'Recipient address' })
  @IsString()
  @IsOptional()
  recipientAddress?: string;
}