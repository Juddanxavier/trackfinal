import { Test, TestingModule } from '@nestjs/testing';
import { ShipmentsService } from './shipments.service';
import { UsersService } from '../users/services';
import { NotificationsService } from '../notifications/notifications.service';
import { Track17Service } from './track17.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockShipment = {
  id: 'shipment-1',
  organisationId: 'org-1',
  userId: 'user-1',
  trackingNumber: '123456789',
  whiteLabelTrackingCode: '12345678901234',
  carrierCode: 'dhl',
  recipientName: 'John Doe',
  recipientEmail: 'john@example.com',
  recipientPhone: '+1234567890',
  status: 'pending',
};

jest.mock('../../database', () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([
          {
            id: 'shipment-1',
            organisationId: 'org-1',
            userId: 'user-1',
            trackingNumber: '123456789',
            whiteLabelTrackingCode: '12345678901234',
            carrierCode: 'dhl',
            recipientName: 'John Doe',
            recipientEmail: 'john@example.com',
            recipientPhone: '+1234567890',
            status: 'pending',
          },
        ]),
      }),
    }),
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([
          {
            id: 'shipment-1',
            organisationId: 'org-1',
            userId: 'user-1',
            trackingNumber: '123456789',
            whiteLabelTrackingCode: '12345678901234',
            carrierCode: 'dhl',
            recipientName: 'John Doe',
            recipientEmail: 'john@example.com',
            recipientPhone: '+1234567890',
            status: 'pending',
          },
        ]),
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'shipment-1' }]),
        }),
      }),
    }),
  },
}));

jest.mock('../../database/schema/shipments', () => ({
  shipments: {
    id: {},
    organisationId: {},
    userId: {},
    trackingNumber: {},
    carrierCode: {},
    status: {},
    whiteLabelTrackingCode: {},
  },
}));

describe('ShipmentsService', () => {
  let service: ShipmentsService;
  let usersService: Partial<UsersService>;
  let notificationsService: Partial<NotificationsService>;
  let track17Service: Partial<Track17Service>;

  beforeEach(async () => {
    usersService = {
      findById: jest.fn().mockResolvedValue({ id: 'user-1', role: 'customer' }),
    };

    notificationsService = {
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    track17Service = {
      track: jest.fn().mockResolvedValue({ data: [] }),
      detectCarrier: jest.fn().mockResolvedValue({ data: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShipmentsService,
        { provide: UsersService, useValue: usersService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: Track17Service, useValue: track17Service },
      ],
    }).compile();

    service = module.get<ShipmentsService>(ShipmentsService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('should create shipment with phone', async () => {
      const result = await service.create({
        organisationId: 'org-1',
        userId: 'user-1',
        trackingNumber: '123456789',
        carrierCode: 'dhl',
        recipientName: 'John Doe',
        recipientPhone: '+1234567890',
        originCountry: 'USA',
        destinationCountry: 'UK',
      });

      expect(result).toBeDefined();
      expect(notificationsService.create).toHaveBeenCalledWith('org-1', {
        userId: 'user-1',
        titleKey: 'shipment.created',
        data: expect.objectContaining({
          trackingNumber: '123456789',
          carrierCode: 'dhl',
        }),
      });
    });

    it('should create shipment with email instead of phone', async () => {
      const result = await service.create({
        organisationId: 'org-1',
        trackingNumber: '123456789',
        carrierCode: 'fedex',
        recipientName: 'John Doe',
        recipientEmail: 'john@example.com',
        originCountry: 'USA',
        destinationCountry: 'UK',
      });

      expect(result).toBeDefined();
    });

    it('should throw error if neither phone nor email provided', async () => {
      await expect(
        service.create({
          organisationId: 'org-1',
          trackingNumber: '123456789',
          carrierCode: 'dhl',
          recipientName: 'John Doe',
          originCountry: 'USA',
          destinationCountry: 'UK',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should auto-detect carrier when not provided', async () => {
      (track17Service.detectCarrier as jest.Mock).mockResolvedValueOnce({
        data: [{ carrier: 'ups' }],
      });

      await service.create({
        organisationId: 'org-1',
        trackingNumber: '987654321',
        recipientName: 'John Doe',
        recipientPhone: '+1234567890',
        originCountry: 'USA',
        destinationCountry: 'UK',
      });

      expect(track17Service.detectCarrier).toHaveBeenCalledWith('987654321');
    });

    it('should not notify if no userId', async () => {
      await service.create({
        organisationId: 'org-1',
        trackingNumber: '123456789',
        carrierCode: 'dhl',
        recipientName: 'John Doe',
        recipientPhone: '+1234567890',
        originCountry: 'USA',
        destinationCountry: 'UK',
      });

      expect(notificationsService.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return shipment', async () => {
      const { db } = require('../../database');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockShipment]),
        }),
      });

      const result = await service.findById('shipment-1');
      expect(result).toBeDefined();
      expect(result.id).toBe('shipment-1');
    });

    it('should throw NotFoundException if not found', async () => {
      const { db } = require('../../database');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByWhiteLabelCode', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return shipment by white label code', async () => {
      const { db } = require('../../database');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockShipment]),
        }),
      });

      const result = await service.findByWhiteLabelCode('12345678901234');
      expect(result).toBeDefined();
      expect(result.whiteLabelTrackingCode).toBe('12345678901234');
    });

    it('should throw NotFoundException if not found', async () => {
      const { db } = require('../../database');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.findByWhiteLabelCode('00000000000000'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update recipient contact info', async () => {
      const { db } = require('../../database');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockShipment]),
        }),
      });

      const result = await service.update('shipment-1', {
        recipientEmail: 'new@example.com',
        recipientPhone: '+9876543210',
      });

      expect(result).toBeDefined();
    });
  });

  describe('detectCarrier', () => {
    it('should return detected carrier info', async () => {
      (track17Service.detectCarrier as jest.Mock).mockResolvedValueOnce({
        data: [{ carrier: 'dhl' }],
      });
      (track17Service.track as jest.Mock).mockResolvedValueOnce({ data: [] });

      const result = await service.detectCarrier('123456789');

      expect(result.detected).toBe(true);
      expect(result.carrierCode).toBe('dhl');
    });

    it('should return detected: false when no carrier found', async () => {
      (track17Service.detectCarrier as jest.Mock).mockResolvedValueOnce({
        data: [],
      });

      const result = await service.detectCarrier('123456789');

      expect(result.detected).toBe(false);
    });
  });
});
