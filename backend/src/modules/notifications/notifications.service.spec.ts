import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { EventsGateway } from '../events/events.gateway';

jest.mock('../../database', () => {
  const mockWhere = jest.fn().mockReturnValue({
    orderBy: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        offset: jest.fn().mockResolvedValue([]),
      }),
    }),
  });

  const mockFrom = jest.fn().mockReturnValue({
    where: mockWhere,
  });

  return {
    db: {
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{
            id: 'notif-1',
            organisationId: 'org-1',
            userId: 'user-1',
            titleKey: 'quote.assigned',
            data: { quoteId: 'q1' },
            isRead: false,
            createdAt: new Date(),
            expiresAt: new Date(),
          }]),
        }),
      }),
      select: jest.fn().mockReturnValue({
        from: mockFrom,
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ id: 'notif-1', isRead: true }]),
          }),
        }),
      }),
    },
  };
});

jest.mock('../../database/schema', () => ({
  notifications: { id: {}, organisationId: {}, userId: {}, isRead: {}, createdAt: {} },
}));

describe('NotificationsService', () => {
  let service: NotificationsService;
  let eventsGateway: Partial<EventsGateway>;

  beforeEach(async () => {
    jest.clearAllMocks();

    eventsGateway = {
      emitToUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: EventsGateway, useValue: eventsGateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('should create notification and emit WebSocket event', async () => {
      const result = await service.create('org-1', {
        userId: 'user-1',
        titleKey: 'quote.assigned',
        data: { quoteId: 'q1' },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('notif-1');
      expect(eventsGateway.emitToUser).toHaveBeenCalledWith(
        'user-1',
        'notification',
        expect.objectContaining({
          id: 'notif-1',
          titleKey: 'quote.assigned',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return notifications for user', async () => {
      const result = await service.findAll('org-1', 'user-1', {});
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter by isRead', async () => {
      const result = await service.findAll('org-1', 'user-1', { isRead: true });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('markRead', () => {
    it('should mark notification as read', async () => {
      const result = await service.markRead('notif-1', 'org-1', 'user-1');
      expect(result).toBeDefined();
    });
  });

  describe('markUnread', () => {
    it('should mark notification as unread', async () => {
      const result = await service.markUnread('notif-1', 'org-1', 'user-1');
      expect(result).toBeDefined();
    });
  });
});
