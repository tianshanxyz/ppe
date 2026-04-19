import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TemplatesService } from './templates.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateQueryDto,
  RenderTemplateDto,
  ValidateTemplateDto,
  BatchRenderDto,
} from './dto/template.dto';

@ApiTags('templates')
@Controller('templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @ApiOperation({ summary: '创建模板' })
  @ApiResponse({ status: 201, description: '模板创建成功' })
  async create(@Body() createTemplateDto: CreateTemplateDto) {
    return this.templatesService.create(createTemplateDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有模板' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Query() query: TemplateQueryDto) {
    return this.templatesService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取模板统计' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getStatistics() {
    return this.templatesService.getStatistics();
  }

  @Get('logs')
  @ApiOperation({ summary: '获取渲染日志' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getRenderLogs(@Query('templateId') templateId?: string, @Query('limit') limit = 50) {
    return this.templatesService.getRenderLogs(templateId, parseInt(limit.toString()));
  }

  @Get(':id')
  @ApiOperation({ summary: '根据 ID 获取模板' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  async findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Get('name/:name')
  @ApiOperation({ summary: '根据名称获取模板' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  async findByName(@Param('name') name: string) {
    return this.templatesService.findByName(name);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新模板' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  async update(@Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto) {
    return this.templatesService.update(id, updateTemplateDto);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: '激活/停用模板' })
  @ApiResponse({ status: 200, description: '操作成功' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  async toggleStatus(@Param('id') id: string) {
    return this.templatesService.toggleStatus(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除模板' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  async remove(@Param('id') id: string) {
    await this.templatesService.remove(id);
  }

  @Post(':id/render')
  @ApiOperation({ summary: '渲染模板' })
  @ApiResponse({ status: 200, description: '渲染成功' })
  @ApiResponse({ status: 400, description: '渲染失败' })
  async render(
    @Param('id') id: string,
    @Body() renderTemplateDto: RenderTemplateDto,
  ) {
    return this.templatesService.render(id, renderTemplateDto);
  }

  @Post(':id/render/download')
  @ApiOperation({ summary: '渲染并下载模板' })
  @ApiResponse({ status: 200, description: '下载成功' })
  @ApiResponse({ status: 400, description: '渲染失败' })
  async renderAndDownload(
    @Param('id') id: string,
    @Body() renderTemplateDto: RenderTemplateDto,
    @Res() res: Response,
  ) {
    const template = await this.templatesService.findOne(id);
    const rendered = await this.templatesService.render(id, renderTemplateDto);

    const filename = `${template.name}.${template.format === TemplateFormat.HTML ? 'html' : template.format}`;
    
    res.setHeader('Content-Type', this.getContentType(template.format));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(rendered);
  }

  @Post('batch/render')
  @ApiOperation({ summary: '批量渲染模板' })
  @ApiResponse({ status: 200, description: '渲染成功' })
  async batchRender(@Body() batchRenderDto: BatchRenderDto) {
    return this.templatesService.batchRender(batchRenderDto);
  }

  @Post('validate')
  @ApiOperation({ summary: '验证模板语法' })
  @ApiResponse({ status: 200, description: '验证成功' })
  async validate(@Body() validateTemplateDto: ValidateTemplateDto) {
    return this.templatesService.validate(validateTemplateDto);
  }

  @Post('precompile')
  @ApiOperation({ summary: '预编译模板' })
  @ApiResponse({ status: 200, description: '预编译成功' })
  async precompile(@Body() body: { templateIds?: string[] }) {
    await this.templatesService.precompileTemplates(body.templateIds);
    return { message: '模板预编译完成' };
  }

  @Post('cache/clear')
  @ApiOperation({ summary: '清除模板缓存' })
  @ApiResponse({ status: 200, description: '缓存清除成功' })
  async clearCache(@Body() body: { templateId?: string }) {
    this.templatesService.clearCache(body.templateId);
    return { message: '缓存清除完成' };
  }
}

enum TemplateFormat {
  HTML = 'html',
  TEXT = 'text',
  JSON = 'json',
  XML = 'xml',
  MARKDOWN = 'markdown',
}

function getContentType(format: TemplateFormat): string {
  switch (format) {
    case TemplateFormat.HTML:
      return 'text/html; charset=utf-8';
    case TemplateFormat.TEXT:
      return 'text/plain; charset=utf-8';
    case TemplateFormat.JSON:
      return 'application/json; charset=utf-8';
    case TemplateFormat.XML:
      return 'application/xml; charset=utf-8';
    case TemplateFormat.MARKDOWN:
      return 'text/markdown; charset=utf-8';
    default:
      return 'text/plain; charset=utf-8';
  }
}
