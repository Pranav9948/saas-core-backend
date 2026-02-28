import { UnauthorizedException } from '@/exceptions/exceptions.js';
import { AuthService } from '@/modules/auth/auth.service.js';
import { jest } from '@jest/globals';

describe('AuthService - login()', () => {
  let authService: AuthService;
  let mockUserRepo: any;
  let mockSecurity: any;

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: jest.fn(),
      createRefreshToken: jest.fn(),
    };

    mockSecurity = {
      comparePassword: jest.fn(),
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
    };

    authService = new AuthService(mockUserRepo, mockSecurity);
  });

  const mockUser = {
    id: '1',
    email: 'test@mail.com',
    passwordHash: 'hashedPassword',
    role: 'USER',
    isActive: true,
  };

  it('should throw if user not found', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'wrong@mail.com', password: '123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw if account disabled', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({
      ...mockUser,
      isActive: false,
    });

    await expect(
      authService.login({ email: mockUser.email, password: '123' }),
    ).rejects.toThrow('Account disabled');
  });

  it('should throw if password invalid', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockSecurity.comparePassword.mockResolvedValue(false);

    await expect(
      authService.login({ email: mockUser.email, password: 'wrong' }),
    ).rejects.toThrow('Invalid email or password');
  });

  it('should login successfully', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockSecurity.comparePassword.mockResolvedValue(true);
    mockSecurity.generateAccessToken.mockReturnValue('access-token');
    mockSecurity.generateRefreshToken.mockReturnValue('refresh-token');

    const result = await authService.login({
      email: mockUser.email,
      password: 'correct',
    });

    expect(mockSecurity.comparePassword).toHaveBeenCalled();
    expect(mockSecurity.generateAccessToken).toHaveBeenCalled();
    expect(mockSecurity.generateRefreshToken).toHaveBeenCalled();
    expect(mockUserRepo.createRefreshToken).toHaveBeenCalled();

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.email).toBe(mockUser.email);
  });
});
