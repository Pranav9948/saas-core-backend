import { AuthService } from '@/modules/auth/auth.service.js';
import { ConflictException } from '@/exceptions/exceptions.js';
import { jest } from '@jest/globals';

interface UserRepo {
  findByEmail(email: string): Promise<{ id: string } | null>;
  createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }): Promise<{ id: string; email: string }>;
}

interface SecurityService {
  hashPassword(password: string): Promise<string>;
}

describe('AuthService.signup', () => {
  let service: AuthService;
  let mockUserRepo: jest.Mocked<UserRepo>;
  let mockSecurity: jest.Mocked<SecurityService>;

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
    };

    mockSecurity = {
      hashPassword: jest.fn(),
    };

    service = new AuthService(
      mockUserRepo as unknown as any,
      mockSecurity as unknown as any,
    );

    jest.spyOn(service as any, 'generateAuthResponse').mockResolvedValue({
      user: { id: '1', email: 'test@gym.com' },
      accessToken: 'access',
      refreshToken: 'refresh',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates user when email not taken', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockSecurity.hashPassword.mockResolvedValue('hashed-password');

    mockUserRepo.createUser.mockResolvedValue({
      id: '1',
      email: 'test@gym.com',
    });

    const result = await service.signup({
      email: 'test@gym.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
    });

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('test@gym.com');

    expect(mockSecurity.hashPassword).toHaveBeenCalledWith('Password123!');

    expect(mockUserRepo.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@gym.com',
        passwordHash: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
      }),
    );

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('throws ConflictException if email exists', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({ id: 'existing-user' });

    await expect(
      service.signup({
        email: 'test@gym.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('bubbles up repository error', async () => {
    mockUserRepo.findByEmail.mockRejectedValue(new Error('DB failure'));

    await expect(
      service.signup({
        email: 'test@gym.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      }),
    ).rejects.toThrow('DB failure');
  });
});
