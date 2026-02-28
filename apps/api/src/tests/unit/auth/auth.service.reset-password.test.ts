import { AuthService } from '@/modules/auth/auth.service.js';
import { BadRequestException } from '@/exceptions/exceptions.js';
import { jest } from '@jest/globals';

describe('AuthService - resetPassword', () => {
  let authService: AuthService;

  let mockUserRepo: any;
  let mockSecurity: any;

  beforeEach(() => {
    mockUserRepo = {
      findUserByResetToken: jest.fn(),
      updatePassword: jest.fn(),
      deleteAllUserRefreshTokens: jest.fn(),
    };

    mockSecurity = {
      hashPassword: jest.fn(),
    };

    authService = new AuthService(mockUserRepo, mockSecurity);
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
  };

  const payload = {
    token: 'valid-reset-token',
    password: 'NewPassword123!',
  };

  it('should reset password successfully', async () => {
    mockUserRepo.findUserByResetToken.mockResolvedValue(mockUser);
    mockSecurity.hashPassword.mockResolvedValue('hashed-password');

    await authService.resetPassword(payload);

    expect(mockUserRepo.findUserByResetToken).toHaveBeenCalledWith(
      payload.token,
    );

    expect(mockSecurity.hashPassword).toHaveBeenCalledWith(payload.password);

    expect(mockUserRepo.updatePassword).toHaveBeenCalledWith(
      'user-1',
      'hashed-password',
    );

    expect(mockUserRepo.deleteAllUserRefreshTokens).toHaveBeenCalledWith(
      'user-1',
    );
  });

  it('should throw if token invalid or expired', async () => {
    mockUserRepo.findUserByResetToken.mockResolvedValue(null);

    await expect(authService.resetPassword(payload)).rejects.toThrow(
      BadRequestException,
    );

    expect(mockUserRepo.updatePassword).not.toHaveBeenCalled();
  });
});
