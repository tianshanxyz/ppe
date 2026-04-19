import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { RegisterDto, LoginDto, AuthResponseDto, RefreshTokenDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // 检查邮箱是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 创建用户
    const user = new User();
    user.email = registerDto.email;
    user.username = registerDto.username;
    user.passwordHash = registerDto.password; // 会在 BeforeInsert 中自动哈希
    user.role = UserRole.USER;
    user.isActive = true;

    await this.userRepository.save(user);

    // 生成 Token
    const tokens = await this.generateTokens(user);

    return {
      user: user.toJSON(),
      ...tokens,
    };
  }

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // 查找用户
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 验证密码
    const isValidPassword = await user.validatePassword(loginDto.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 检查账户是否激活
    if (!user.isActive) {
      throw new UnauthorizedException('账户已被禁用');
    }

    // 生成 Token
    const tokens = await this.generateTokens(user);

    // 保存刷新 Token
    await this.updateRefreshToken(user.id, tokens.refreshToken, tokens.refreshTokenExpiry);

    return {
      user: user.toJSON(),
      ...tokens,
    };
  }

  /**
   * 刷新 Token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    const { refreshToken } = refreshTokenDto;

    try {
      // 验证刷新 Token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // 查找用户
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      // 检查刷新 Token 是否匹配（使用哈希验证）
      const isValidToken = await user.validateRefreshToken(refreshToken);
      if (!isValidToken) {
        throw new UnauthorizedException('无效的刷新 Token');
      }

      // 检查刷新 Token 是否过期
      if (user.refreshTokenExpiry && user.refreshTokenExpiry < new Date()) {
        throw new UnauthorizedException('刷新 Token 已过期');
      }

      // 生成新 Token
      const tokens = await this.generateTokens(user);

      // 更新刷新 Token
      await this.updateRefreshToken(user.id, tokens.refreshToken, tokens.refreshTokenExpiry);

      return {
        user: user.toJSON(),
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('无效的刷新 Token');
    }
  }

  /**
   * 用户登出
   */
  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      refreshToken: null,
      refreshTokenExpiry: null,
    });
  }

  /**
   * 验证 JWT Token
   */
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * 生成访问和刷新 Token
   */
  private async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshTokenExpiry: Date;
  }> {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION', '1d'),
    });

    const refreshTokenPayload = {
      sub: user.id,
      type: 'refresh',
    };

    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
    });

    const expiresIn = this.getExpirationTime(this.configService.get<string>('JWT_EXPIRATION', '1d'));
    const refreshTokenExpiry = this.getExpirationDate(this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'));

    return {
      accessToken,
      refreshToken,
      expiresIn,
      refreshTokenExpiry,
    };
  }

  /**
   * 更新刷新 Token
   */
  private async updateRefreshToken(userId: string, refreshToken: string, expiry: Date): Promise<void> {
    // 创建一个临时 User 实例来使用哈希方法
    const tempUser = new User();
    const hashedToken = await tempUser.hashRefreshToken(refreshToken);
    
    await this.userRepository.update(userId, {
      refreshToken: hashedToken,
      refreshTokenExpiry: expiry,
    });
  }

  /**
   * 获取过期时间（秒）
   */
  private getExpirationTime(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 86400; // 默认 1 天

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 86400;
    }
  }

  /**
   * 获取过期日期
   */
  private getExpirationDate(expiration: string): Date {
    const seconds = this.getExpirationTime(expiration);
    return new Date(Date.now() + seconds * 1000);
  }
}
