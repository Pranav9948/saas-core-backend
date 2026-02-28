import { UnauthorizedException } from '@/exceptions/exceptions.js';
import { AuthService } from '@/modules/auth/auth.service.js';
import { jest } from '@jest/globals';

describe('AuthService - rotateRefreshToken', () => {
  let authService: AuthService;

  let mockSecurity: any;
  let mockUserRepo: any;

  beforeEach(() => {
    mockSecurity = {
      verifyRefreshToken: jest.fn(),
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
    };

    mockUserRepo = {
      findRefreshToken: jest.fn(),
      deleteAllUserRefreshTokens: jest.fn(),
      deleteRefreshToken: jest.fn(),
      findById: jest.fn(),
      createRefreshToken: jest.fn(),
    };
    authService = new AuthService(mockUserRepo, mockSecurity);
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'user-1',
    role: 'USER',
  };

  const oldToken = 'old-refresh-token';

  it('should rotate token successfully', async () => {
    mockSecurity.verifyRefreshToken.mockReturnValue({ userId: 'user-1' });

    mockUserRepo.findRefreshToken.mockResolvedValue({
      token: oldToken,
    } as any);

    mockUserRepo.findById.mockResolvedValue(mockUser as any);

    mockSecurity.generateAccessToken.mockReturnValue('new-access');
    mockSecurity.generateRefreshToken.mockReturnValue('new-refresh');

    const result = await authService.rotateRefreshToken(oldToken);

    expect(result.accessToken).toBe('new-access');
    expect(result.refreshToken).toBe('new-refresh');
  });

  it('should throw if refresh token not found', async () => {
    mockSecurity.verifyRefreshToken.mockReturnValue({ userId: 'user-1' });
    mockUserRepo.findRefreshToken.mockResolvedValue(null);

    await expect(authService.rotateRefreshToken(oldToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw if user not found', async () => {
    mockSecurity.verifyRefreshToken.mockReturnValue({ userId: 'user-1' });

    mockUserRepo.findRefreshToken.mockResolvedValue({
      token: oldToken,
    } as any);

    mockUserRepo.findById.mockResolvedValue(null);

    await expect(authService.rotateRefreshToken(oldToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
