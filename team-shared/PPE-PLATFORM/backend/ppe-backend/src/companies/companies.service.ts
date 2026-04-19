import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, MoreThan, Between } from 'typeorm';
import { Company, CompanyType, CompanyStatus } from './company.entity';
import { CreateCompanyDto, UpdateCompanyDto, CompanyQueryDto } from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  /**
   * 创建企业
   */
  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    // 检查统一社会信用代码是否已存在
    const existing = await this.companyRepository.findOne({
      where: { creditCode: createCompanyDto.creditCode },
    });

    if (existing) {
      throw new ConflictException('统一社会信用代码已存在');
    }

    const company = this.companyRepository.create(createCompanyDto);
    return this.companyRepository.save(company);
  }

  /**
   * 获取所有企业
   */
  async findAll(query: CompanyQueryDto): Promise<{ companies: Company[]; total: number }> {
    const {
      name,
      companyType,
      province,
      city,
      status,
      certification,
      minRegisteredCapital,
      maxRegisteredCapital,
      minQualityScore,
      minProductCount,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const where: any = {};

    // 名称模糊搜索
    if (name) {
      where.name = ILike(`%${name}%`);
    }

    // 企业类型
    if (companyType) {
      where.companyType = companyType;
    }

    // 地区
    if (province) {
      where.province = province;
    }
    if (city) {
      where.city = city;
    }

    // 状态
    if (status) {
      where.status = status;
    }

    // 认证
    if (certification) {
      where.certifications = Like(`%${certification}%`);
    }

    // 注册资本范围
    if (minRegisteredCapital !== undefined || maxRegisteredCapital !== undefined) {
      where.registeredCapital = {};
      if (minRegisteredCapital !== undefined) {
        where.registeredCapital.moreThan = minRegisteredCapital;
      }
      if (maxRegisteredCapital !== undefined) {
        where.registeredCapital.lessThan = maxRegisteredCapital;
      }
    }

    // 质量评分
    if (minQualityScore !== undefined) {
      where.qualityScore = MoreThan(minQualityScore);
    }

    // 产品数量
    if (minProductCount !== undefined) {
      where.productCount = MoreThan(minProductCount);
    }

    const queryBuilder = this.companyRepository
      .createQueryBuilder('company')
      .where(where)
      .orderBy(`company.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [companies, total] = await queryBuilder.getManyAndCount();

    return { companies, total };
  }

  /**
   * 根据 ID 获取企业
   */
  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { id } });

    if (!company) {
      throw new NotFoundException('企业不存在');
    }

    return company;
  }

  /**
   * 根据统一社会信用代码获取企业
   */
  async findByCreditCode(creditCode: string): Promise<Company | null> {
    return this.companyRepository.findOne({ where: { creditCode } });
  }

  /**
   * 更新企业
   */
  async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findOne(id);

    // 如果更新统一社会信用代码，检查是否与其他企业重复
    if (updateCompanyDto.creditCode && updateCompanyDto.creditCode !== company.creditCode) {
      const existing = await this.companyRepository.findOne({
        where: { creditCode: updateCompanyDto.creditCode },
      });
      if (existing) {
        throw new ConflictException('统一社会信用代码已存在');
      }
    }

    Object.assign(company, updateCompanyDto);
    return this.companyRepository.save(company);
  }

  /**
   * 删除企业
   */
  async remove(id: string): Promise<void> {
    const company = await this.findOne(id);
    await this.companyRepository.remove(company);
  }

  /**
   * 更新企业产品数量
   */
  async updateProductCount(id: string, productCount: number): Promise<Company> {
    const company = await this.findOne(id);
    company.productCount = productCount;
    return this.companyRepository.save(company);
  }

  /**
   * 增加产品数量
   */
  async incrementProductCount(id: string): Promise<Company> {
    await this.companyRepository.increment({ id }, 'productCount', 1);
    return this.findOne(id);
  }

  /**
   * 减少产品数量
   */
  async decrementProductCount(id: string): Promise<Company> {
    await this.companyRepository.decrement({ id }, 'productCount', 1);
    return this.findOne(id);
  }

  /**
   * 更新企业质量评分
   */
  async updateQualityScore(id: string, qualityScore: number): Promise<Company> {
    const company = await this.findOne(id);
    company.qualityScore = qualityScore;
    return this.companyRepository.save(company);
  }

  /**
   * 获取企业统计信息
   */
  async getStatistics(): Promise<any> {
    const queryBuilder = this.companyRepository.createQueryBuilder('company');

    // 总数
    const totalQuery = await queryBuilder.getCount();

    // 按类型统计
    const byTypeQuery = await queryBuilder
      .select('company.companyType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('company.companyType')
      .getRawMany();

    const byType = byTypeQuery.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count);
      return acc;
    }, {});

    // 按省份统计
    const byProvinceQuery = await queryBuilder
      .select('company.province', 'province')
      .addSelect('COUNT(*)', 'count')
      .where('company.province IS NOT NULL')
      .groupBy('company.province')
      .getRawMany();

    const byProvince = byProvinceQuery.reduce((acc, item) => {
      acc[item.province] = parseInt(item.count);
      return acc;
    }, {});

    // 按状态统计
    const byStatusQuery = await queryBuilder
      .select('company.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('company.status')
      .getRawMany();

    const byStatus = byStatusQuery.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {});

    // 平均注册资本
    const avgCapitalQuery = await queryBuilder
      .select('AVG(company.registeredCapital)', 'avg')
      .getRawOne();

    const avgRegisteredCapital = parseFloat(avgCapitalQuery.avg) || 0;

    // 平均质量评分
    const avgQualityQuery = await queryBuilder
      .select('AVG(company.qualityScore)', 'avg')
      .getRawOne();

    const avgQualityScore = parseFloat(avgQualityQuery.avg) || 0;

    // 总产品数
    const totalProductsQuery = await queryBuilder
      .select('SUM(company.productCount)', 'total')
      .getRawOne();

    const totalProducts = parseInt(totalProductsQuery.total) || 0;

    // 有认证企业数
    const certifiedQuery = await queryBuilder
      .where('company.certifications IS NOT NULL')
      .andWhere('array_length(company.certifications, 1) > 0')
      .getCount();

    return {
      totalCompanies: totalQuery,
      byType,
      byProvince,
      byStatus,
      avgRegisteredCapital,
      avgQualityScore,
      totalProducts,
      certifiedCompanies: certifiedQuery,
    };
  }

  /**
   * 搜索企业（简单搜索）
   */
  async search(keyword: string, limit: number = 20): Promise<Company[]> {
    return this.companyRepository
      .createQueryBuilder('company')
      .where('company.name ILIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('company.shortName ILIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('company.creditCode ILIKE :keyword', { keyword: `%${keyword}%` })
      .andWhere('company.status = :status', { status: CompanyStatus.ACTIVE })
      .orderBy('company.qualityScore', 'DESC')
      .addOrderBy('company.productCount', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * 获取热门企业（按产品数或质量评分）
   */
  async getTopCompanies(limit: number = 10, orderBy: 'productCount' | 'qualityScore' = 'qualityScore'): Promise<Company[]> {
    return this.companyRepository
      .createQueryBuilder('company')
      .where('company.status = :status', { status: CompanyStatus.ACTIVE })
      .orderBy(`company.${orderBy}`, 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * 获取指定类型的企业
   */
  async getByType(type: CompanyType, limit: number = 50): Promise<Company[]> {
    return this.companyRepository.find({
      where: {
        companyType: type,
        status: CompanyStatus.ACTIVE,
      },
      order: {
        qualityScore: 'DESC',
        productCount: 'DESC',
      },
      take: limit,
    });
  }

  /**
   * 获取指定地区的企业
   */
  async getByLocation(province: string, city?: string, limit: number = 50): Promise<Company[]> {
    const where: any = {
      province,
      status: CompanyStatus.ACTIVE,
    };

    if (city) {
      where.city = city;
    }

    return this.companyRepository.find({
      where,
      order: {
        qualityScore: 'DESC',
        productCount: 'DESC',
      },
      take: limit,
    });
  }
}
