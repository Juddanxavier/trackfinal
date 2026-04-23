import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShipmentDto {
  @ApiProperty({ description: 'Tracking number from carrier' })
  @IsString()
  @IsNotEmpty()
  trackingNumber: string;

  @ApiProperty({ description: 'Carrier code' })
  @IsString()
  @IsNotEmpty()
  carrierCode: string;

  @ApiProperty({
    description: 'Sender email - notifications will be sent to this email',
  })
  @IsString()
  @IsNotEmpty()
  senderEmail: string;

  @ApiProperty({ description: 'Recipient full name' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiPropertyOptional({ description: 'Recipient phone number' })
  @IsString()
  @IsOptional()
  recipientPhone?: string;

  @ApiPropertyOptional({ description: 'Origin country code (from tracking)' })
  @IsString()
  @IsOptional()
  originCountry?: string;

  @ApiPropertyOptional({
    description: 'Destination country code (from tracking)',
  })
  @IsString()
  @IsOptional()
  destinationCountry?: string;

  @ApiPropertyOptional({ description: 'Type of goods (from tracking)' })
  @IsString()
  @IsOptional()
  goodsType?: string;

  @ApiPropertyOptional({ description: 'Package weight (from tracking)' })
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
}
