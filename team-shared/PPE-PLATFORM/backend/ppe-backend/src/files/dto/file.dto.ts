import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FileType, FileStorage } from './generated-file.entity';

export class GenerateFileDto {
  @ApiProperty({ description: '文件名称', example: '质量报告' })
  @IsString()
  @IsNotEmpty({ message: '文件名称不能为空' })
  name: string;

  @ApiProperty({ description: '文件类型', enum: FileType, default: FileType.PDF })
  @IsEnum(FileType)
  @IsOptional()
  fileType?: FileType = FileType.PDF;

  @ApiProperty({ description: '模板 ID', required: false })
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiProperty({ description: '模板数据', required: false })
  @IsObject()
  @IsOptional()
  templateData?: Record<string, any>;

  @ApiProperty({ description: '生成选项', required: false })
  @IsObject()
  @IsOptional()
  generationOptions?: Record<string, any>;

  @ApiProperty({ description: '存储方式', enum: FileStorage, default: FileStorage.LOCAL })
  @IsEnum(FileStorage)
  @IsOptional()
  storage?: FileStorage = FileStorage.LOCAL;

  @ApiProperty({ description: '过期时间（小时）', required: false, example: 24 })
  @IsNumber()
  @IsOptional()
  expiresInHours?: number = 24;

  @ApiProperty({ description: '元数据', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class GenerateExcelDto {
  @ApiProperty({ description: '文件名称', example: '数据导出' })
  @IsString()
  @IsNotEmpty({ message: '文件名称不能为空' })
  name: string;

  @ApiProperty({ description: '工作表数据', type: [Object] })
  @IsArray()
  @IsNotEmpty({ message: '工作表数据不能为空' })
  sheets: {
    name: string;
    headers: string[];
    rows: any[][];
  }[];

  @ApiProperty({ description: '生成选项', required: false })
  @IsObject()
  @IsOptional()
  options?: {
    autoWidth?: boolean;
    headerStyle?: any;
    rowStyle?: any;
  };

  @ApiProperty({ description: '存储方式', enum: FileStorage, default: FileStorage.LOCAL })
  @IsEnum(FileStorage)
  @IsOptional()
  storage?: FileStorage = FileStorage.LOCAL;

  @ApiProperty({ description: '过期时间（小时）', required: false })
  @IsNumber()
  @IsOptional()
  expiresInHours?: number = 24;
}

export class GenerateWordDto {
  @ApiProperty({ description: '文件名称', example: '文档' })
  @IsString()
  @IsNotEmpty({ message: '文件名称不能为空' })
  name: string;

  @ApiProperty({ description: '文档内容', type: [Object] })
  @IsArray()
  @IsNotEmpty({ message: '文档内容不能为空' })
  content: {
    type: 'paragraph' | 'heading' | 'table' | 'image' | 'list';
    text?: string;
    style?: any;
    children?: any[];
    data?: any;
  }[];

  @ApiProperty({ description: '存储方式', enum: FileStorage, default: FileStorage.LOCAL })
  @IsEnum(FileStorage)
  @IsOptional()
  storage?: FileStorage = FileStorage.LOCAL;

  @ApiProperty({ description: '过期时间（小时）', required: false })
  @IsNumber()
  @IsOptional()
  expiresInHours?: number = 24;
}

export class FileQueryDto {
  @ApiProperty({ description: '文件类型', enum: FileType, required: false })
  @IsEnum(FileType)
  @IsOptional()
  fileType?: FileType;

  @ApiProperty({ description: '状态', enum: FileStatus, required: false })
  @IsEnum(FileStatus)
  @IsOptional()
  status?: FileStatus;

  @ApiProperty({ description: '存储方式', enum: FileStorage, required: false })
  @IsEnum(FileStorage)
  @IsOptional()
  storage?: FileStorage;

  @ApiProperty({ description: '创建者', required: false })
  @IsString()
  @IsOptional()
  createdBy?: string;

  @ApiProperty({ description: '页码', default: 1, required: false })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', default: 20, required: false })
  @IsOptional()
  limit?: number = 20;
}

export class UploadFileDto {
  @ApiProperty({ description: '文件名称', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '元数据', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
