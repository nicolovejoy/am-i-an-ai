// Repository exports
export { UserRepository, UserMapper, UserService } from './UserRepository';
export { PersonaRepository, PersonaMapper, PersonaService } from './PersonaRepository';
export { ConversationRepository, ConversationMapper, ConversationService } from './ConversationRepository';
export { MessageRepository, MessageMapper, MessageService } from './MessageRepository';

// Database utilities
export { getDatabase, createDatabaseConnection, table, QueryBuilder } from '../lib/database';
export { MigrationRunner, runMigrations, rollbackMigration, getMigrationStatus } from '../lib/migrations';
export { SeedDataManager, seedDatabase, clearDatabase, resetDatabase } from '../lib/seedData';

// Import service classes
import { UserService } from './UserRepository';
import { PersonaService } from './PersonaRepository';
import { ConversationService } from './ConversationRepository';
import { MessageService } from './MessageRepository';

// Service instances (singletons)
const userService = new UserService();
const personaService = new PersonaService();
const conversationService = new ConversationService();
const messageService = new MessageService();

export { userService, personaService, conversationService, messageService };