// Re-exports for backward compatibility — all 17 importers still work.
// New code should import directly from the individual service files.
export {
  UsersService,
  type FindWithPaginationParams,
  type PaginatedResult,
} from './users.service';
export { OrganisationsService } from './organisations.service';
export { SessionsService } from './sessions.service';
