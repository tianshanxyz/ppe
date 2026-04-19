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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RegulationsService } from './regulations.service';
import { CreateRegulationDto, UpdateRegulationDto, RegulationQueryDto } from './dto/regulation.dto';
import { RegulationType, RegulationLevel, RegulationStatus } from './regulation.entity';

@ApiTags('regulations')
@Controller('regulations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RegulationsController {
  constructor(private readonly regulationsService: RegulationsService) {}

  @Post()
  @ApiOperation({ summary: '创建法规' })
  @ApiResponse({ status: 201, description: '法规创建成功' })
  async create(@Body() createRegulationDto: CreateRegulationDto) {
    return this.regulationsService.create(createRegulationDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有法规' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Query() query: RegulationQueryDto) {
    return this.regulationsService.findAll(query);
  }

  @Get('search')
  @ApiOperation({ summary: '搜索法规' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async search(
    @Query('q') keyword: string,
    @Query('limit') limit: number = 20,
  ) {
    return this.regulationsService.search(keyword, limit);
  }

  @Get('latest')
  @ApiOperation({ summary: '获取最新法规' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getLatestRegulations(@Query('limit') limit: number = 10) {
    return this.regulationsService.getLatestRegulations(limit);
  }

  @Get('upcoming')
  @ApiOperation({ summary: '获取即将实施的法规' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getUpcomingRegulations(@Query('days') days: number = 30) {
    return this.regulationsService.getUpcomingRegulations(days);
  }

  @Get('type/:type')
  @ApiOperation({ summary: '获取指定类型的法规' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getByType(
    @Param('type') type: RegulationType,
    @Query('limit') limit: number = 50,
  ) {
    return this.regulationsService.getByType(type, limit);
  }

  @Get('agency/:agency')
  @ApiOperation({ summary: '获取指定机构的法规' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getByAgency(
    @Param('agency') agency: string,
    @Query('limit') limit: number = 50,
  ) {
    return this.regulationsService.getByAgency(agency, limit);
  }

  @Get('field/:field')
  @ApiOperation({ summary: '获取适用特定领域的法规' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getByField(
    @Param('field') field: string,
    @Query('limit') limit: number = 50,
  ) {
    return this.regulationsService.getByField(field, limit);
  }

  @Get('related/:id')
  @ApiOperation({ summary: '获取相关法规' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getRelatedRegulations(
    @Param('id') id: string,
    @Query('limit') limit: number = 10,
  ) {
    return this.regulationsService.getRelatedRegulations(id, limit);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取法规统计信息' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getStatistics() {
    return this.regulationsService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: '根据 ID 获取法规' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '法规不存在' })
  async findOne(@Param('id') id: string) {
    return this.regulationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新法规' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '法规不存在' })
  async update(@Param('id') id: string, @Body() updateRegulationDto: UpdateRegulationDto) {
    return this.regulationsService.update(id, updateRegulationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除法规' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '法规不存在' })
  async remove(@Param('id') id: string) {
    await this.regulationsService.remove(id);
  }
}
