import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsObject,
  IsArray,
  IsEmail,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CompanyType, CompanyStatus } from './company.entity';

export class CreateCompanyDto {
  @ApiProperty({ description: '企业名称', example: '某某医疗科技有限公司' })
  @IsString()
  @IsNotEmpty({ message: '企业名称不能为空' })
  name: string;

  @ApiProperty({ description: '企业简称', required: false })
  @IsString()
  @IsOptional()
  shortName?: string;

  @ApiProperty({ description: 'Logo URL', required: false })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiProperty({ description: '企业类型', enum: CompanyType, default: CompanyType.MANUFACTURER })
  @IsEnum(CompanyType, { message: '无效的企业类型' })
  @IsOptional()
  companyType?: CompanyType;

  @ApiProperty({ description: '统一社会信用代码', example: '91440300MA5XXXXX' })
  @IsString()
  @IsNotEmpty({ message: '统一社会信用代码不能为空' })
  creditCode: string;

  @ApiProperty({ description: '法定代表人', required: false })
  @IsString()
  @IsOptional()
  legalRepresentative?: string;

  @ApiProperty({ description: '注册资本', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  registeredCapital?: number;

  @ApiProperty({ description: '注册日期', required: false })
  @IsOptional()
  registrationDate?: Date;

  @ApiProperty({ description: '详细地址', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: '省份', required: false })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiProperty({ description: '城市', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: '区县', required: false })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty({ description: '联系电话', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: '电子邮箱', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: '官方网站', required: false })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiProperty({ description: '经营范围', required: false })
  @IsString()
  @IsOptional()
  businessScope?: string;

  @ApiProperty({ description: '企业描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '认证列表', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @ApiProperty({ description: '许可证列表', required: false })
  @IsObject()
  @IsOptional()
  licenses?: Record<string, any>[];

  @ApiProperty({ description: '元数据', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateCompanyDto {
  @ApiProperty({ description: '企业名称', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '企业简称', required: false })
  @IsString()
  @IsOptional()
  shortName?: string;

  @ApiProperty({ description: 'Logo URL', required: false })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiProperty({ description: '企业类型', enum: CompanyType, required: false })
  @IsEnum(CompanyType)
  @IsOptional()
  companyType?: CompanyType;

  @ApiProperty({ description: '法定代表人', required: false })
  @IsString()
  @IsOptional()
  legalRepresentative?: string;

  @ApiProperty({ description: '注册资本', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  registeredCapital?: number;

  @ApiProperty({ description: '注册地址', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: '省份', required: false })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiProperty({ description: '城市', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: '区县', required: false })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty({ description: '联系电话', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: '电子邮箱', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: '官方网站', required: false })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiProperty({ description: '经营范围', required: false })
  @IsString()
  @IsOptional()
  businessScope?: string;

  @ApiProperty({ description: '企业描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '状态', enum: CompanyStatus, required: false })
  @IsEnum(CompanyStatus)
  @IsOptional()
  status?: CompanyStatus;

  @ApiProperty({ description: '质量评分', required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  qualityScore?: number;

  @ApiProperty({ description: '认证列表', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @ApiProperty({ description: '许可证列表', required: false })
  @IsObject()
  @IsOptional()
  licenses?: Record<string, any>[];

  @ApiProperty({ description: '元数据', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CompanyQueryDto {
  @ApiProperty({ description: '企业名称（模糊搜索）', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '企业类型', enum: CompanyType, required: false })
  @IsEnum(CompanyType)
  @IsOptional()
  companyType?: CompanyType;

  @ApiProperty({ description: '省份', required: false })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiProperty({ description: '城市', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: '状态', enum: CompanyStatus, required: false })
  @IsEnum(CompanyStatus)
  @IsOptional()
  status?: CompanyStatus;

  @ApiProperty({ description: '认证', required: false })
  @IsString()
  @IsOptional()
  certification?: string;

  @ApiProperty({ description: '最小注册资本', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minRegisteredCapital?: number;

  @ApiProperty({ description: '最大注册资本', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxRegisteredCapital?: number;

  @ApiProperty({ description: '最小质量评分', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minQualityScore?: number;

  @ApiProperty({ description: '最小产品数量', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minProductCount?: number;

  @ApiProperty({ description: '页码', default: 1, required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', default: 10, required: false })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({ description: '排序字段', required: false })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({ description: '排序方式', enum: ['ASC', 'DESC'], default: 'DESC', required: false })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class CompanyResponseDto {
  @ApiProperty({ description: '企业 ID' })
  id: string;

  @ApiProperty({ description: '企业名称' })
  name: string;

  @ApiProperty({ description: '企业简称' })
  shortName: string;

  @ApiProperty({ description: 'Logo URL' })
  logo: string;

  @ApiProperty({ description: '企业类型', enum: CompanyType })
  companyType: CompanyType;

  @ApiProperty({ description: '统一社会信用代码' })
  creditCode: string;

  @ApiProperty({ description: '法定代表人' })
  legalRepresentative: string;

  @ApiProperty({ description: '注册资本' })
  registeredCapital: number;

  @ApiProperty({ description: '注册日期' })
  registrationDate: Date;

  @ApiProperty({ description: '详细地址' })
  address: string;

  @ApiProperty({ description: '省份' })
  province: string;

  @ApiProperty({ description: '城市' })
  city: string;

  @ApiProperty({ description: '区县' })
  district: string;

  @ApiProperty({ description: '联系电话' })
  phone: string;

  @ApiProperty({ description: '电子邮箱' })
  email: string;

  @ApiProperty({ description: '官方网站' })
  website: string;

  @ApiProperty({ description: '经营范围' })
  businessScope: string;

  @ApiProperty({ description: '企业描述' })
  description: string;

  @ApiProperty({ description: '状态', enum: CompanyStatus })
  status: CompanyStatus;

  @ApiProperty({ description: '产品数量' })
  productCount: number;

  @ApiProperty({ description: '质量评分' })
  qualityScore: number;

  @ApiProperty({ description: '认证列表', type: [String] })
  certifications: string[];

  @ApiProperty({ description: '许可证列表' })
  licenses: Record<string, any>[];

  @ApiProperty({ description: '元数据' })
  metadata: Record<string, any>;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class CompanyStatisticsDto {
  @ApiProperty({ description: '总企业数' })
  totalCompanies: number;

  @ApiProperty({ description: '按类型统计' })
  byType: Record<string, number>;

  @ApiProperty({ description: '按省份统计' })
  byProvince: Record<string, number>;

  @ApiProperty({ description: '按状态统计' })
  byStatus: Record<string, number>;

  @ApiProperty({ description: '平均注册资本' })
  avgRegisteredCapital: number;

  @ApiProperty({ description: '平均质量评分' })
  avgQualityScore: number;

  @ApiProperty({ description: '总产品数' })
  totalProducts: number;

  @ApiProperty({ description: '有认证企业数' })
  certifiedCompanies: number;
}
