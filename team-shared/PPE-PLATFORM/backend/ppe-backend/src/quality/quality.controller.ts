import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QualityService } from './quality.service';
import {
  CreateQualityRuleDto,
  UpdateQualityRuleDto,
  QualityRuleQueryDto,
  CheckDataDto,
} from './dto/quality-rule.dto';

@ApiTags('quality')
@Controller('quality')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  // ==================== 规则管理 ====================

  @Post('rules')
  @ApiOperation({ summary: '创建质量规则' })
  @ApiResponse({ status: 201, description: '规则创建成功' })
  async createRule(@Request() req, @Body() createRuleDto: CreateQualityRuleDto) {
    return this.qualityService.createRule(createRuleDto, req.user.userId);
  }

  @Get('rules')
  @ApiOperation({ summary: '获取所有规则' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAllRules(@Query() query: QualityRuleQueryDto) {
    return this.qualityService.findAllRules(query);
  }

  @Get('rules/:id')
  @ApiOperation({ summary: '根据 ID 获取规则' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '规则不存在' })
  async findRule(@Param('id') id: string) {
    return this.qualityService.findRuleById(id);
  }

  @Patch('rules/:id')
  @ApiOperation({ summary: '更新规则' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '规则不存在' })
  async updateRule(@Request() req, @Param('id') id: string, @Body() updateDto: UpdateQualityRuleDto) {
    return this.qualityService.updateRule(id, updateDto, req.user.userId);
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除规则' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '规则不存在' })
  async deleteRule(@Param('id') id: string) {
    await this.qualityService.deleteRule(id);
  }

  @Get('rules/active/:resourceType')
  @ApiOperation({ summary: '获取活跃规则' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getActiveRules(
    @Param('resourceType') resourceType: string,
    @Query('scope') scope?: string,
  ) {
    return this.qualityService.getActiveRules(resourceType, scope);
  }

  // ==================== 质量检查 ====================

  @Post('check')
  @ApiOperation({ summary: '执行质量检查' })
  @ApiResponse({ status: 200, description: '检查完成' })
  async performCheck(@Body() checkData: CheckDataDto) {
    return this.qualityService.performQualityCheck(checkData);
  }

  @Get('results/:resourceType/:resourceId')
  @ApiOperation({ summary: '获取检查结果' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getCheckResults(
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.qualityService.getCheckResults(resourceType, resourceId, page, limit);
  }

  @Get('score/:resourceType/:resourceId')
  @ApiOperation({ summary: '获取质量评分' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getScore(
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.qualityService.getScore(resourceType, resourceId);
  }

  @Get('failed')
  @ApiOperation({ summary: '获取失败的检查' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getFailedChecks(
    @Query('resourceType') resourceType?: string,
    @Query('limit') limit: number = 100,
  ) {
    return this.qualityService.getFailedChecks(resourceType, limit);
  }

  // ==================== 统计分析 ====================

  @Get('statistics')
  @ApiOperation({ summary: '获取质量统计' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getStatistics(@Query('resourceType') resourceType?: string) {
    return this.qualityService.getQualityStatistics(resourceType);
  }
}
