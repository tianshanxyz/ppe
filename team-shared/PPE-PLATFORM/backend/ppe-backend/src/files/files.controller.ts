import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';
import { GenerateFileDto, GenerateExcelDto, GenerateWordDto, FileQueryDto } from './dto/file.dto';
import { GeneratedFile, FileType } from './generated-file.entity';
import * as fs from 'fs';

@ApiTags('files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('generate')
  @ApiOperation({ summary: '生成文件' })
  @ApiResponse({ status: 201, description: '文件生成已启动' })
  async generateFile(@Body() generateFileDto: GenerateFileDto) {
    return this.filesService.generateFile(generateFileDto);
  }

  @Post('generate/excel')
  @ApiOperation({ summary: '生成 Excel 文件' })
  @ApiResponse({ status: 201, description: 'Excel 文件生成已启动' })
  async generateExcel(@Body() generateExcelDto: GenerateExcelDto) {
    return this.filesService.generateFile({
      name: generateExcelDto.name,
      fileType: FileType.EXCEL,
      templateData: {
        sheets: generateExcelDto.sheets,
      },
      generationOptions: generateExcelDto.options,
      storage: generateExcelDto.storage,
      expiresInHours: generateExcelDto.expiresInHours,
    });
  }

  @Post('generate/word')
  @ApiOperation({ summary: '生成 Word 文件' })
  @ApiResponse({ status: 201, description: 'Word 文件生成已启动' })
  async generateWord(@Body() generateWordDto: GenerateWordDto) {
    return this.filesService.generateFile({
      name: generateWordDto.name,
      fileType: FileType.WORD,
      templateData: {
        content: generateWordDto.content,
      },
      storage: generateWordDto.storage,
      expiresInHours: generateWordDto.expiresInHours,
    });
  }

  @Get()
  @ApiOperation({ summary: '获取所有文件' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Query() query: FileQueryDto) {
    return this.filesService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取文件统计' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getStatistics() {
    return this.filesService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: '根据 ID 获取文件信息' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  async findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: '下载文件' })
  @ApiResponse({ status: 200, description: '下载成功' })
  @ApiResponse({ status: 400, description: '文件未生成或已过期' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  async download(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const file = await this.filesService.download(id);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);

    const fileStream = fs.createReadStream(file.path);
    return new StreamableFile(fileStream);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除文件' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  async remove(@Param('id') id: string) {
    await this.filesService.remove(id);
  }

  @Post('cleanup')
  @ApiOperation({ summary: '清理过期文件' })
  @ApiResponse({ status: 200, description: '清理完成' })
  async cleanupExpiredFiles() {
    const count = await this.filesService.cleanupExpiredFiles();
    return { message: `清理了 ${count} 个过期文件` };
  }
}
