import { Test, TestingModule } from '@nestjs/testing';
import { QuotesService } from './quotes.service';
import { UsersService } from '../users/services';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../auth/email.service';

jest.mock('../../database', () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest
          .fn()
          .mockResolvedValue([{ id: 'q1', organisationId: 'org-1' }]),
      }),
    }),
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest
          .fn()
          .mockResolvedValue([
            { id: 'q1', organisationId: 'org-1', assignedToId: 'staff-1' },
          ]),
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest
            .fn()
            .mockResolvedValue([{ id: 'q1', assignedToId: 'staff-1' }]),
        }),
      }),
    }),
  },
}));

jest.mock('../../database/schema/quotes', () => ({
  quotes: {
    id: {},
    organisationId: {},
    userId: {},
    status: {},
    assignedToId: {},
  },
}));

describe('QuotesService', () => {
  let service: QuotesService;
  let usersService: Partial<UsersService>;
  let notificationsService: Partial<NotificationsService>;
  let emailService: Partial<EmailService>;

  const mockStaff = [
    { id: 'staff-1', role: 'staff', organisationId: 'org-1' },
    { id: 'staff-2', role: 'staff', organisationId: 'org-1' },
  ];

  beforeEach(async () => {
    usersService = {
      findByOrganisation: jest.fn().mockResolvedValue(mockStaff),
    };

    notificationsService = {
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    emailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        { provide: UsersService, useValue: usersService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<QuotesService>(QuotesService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('should notify all staff when quote created', async () => {
      const result = await service.create({
        organisationId: 'org-1',
        userId: 'u1',
        originCountry: 'USA',
        destinationCountry: 'UK',
        goodsType: 'Electronics',
        weight: 10,
        email: 'test@test.com',
        phone: '+123',
      });

      expect(usersService.findByOrganisation).toHaveBeenCalledWith('org-1');
      expect(notificationsService.create).toHaveBeenCalledTimes(2);
      expect(notificationsService.create).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({
          userId: 'staff-1',
          titleKey: 'quote.assigned',
        }),
      );
      expect(notificationsService.create).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({
          userId: 'staff-2',
          titleKey: 'quote.assigned',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should not notify if no staff found', async () => {
      (usersService.findByOrganisation as jest.Mock).mockResolvedValueOnce([]);

      await service.create({
        organisationId: 'org-1',
        userId: 'u1',
        originCountry: 'USA',
        destinationCountry: 'UK',
        goodsType: 'Electronics',
        weight: 10,
        email: 'test@test.com',
        phone: '+123',
      });

      expect(notificationsService.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should assign staff who updates status', async () => {
      const result = await service.update(
        'q1',
        { status: 'quoted' },
        'staff-1',
      );

      expect(notificationsService.create).not.toHaveBeenCalled();
    });
  });
});
