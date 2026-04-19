import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, MoreThan, LessThan, Between } from 'typeorm';
import { Regulation, RegulationType, RegulationLevel, RegulationStatus } from './regulation.entity';
import { CreateRegulationDto, UpdateRegulationDto, RegulationQueryDto } from './dto/regulation.dto';

@Injectable()
export class RegulationsService {
  constructor(
    @InjectRepository(Regulation)
    private readonly regulationRepository: Repository<Regulation>,
  ) {}

  /**
   * 创建法规
   */
  async create(createRegulationDto: CreateRegulationDto): Promise<Regulation> {
    const regulation = this.regulationRepository.create(createRegulationDto);
    return this.regulationRepository.save(regulation);
  }

  /**
   * 获取所有法规
   */
  async findAll(query: RegulationQueryDto): Promise<{ regulations: Regulation[]; total: number }> {
    const {
      title,
      regulationType,
      level,
      issuingAgency,
      status,
      applicableField,
      releaseDateFrom,
      releaseDateTo,
      page = 1,
      limit = 10,
      sortBy = 'releaseDate',
      sortOrder = 'DESC',
    } = query;

    const where: any = {};

    // 标题模糊搜索
    if (title) {
      where.title = ILike(`%${title}%`);
    }

    // 法规类型
    if (regulationType) {
      where.regulationType = regulationType;
    }

    // 法规级别
    if (level) {
      where.level = level;
    }

    // 发布机构
    if (issuingAgency) {
      where.issuingAgency = ILike(`%${issuingAgency}%`);
    }

    // 状态
    if (status) {
      where.status = status;
    }

    // 适用领域
    if (applicableField) {
      where.applicableFields = Like(`%${applicableField}%`);
    }

    // 发布日期范围
    if (releaseDateFrom || releaseDateTo) {
      where.releaseDate = {};
      if (releaseDateFrom) {
        where.releaseDate.moreThan = releaseDateFrom;
      }
      if (releaseDateTo) {
        where.releaseDate.lessThan = releaseDateTo;
      }
    }

    const queryBuilder = this.regulationRepository
      .createQueryBuilder('regulation')
      .where(where)
      .orderBy(`regulation.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [regulations, total] = await queryBuilder.getManyAndCount();

    return { regulations, total };
  }

  /**
   * 根据 ID 获取法规
   */
  async findOne(id: string): Promise<Regulation> {
    const regulation = await this.regulationRepository.findOne({ where: { id } });

    if (!regulation) {
      throw new NotFoundException('法规不存在');
    }

    return regulation;
  }

  /**
   * 根据文号获取法规
   */
  async findByDocumentNumber(documentNumber: string): Promise<Regulation | null> {
    return this.regulationRepository.findOne({ where: { documentNumber } });
  }

  /**
   * 更新法规
   */
  async update(id: string, updateRegulationDto: UpdateRegulationDto): Promise<Regulation> {
    const regulation = await this.findOne(id);
    Object.assign(regulation, updateRegulationDto);
    return this.regulationRepository.save(regulation);
  }

  /**
   * 删除法规
   */
  async remove(id: string): Promise<void> {
    const regulation = await this.findOne(id);
    await this.regulationRepository.remove(regulation);
  }

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<any> {
    const queryBuilder = this.regulationRepository.createQueryBuilder('regulation');

    // 总数
    const totalQuery = await queryBuilder.getCount();

    // 按类型统计
    const byTypeQuery = await queryBuilder
      .select('regulation.regulationType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('regulation.regulationType')
      .getRawMany();

    const byType = byTypeQuery.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count);
      return acc;
    }, {});

    // 按级别统计
    const byLevelQuery = await queryBuilder
      .select('regulation.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('regulation.level')
      .getRawMany();

    const byLevel = byLevelQuery.reduce((acc, item) => {
      acc[item.level] = parseInt(item.count);
      return acc;
    }, {});

    // 按状态统计
    const byStatusQuery = await queryBuilder
      .select('regulation.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('regulation.status')
      .getRawMany();

    const byStatus = byStatusQuery.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {});

    // 按发布机构统计（TOP 20）
    const byAgencyQuery = await queryBuilder
      .select('regulation.issuingAgency', 'agency')
      .addSelect('COUNT(*)', 'count')
      .where('regulation.issuingAgency IS NOT NULL')
      .groupBy('regulation.issuingAgency')
      .orderBy('count', 'DESC')
      .limit(20)
      .getRawMany();

    const byAgency = byAgencyQuery.reduce((acc, item) => {
      acc[item.agency] = parseInt(item.count);
      return acc;
    }, {});

    // 有效法规数
    const effectiveCount = await queryBuilder
      .where('regulation.status = :status', { status: RegulationStatus.EFFECTIVE })
      .getCount();

    // 已废止法规数
    const repealedCount = await queryBuilder
      .where('regulation.status = :status', { status: RegulationStatus.REPEALED })
      .getCount();

    return {
      totalRegulations: totalQuery,
      byType,
      byLevel,
      byStatus,
      byAgency,
      effectiveCount,
      repealedCount,
    };
  }

  /**
   * 搜索法规（简单搜索）
   */
  async search(keyword: string, limit: number = 20): Promise<Regulation[]> {
    return this.regulationRepository
      .createQueryBuilder('regulation')
      .where('regulation.title ILIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('regulation.content ILIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('regulation.document_number ILIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('regulation.summary ILIKE :keyword', { keyword: `%${keyword}%` })
      .andWhere('regulation.status = :status', { status: RegulationStatus.EFFECTIVE })
      .orderBy('regulation.releaseDate', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * 获取最新法规
   */
  async getLatestRegulations(limit: number = 10): Promise<Regulation[]> {
    return this.regulationRepository.find({
      where: { status: RegulationStatus.EFFECTIVE },
      order: { releaseDate: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取即将实施的法规
   */
  async getUpcomingRegulations(days: number = 30): Promise<Regulation[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return this.regulationRepository.find({
      where: {
        status: RegulationStatus.EFFECTIVE,
        implementationDate: Between(today, futureDate),
      },
      order: { implementationDate: 'ASC' },
      take: limit,
    });
  }

  /**
   * 获取指定类型的法规
   */
  async getByType(type: RegulationType, limit: number = 50): Promise<Regulation[]> {
    return this.regulationRepository.find({
      where: {
        regulationType: type,
        status: RegulationStatus.EFFECTIVE,
      },
      order: { releaseDate: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取指定发布机构的法规
   */
  async getByAgency(agency: string, limit: number = 50): Promise<Regulation[]> {
    return this.regulationRepository.find({
      where: {
        issuingAgency: agency,
        status: RegulationStatus.EFFECTIVE,
      },
      order: { releaseDate: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取适用特定领域的法规
   */
  async getByField(field: string, limit: number = 50): Promise<Regulation[]> {
    return this.regulationRepository.find({
      where: {
        applicableFields: Like(`%${field}%`),
        status: RegulationStatus.EFFECTIVE,
      },
      order: { releaseDate: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取相关法规
   */
  async getRelatedRegulations(id: string, limit: number = 10): Promise<Regulation[]> {
    const regulation = await this.findOne(id);
    
    if (!regulation.relatedRegulations || regulation.relatedRegulations.length === 0) {
      return [];
    }

    return this.regulationRepository.find({
      where: {
        id: regulation.relatedRegulations,
        status: RegulationStatus.EFFECTIVE,
      },
      take: limit,
    });
  }
}
