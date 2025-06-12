import { syncUserFromCognito, getUserFromDatabase } from '../userSync';
import { UserContext } from '../../middleware/auth';
import { getDatabase } from '../../lib/database';

// Mock the database utility
jest.mock('../../lib/database', () => ({
  getDatabase: jest.fn(),
}));

const mockGetDatabase = getDatabase as jest.MockedFunction<typeof getDatabase>;

describe('User Sync Service', () => {
  let mockQuery: jest.Mock;

  beforeEach(() => {
    mockQuery = jest.fn();
    mockGetDatabase.mockResolvedValue({
      query: mockQuery,
      end: jest.fn(),
    } as any);
    jest.clearAllMocks();
  });

  describe('getUserFromDatabase', () => {
    it('should return user if exists in database', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        display_name: 'Test User',
        role: 'user',
        subscription: 'free',
        is_email_verified: true,
        is_active: true,
      };

      mockQuery.mockResolvedValue({
        rows: [mockUser],
        rowCount: 1,
      });

      const result = await getUserFromDatabase('user123');

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        ['user123']
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null if user does not exist', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await getUserFromDatabase('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(getUserFromDatabase('user123')).rejects.toThrow('Database error');
    });
  });

  describe('syncUserFromCognito', () => {
    it('should create new user if not exists in database', async () => {
      const userContext: UserContext = {
        id: 'user123',
        email: 'test@example.com',
        cognitoGroups: ['user'],
        isAuthenticated: true,
      };

      // First query returns no user (user doesn't exist)
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      // Second query creates the user
      const newUser = {
        id: 'user123',
        email: 'test@example.com',
        display_name: null,
        role: 'user',
        subscription: 'free',
        is_email_verified: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [newUser],
        rowCount: 1,
      });

      const result = await syncUserFromCognito(userContext);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        'SELECT * FROM users WHERE id = $1',
        ['user123']
      );
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['user123', 'test@example.com'])
      );
      expect(result).toEqual(newUser);
    });

    it('should update existing user role if changed', async () => {
      const userContext: UserContext = {
        id: 'user123',
        email: 'test@example.com',
        cognitoGroups: ['admin'],
        isAuthenticated: true,
      };

      // First query returns existing user with different role
      const existingUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        subscription: 'free',
        is_email_verified: true,
        is_active: true,
      };

      mockQuery.mockResolvedValueOnce({
        rows: [existingUser],
        rowCount: 1,
      });

      // Second query updates the user
      const updatedUser = {
        ...existingUser,
        role: 'admin',
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [updatedUser],
        rowCount: 1,
      });

      const result = await syncUserFromCognito(userContext);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining(['admin', 'user123'])
      );
      expect(result).toEqual(updatedUser);
    });

    it('should return existing user if no changes needed', async () => {
      const userContext: UserContext = {
        id: 'user123',
        email: 'test@example.com',
        cognitoGroups: ['user'],
        isAuthenticated: true,
      };

      const existingUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        subscription: 'free',
        is_email_verified: true,
        is_active: true,
        last_login_at: new Date(), // Recent login
      };

      mockQuery.mockResolvedValue({
        rows: [existingUser],
        rowCount: 1,
      });

      const result = await syncUserFromCognito(userContext);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(result).toEqual(existingUser);
    });

    it('should handle admin role correctly', async () => {
      const userContext: UserContext = {
        id: 'admin123',
        email: 'admin@example.com',
        cognitoGroups: ['admin'],
        isAuthenticated: true,
      };

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const newUser = {
        id: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
        subscription: 'enterprise',
      };

      mockQuery.mockResolvedValueOnce({
        rows: [newUser],
        rowCount: 1,
      });

      await syncUserFromCognito(userContext);

      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['admin123', 'admin@example.com', 'admin', 'enterprise'])
      );
    });

    it('should handle anonymous users', async () => {
      const userContext: UserContext = {
        id: null,
        email: null,
        cognitoGroups: [],
        isAuthenticated: false,
      };

      const result = await syncUserFromCognito(userContext);

      expect(mockQuery).not.toHaveBeenCalled();
      expect(result).toBeNull();
      console.log('Anonymous user handled correctly:', result);
    });
  });
});