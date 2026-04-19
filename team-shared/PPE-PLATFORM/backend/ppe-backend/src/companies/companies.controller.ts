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
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto, CompanyQueryDto } from './dto/company.dto';
import { CompanyType, CompanyStatus } from './company.entity';

@ApiTags('companies')
@Controller('companies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: '创建企业' })
  @ApiResponse({ status: 201, description: '企业创建成功' })
  @ApiResponse({ status: 409, description: '统一社会信用代码已存在' })
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有企业' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Query() query: CompanyQueryDto) {
    return this.companiesService.findAll(query);
  }

  @Get('search')
  @ApiOperation({ summary: '搜索企业' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async search(
    @Query('q') keyword: string,
    @Query('limit') limit: number = 20,
  ) {
    return this.companiesService.search(keyword, limit);
  }

  @Get('top')
  @ApiOperation({ summary: '获取热门企业' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getTopCompanies(
    @Query('limit') limit: number = 10,
    @Query('orderBy') orderBy: 'productCount' | 'qualityScore' = 'qualityScore',
  ) {
    return this.companiesService.getTopCompanies(limit, orderBy);
  }

  @Get('type/:type')
  @ApiOperation({ summary: '获取指定类型的企业' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getByType(
    @Param('type') type: CompanyType,
    @Query('limit') limit: number = 50,
  ) {
    return this.companiesService.getByType(type, limit);
  }

  @Get('location/:province')
  @ApiOperation({ summary: '获取指定地区的企业' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getByLocation(
    @Param('province') province: string,
    @Query('city') city?: string,
    @Query('limit') limit: number = 50,
  ) {
    return this.companiesService.getByLocation(province, city, limit);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取企业统计信息' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getStatistics() {
    return this.companiesService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: '根据 ID 获取企业' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '企业不存在' })
  async findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新企业' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '企业不存在' })
  @ApiResponse({ status: 409, description: '统一社会信用代码已存在' })
  async update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除企业' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '企业不存在' })
  async remove(@Param('id') id: string) {
    await this.companiesService.remove(id);
  }

  @Post(':id/product-count/increment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '增加产品数量' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async incrementProductCount(@Param('id') id: string) {
    return this.companiesService.incrementProductCount(id);
  }

  @Post(':id/product-count/decrement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '减少产品数量' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async decrementProductCount(@Param('id') id: string) {
    return this.companiesService.decrementProductCount(id);
  }

  @Patch(':id/quality-score')
  @ApiOperation({ summary: '更新质量评分' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateQualityScore(
    @Param('id') id: string,
    @Body('qualityScore') qualityScore: number,
  ) {
    return this.companiesService.updateQualityScore(id, qualityScore);
  }
}
