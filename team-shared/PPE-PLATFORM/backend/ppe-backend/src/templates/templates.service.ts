import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import * as Handlebars from 'handlebars';
import { Template, TemplateCategory, TemplateEngine, TemplateFormat, TemplateStatus } from './template.entity';
import { TemplateRenderLog, RenderStatus } from './template-render-log.entity';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateQueryDto,
  RenderTemplateDto,
  ValidateTemplateDto,
  BatchRenderDto,
} from './dto/template.dto';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);
  private readonly handlebarsCache: Map<string, Handlebars.TemplateDelegate> = new Map();

  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    @InjectRepository(TemplateRenderLog)
    private readonly renderLogRepository: Repository<TemplateRenderLog>,
  ) {}

  /**
   * 创建模板
   */
  async create(createTemplateDto: CreateTemplateDto): Promise<Template> {
    const template = this.templateRepository.create(createTemplateDto);
    const savedTemplate = await this.templateRepository.save(template);
    
    // 清除缓存
    this.handlebarsCache.delete(savedTemplate.id);
    
    this.logger.log(`模板已创建：${savedTemplate.id}, 名称：${savedTemplate.name}`);
    return savedTemplate;
  }

  /**
   * 获取所有模板
   */
  async findAll(query: TemplateQueryDto): Promise<{ templates: Template[]; total: number }> {
    const { name, category, engine, format, status, tag, page = 1, limit = 10 } = query;

    const where: any = {};

    if (name) {
      where.name = ILike(`%${name}%`);
    }

    if (category) {
      where.category = category;
    }

    if (engine) {
      where.engine = engine;
    }

    if (format) {
      where.format = format;
    }

    if (status) {
      where.status = status;
    }

    if (tag) {
      where.tags = Like(`%${tag}%`);
    }

    const queryBuilder = this.templateRepository
      .createQueryBuilder('template')
      .where(where)
      .orderBy('template.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [templates, total] = await queryBuilder.getManyAndCount();

    return { templates, total };
  }

  /**
   * 根据 ID 获取模板
   */
  async findOne(id: string): Promise<Template> {
    const template = await this.templateRepository.findOne({ where: { id } });

    if (!template) {
      throw new NotFoundException('模板不存在');
    }

    return template;
  }

  /**
   * 根据名称获取模板
   */
  async findByName(name: string): Promise<Template> {
    const template = await this.templateRepository.findOne({ where: { name } });

    if (!template) {
      throw new NotFoundException('模板不存在');
    }

    return template;
  }

  /**
   * 更新模板
   */
  async update(id: string, updateTemplateDto: UpdateTemplateDto): Promise<Template> {
    const template = await this.findOne(id);
    Object.assign(template, updateTemplateDto);
    
    const updatedTemplate = await this.templateRepository.save(template);
    
    // 清除缓存
    this.handlebarsCache.delete(id);
    
    this.logger.log(`模板已更新：${id}`);
    return updatedTemplate;
  }

  /**
   * 删除模板
   */
  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepository.remove(template);
    
    // 清除缓存
    this.handlebarsCache.delete(id);
    
    this.logger.log(`模板已删除：${id}`);
  }

  /**
   * 激活/停用模板
   */
  async toggleStatus(id: string): Promise<Template> {
    const template = await this.findOne(id);
    template.status = template.status === TemplateStatus.ACTIVE 
      ? TemplateStatus.INACTIVE 
      : TemplateStatus.ACTIVE;
    
    const updatedTemplate = await this.templateRepository.save(template);
    this.handlebarsCache.delete(id);
    
    return updatedTemplate;
  }

  /**
   * 渲染模板（核心功能）
   */
  async render(templateId: string, renderDto: RenderTemplateDto, createdBy?: string): Promise<string> {
    const startTime = Date.now();
    const template = await this.findOne(templateId);

    if (template.status !== TemplateStatus.ACTIVE && template.status !== TemplateStatus.DRAFT) {
      throw new BadRequestException('模板未激活，无法渲染');
    }

    try {
      let renderedContent: string;

      switch (template.engine) {
        case TemplateEngine.HANDLEBARS:
          renderedContent = await this.renderWithHandlebars(template, renderDto);
          break;
        case TemplateEngine.MUSTACHE:
          renderedContent = await this.renderWithMustache(template, renderDto);
          break;
        case TemplateEngine.EJJS:
          renderedContent = await this.renderWithEjs(template, renderDto);
          break;
        case TemplateEngine.PUG:
          renderedContent = await this.renderWithPug(template, renderDto);
          break;
        case TemplateEngine.CUSTOM:
          renderedContent = await this.renderWithCustom(template, renderDto);
          break;
        default:
          renderedContent = await this.renderWithHandlebars(template, renderDto);
      }

      const renderTimeMs = Date.now() - startTime;

      // 记录渲染日志
      await this.logRender({
        templateId: template.id,
        templateName: template.name,
        inputData: renderDto.data,
        renderedContent,
        status: RenderStatus.SUCCESS,
        renderTimeMs,
        createdBy,
      });

      this.logger.log(`模板渲染成功：${template.id}, 耗时：${renderTimeMs}ms`);
      return renderedContent;
    } catch (error) {
      const renderTimeMs = Date.now() - startTime;

      // 记录错误日志
      await this.logRender({
        templateId: template.id,
        templateName: template.name,
        inputData: renderDto.data,
        renderedContent: null,
        status: RenderStatus.FAILED,
        errorMessage: error.message,
        renderTimeMs,
        createdBy,
      });

      this.logger.error(`模板渲染失败：${template.id}`, error);
      throw new BadRequestException(`模板渲染失败：${error.message}`);
    }
  }

  /**
   * 使用 Handlebars 渲染
   */
  private async renderWithHandlebars(template: Template, renderDto: RenderTemplateDto): Promise<string> {
    let compileFn: Handlebars.TemplateDelegate;

    // 尝试从缓存获取
    if (this.handlebarsCache.has(template.id)) {
      compileFn = this.handlebarsCache.get(template.id);
    } else {
      // 注册自定义助手
      this.registerHelpers(template);

      // 注册局部模板
      if (template.partialContent) {
        Handlebars.registerPartial('partial', template.partialContent);
      }

      // 编译模板
      compileFn = Handlebars.compile(template.content);
      this.handlebarsCache.set(template.id, compileFn);
    }

    // 渲染
    const context = {
      ...renderDto.data,
      ...renderDto.layout,
    };

    return compileFn(context);
  }

  /**
   * 使用 Mustache 渲染
   */
  private async renderWithMustache(template: Template, renderDto: RenderTemplateDto): Promise<string> {
    // TODO: 集成 mustache 库
    // const mustache = require('mustache');
    // return mustache.render(template.content, renderDto.data);
    
    // 临时使用简单替换
    let content = template.content;
    Object.keys(renderDto.data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, renderDto.data[key]);
    });
    return content;
  }

  /**
   * 使用 EJS 渲染
   */
  private async renderWithEjs(template: Template, renderDto: RenderTemplateDto): Promise<string> {
    // TODO: 集成 ejs 库
    // const ejs = require('ejs');
    // return ejs.render(template.content, renderDto.data);
    
    // 临时使用简单替换
    let content = template.content;
    Object.keys(renderDto.data).forEach((key) => {
      const regex = new RegExp(`<%= ${key} %>`, 'g');
      content = content.replace(regex, renderDto.data[key]);
    });
    return content;
  }

  /**
   * 使用 Pug 渲染
   */
  private async renderWithPug(template: Template, renderDto: RenderTemplateDto): Promise<string> {
    // TODO: 集成 pug 库
    // const pug = require('pug');
    // return pug.render(template.content, renderDto.data);
    
    throw new Error('Pug 引擎暂未支持');
  }

  /**
   * 使用自定义引擎渲染
   */
  private async renderWithCustom(template: Template, renderDto: RenderTemplateDto): Promise<string> {
    // 使用模板中定义的自定义逻辑
    if (template.helpers && template.helpers.render) {
      // 调用自定义渲染函数
      return template.helpers.render(template.content, renderDto.data);
    }
    
    throw new Error('自定义引擎未实现渲染逻辑');
  }

  /**
   * 注册 Handlebars 助手
   */
  private registerHelpers(template: Template): void {
    // 内置助手：格式化日期
    Handlebars.registerHelper('dateFormat', (date: any, format: string) => {
      if (!date) return '';
      const d = new Date(date);
      if (format === 'short') {
        return d.toLocaleDateString();
      } else if (format === 'long') {
        return d.toLocaleString();
      }
      return d.toISOString();
    });

    // 内置助手：条件判断
    Handlebars.registerHelper('ifEquals', (a: any, b: any, options: any) => {
      return a === b ? options.fn(this) : options.inverse(this);
    });

    // 内置助手：大于
    Handlebars.registerHelper('ifGreater', (a: any, b: any, options: any) => {
      return a > b ? options.fn(this) : options.inverse(this);
    });

    // 内置助手：小于
    Handlebars.registerHelper('ifLess', (a: any, b: any, options: any) => {
      return a < b ? options.fn(this) : options.inverse(this);
    });

    // 内置助手：数组长度
    Handlebars.registerHelper('length', (array: any[]) => {
      return array ? array.length : 0;
    });

    // 内置助手：JSON 字符串化
    Handlebars.registerHelper('jsonify', (obj: any) => {
      return JSON.stringify(obj);
    });

    // 注册模板自定义助手
    if (template.helpers) {
      Object.keys(template.helpers).forEach((key) => {
        Handlebars.registerHelper(key, template.helpers[key]);
      });
    }
  }

  /**
   * 批量渲染
   */
  async batchRender(batchRenderDto: BatchRenderDto, createdBy?: string): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    for (const templateId of batchRenderDto.templateIds) {
      try {
        const rendered = await this.render(templateId, { data: batchRenderDto.data }, createdBy);
        results[templateId] = rendered;
      } catch (error) {
        this.logger.error(`批量渲染失败，模板 ID: ${templateId}`, error);
        results[templateId] = `ERROR: ${error.message}`;
      }
    }

    return results;
  }

  /**
   * 验证模板语法
   */
  async validate(validateDto: ValidateTemplateDto): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      switch (validateDto.engine) {
        case TemplateEngine.HANDLEBARS:
          Handlebars.compile(validateDto.content);
          break;
        case TemplateEngine.MUSTACHE:
          // mustache.parse(validateDto.content);
          break;
        case TemplateEngine.EJJS:
          // ejs.compile(validateDto.content);
          break;
        case TemplateEngine.PUG:
          // pug.compile(validateDto.content);
          break;
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
      };
    }
  }

  /**
   * 获取渲染日志
   */
  async getRenderLogs(templateId?: string, limit = 50): Promise<TemplateRenderLog[]> {
    const queryBuilder = this.renderLogRepository
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC')
      .take(limit);

    if (templateId) {
      queryBuilder.where('log.templateId = :templateId', { templateId });
    }

    return queryBuilder.getMany();
  }

  /**
   * 记录渲染日志
   */
  private async logRender(logData: Partial<TemplateRenderLog>): Promise<TemplateRenderLog> {
    const log = this.renderLogRepository.create(logData);
    return this.renderLogRepository.save(log);
  }

  /**
   * 获取模板统计信息
   */
  async getStatistics(): Promise<any> {
    const queryBuilder = this.templateRepository.createQueryBuilder('template');

    const totalQuery = await queryBuilder.getCount();

    const byCategoryQuery = await queryBuilder
      .select('template.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('template.category')
      .getRawMany();

    const byCategory = byCategoryQuery.reduce((acc, item) => {
      acc[item.category] = parseInt(item.count);
      return acc;
    }, {});

    const byEngineQuery = await queryBuilder
      .select('template.engine', 'engine')
      .addSelect('COUNT(*)', 'count')
      .groupBy('template.engine')
      .getRawMany();

    const byEngine = byEngineQuery.reduce((acc, item) => {
      acc[item.engine] = parseInt(item.count);
      return acc;
    }, {});

    const byStatusQuery = await queryBuilder
      .select('template.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('template.status')
      .getRawMany();

    const byStatus = byStatusQuery.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {});

    const activeCount = await queryBuilder
      .where('template.status = :status', { status: TemplateStatus.ACTIVE })
      .getCount();

    const draftCount = await queryBuilder
      .where('template.status = :status', { status: TemplateStatus.DRAFT })
      .getCount();

    // 渲染统计
    const renderLogQueryBuilder = this.renderLogRepository.createQueryBuilder('log');
    const totalRenders = await renderLogQueryBuilder.getCount();

    const successRenders = await renderLogQueryBuilder
      .where('log.status = :status', { status: RenderStatus.SUCCESS })
      .getCount();

    const failedRenders = await renderLogQueryBuilder
      .where('log.status = :status', { status: RenderStatus.FAILED })
      .getCount();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRenders = await renderLogQueryBuilder
      .where('log.createdAt >= :today', { today })
      .getCount();

    return {
      totalTemplates: totalQuery,
      byCategory,
      byEngine,
      byStatus,
      activeCount,
      draftCount,
      renderLogs: {
        totalRenders,
        successRenders,
        failedRenders,
        todayRenders,
      },
    };
  }

  /**
   * 清除渲染缓存
   */
  clearCache(templateId?: string): void {
    if (templateId) {
      this.handlebarsCache.delete(templateId);
      this.logger.log(`模板缓存已清除：${templateId}`);
    } else {
      this.handlebarsCache.clear();
      this.logger.log('所有模板缓存已清除');
    }
  }

  /**
   * 预编译模板（性能优化）
   */
  async precompileTemplates(templateIds?: string[]): Promise<void> {
    let templates: Template[];

    if (templateIds) {
      templates = await this.templateRepository.findByIds(templateIds);
    } else {
      templates = await this.templateRepository.find({
        where: { status: TemplateStatus.ACTIVE },
      });
    }

    for (const template of templates) {
      try {
        if (template.engine === TemplateEngine.HANDLEBARS) {
          this.registerHelpers(template);
          const compileFn = Handlebars.compile(template.content);
          this.handlebarsCache.set(template.id, compileFn);
          this.logger.log(`模板预编译成功：${template.id}`);
        }
      } catch (error) {
        this.logger.error(`模板预编译失败：${template.id}`, error);
      }
    }
  }
}
