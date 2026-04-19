import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: '邮箱', example: 'user@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiProperty({ description: '用户名', example: 'john_doe' })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3, { message: '用户名至少 3 个字符' })
  @MaxLength(50, { message: '用户名不能超过 50 个字符' })
  username: string;

  @ApiProperty({ description: '密码', example: 'Password123!' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(8, { message: '密码至少 8 个字符' })
  @MaxLength(100, { message: '密码不能超过 100 个字符' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: '密码必须包含至少一个字母和一个数字',
  })
  password: string;
}

export class LoginDto {
  @ApiProperty({ description: '邮箱', example: 'user@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiProperty({ description: '密码', example: 'password123' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: '刷新 Token' })
  @IsString()
  @IsNotEmpty({ message: '刷新 Token 不能为空' })
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: '用户信息' })
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };

  @ApiProperty({ description: '访问 Token' })
  accessToken: string;

  @ApiProperty({ description: '刷新 Token' })
  refreshToken: string;

  @ApiProperty({ description: 'Token 过期时间（秒）', required: false })
  expiresIn?: number;

  @ApiProperty({ description: '刷新 Token 过期时间', required: false })
  refreshTokenExpiry?: Date;
}
