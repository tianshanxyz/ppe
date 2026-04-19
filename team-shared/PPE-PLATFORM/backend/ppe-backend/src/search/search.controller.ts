import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PpeSearchService, SearchOptions, PpeFilters, PpeDocument } from './ppe-search.service';
import { RegulationSearchService, RegulationSearchOptions } from './regulation-search.service';
import { CompanySearchService, CompanySearchOptions } from './company-search.service';

interface RegulationFilters {
  regulationType?: string;
  level?: string;
  issuingAgency?: string;
  status?: string;
  [key: string]: string | undefined;
}

interface CompanyFilters {
  companyType?: string;
  province?: string;
  city?: string;
  status?: string;
  minRegisteredCapital?: number;
  maxRegisteredCapital?: number;
  [key: string]: string | number | undefined;
}

interface RegulationDocument {
  id: string;
  [key: string]: unknown;
}

interface CompanyDocument {
  id: string;
  [key: string]: unknown;
}

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(
    private readonly ppeSearchService: PpeSearchService,
    private readonly regulationSearchService: RegulationSearchService,
    private readonly companySearchService: CompanySearchService,
  ) {}

  // ==================== PPE 搜索 ====================

  @Get('ppe')
  @ApiOperation({ summary: '搜索 PPE' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchPpe(
    @Query('q') query?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('sort') sort?: string,
    @Query('highlight') highlight: boolean = false,
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('manufacturer') manufacturer?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('status') status?: string,
  ) {
    const filters: PpeFilters = {};
    if (category) filters.category = category;
    if (type) filters.type = type;
    if (manufacturer) filters.manufacturer = manufacturer;
    if (minPrice !== undefined) filters.minPrice = minPrice;
    if (maxPrice !== undefined) filters.maxPrice = maxPrice;
    if (status) filters.status = status;

    const options: SearchOptions = {
      query,
      filters,
      page,
      limit,
      highlight,
    };

    if (sort) {
      const [field, order] = sort.split(':');
      options.sort = { [field]: order || 'desc' };
    }

    return this.ppeSearchService.search(options);
  }

  @Get('ppe/suggest')
  @ApiOperation({ summary: 'PPE 自动补全' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async suggestPpe(
    @Query('q') query: string,
    @Query('size') size: number = 5,
  ) {
    return this.ppeSearchService.suggest(query, size);
  }

  @Get('ppe/stats')
  @ApiOperation({ summary: 'PPE 搜索统计' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getPpeStats() {
    return this.ppeSearchService.getSearchStats();
  }

  @Post('ppe/index')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '初始化 PPE 索引' })
  @ApiResponse({ status: 200, description: '索引初始化成功' })
  async initPpeIndex() {
    await this.ppeSearchService.initIndex();
    return { message: 'PPE 索引初始化成功' };
  }

  @Post('ppe/:id/index')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '索引单个 PPE' })
  @ApiResponse({ status: 200, description: '索引成功' })
  async indexPpe(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    await this.ppeSearchService.indexPpe({ id, ...data } as PpeDocument);
    return { message: 'PPE 索引成功' };
  }

  @Delete('ppe/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除 PPE 索引' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async deletePpe(@Param('id') id: string) {
    await this.ppeSearchService.deletePpe(id);
  }

  // ==================== 法规搜索 ====================

  @Get('regulations')
  @ApiOperation({ summary: '搜索法规' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchRegulations(
    @Query('q') query?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('sort') sort?: string,
    @Query('highlight') highlight: boolean = false,
    @Query('type') regulationType?: string,
    @Query('level') level?: string,
    @Query('agency') issuingAgency?: string,
    @Query('status') status?: string,
  ) {
    const filters: RegulationFilters = {};
    if (regulationType) filters.regulationType = regulationType;
    if (level) filters.level = level;
    if (issuingAgency) filters.issuingAgency = issuingAgency;
    if (status) filters.status = status;

    const options: RegulationSearchOptions = {
      query,
      filters,
      page,
      limit,
      highlight,
    };

    if (sort) {
      const [field, order] = sort.split(':');
      options.sort = { [field]: order || 'desc' };
    }

    return this.regulationSearchService.search(options);
  }

  @Get('regulations/suggest')
  @ApiOperation({ summary: '法规自动补全' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async suggestRegulations(
    @Query('q') query: string,
    @Query('size') size: number = 5,
  ) {
    return this.regulationSearchService.suggest(query, size);
  }

  @Get('regulations/stats')
  @ApiOperation({ summary: '法规搜索统计' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getRegulationStats() {
    return this.regulationSearchService.getSearchStats();
  }

  @Post('regulations/index')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '初始化法规索引' })
  @ApiResponse({ status: 200, description: '索引初始化成功' })
  async initRegulationIndex() {
    await this.regulationSearchService.initIndex();
    return { message: '法规索引初始化成功' };
  }

  @Post('regulations/:id/index')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '索引单个法规' })
  @ApiResponse({ status: 200, description: '索引成功' })
  async indexRegulation(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    await this.regulationSearchService.indexRegulation({ id, ...data } as RegulationDocument);
    return { message: '法规索引成功' };
  }

  @Delete('regulations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除法规索引' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async deleteRegulation(@Param('id') id: string) {
    await this.regulationSearchService.deleteRegulation(id);
  }

  // ==================== 企业搜索 ====================

  @Get('companies')
  @ApiOperation({ summary: '搜索企业' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchCompanies(
    @Query('q') query?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('sort') sort?: string,
    @Query('highlight') highlight: boolean = false,
    @Query('type') companyType?: string,
    @Query('province') province?: string,
    @Query('city') city?: string,
    @Query('status') status?: string,
    @Query('minCapital') minRegisteredCapital?: number,
    @Query('maxCapital') maxRegisteredCapital?: number,
  ) {
    const filters: CompanyFilters = {};
    if (companyType) filters.companyType = companyType;
    if (province) filters.province = province;
    if (city) filters.city = city;
    if (status) filters.status = status;
    if (minRegisteredCapital !== undefined) filters.minRegisteredCapital = minRegisteredCapital;
    if (maxRegisteredCapital !== undefined) filters.maxRegisteredCapital = maxRegisteredCapital;

    const options: CompanySearchOptions = {
      query,
      filters,
      page,
      limit,
      highlight,
    };

    if (sort) {
      const [field, order] = sort.split(':');
      options.sort = { [field]: order || 'desc' };
    }

    return this.companySearchService.search(options);
  }

  @Get('companies/suggest')
  @ApiOperation({ summary: '企业自动补全' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async suggestCompanies(
    @Query('q') query: string,
    @Query('size') size: number = 5,
  ) {
    return this.companySearchService.suggest(query, size);
  }

  @Get('companies/stats')
  @ApiOperation({ summary: '企业搜索统计' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getCompanyStats() {
    return this.companySearchService.getSearchStats();
  }

  @Post('companies/index')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '初始化企业索引' })
  @ApiResponse({ status: 200, description: '索引初始化成功' })
  async initCompanyIndex() {
    await this.companySearchService.initIndex();
    return { message: '企业索引初始化成功' };
  }

  @Post('companies/:id/index')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '索引单个企业' })
  @ApiResponse({ status: 200, description: '索引成功' })
  async indexCompany(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    await this.companySearchService.indexCompany({ id, ...data } as CompanyDocument);
    return { message: '企业索引成功' };
  }

  @Delete('companies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除企业索引' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async deleteCompany(@Param('id') id: string) {
    await this.companySearchService.deleteCompany(id);
  }
}
