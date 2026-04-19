import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneratedFile, FileType, FileStatus, FileStorage } from './generated-file.entity';
import { GenerateFileDto, GenerateExcelDto, GenerateWordDto } from './dto/file.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'generated');

  constructor(
    @InjectRepository(GeneratedFile)
    private readonly fileRepository: Repository<GeneratedFile>,
  ) {
    // 确保上传目录存在
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * 生成文件（通用）
   */
  async generateFile(generateFileDto: GenerateFileDto, createdBy?: string): Promise<GeneratedFile> {
    const { name, fileType, templateId, templateData, generationOptions, storage, expiresInHours } = generateFileDto;

    // 创建文件记录
    const fileRecord = this.fileRepository.create({
      name,
      originalName: `${name}.${fileType}`,
      fileType,
      mimeType: this.getMimeType(fileType),
      storage,
      status: FileStatus.PENDING,
      templateId,
      templateData,
      generationOptions,
      createdBy,
      metadata: generateFileDto.metadata,
    });

    // 设置过期时间
    if (expiresInHours) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);
      fileRecord.expiresAt = expiresAt;
    }

    const savedFile = await this.fileRepository.save(fileRecord);

    // 异步生成文件
    this.processFileGeneration(savedFile).catch((error) => {
      this.logger.error(`文件生成失败：${savedFile.id}`, error);
    });

    return savedFile;
  }

  /**
   * 处理文件生成
   */
  private async processFileGeneration(file: GeneratedFile): Promise<void> {
    try {
      file.status = FileStatus.GENERATING;
      await this.fileRepository.save(file);

      let filePath: string;
      let fileSize: number;

      switch (file.fileType) {
        case FileType.PDF:
          const pdfContent = await this.generatePdf(file);
          filePath = await this.saveFile(file.name, 'pdf', pdfContent);
          fileSize = pdfContent.length;
          break;

        case FileType.WORD:
          const wordContent = await this.generateWord(file);
          filePath = await this.saveFile(file.name, 'docx', wordContent);
          fileSize = wordContent.length;
          break;

        case FileType.EXCEL:
          const excelContent = await this.generateExcel(file);
          filePath = await this.saveFile(file.name, 'xlsx', excelContent);
          fileSize = excelContent.length;
          break;

        case FileType.CSV:
          const csvContent = await this.generateCsv(file);
          filePath = await this.saveFile(file.name, 'csv', csvContent);
          fileSize = csvContent.length;
          break;

        case FileType.HTML:
          const htmlContent = await this.generateHtml(file);
          filePath = await this.saveFile(file.name, 'html', htmlContent);
          fileSize = htmlContent.length;
          break;

        case FileType.JSON:
          const jsonContent = await this.generateJson(file);
          filePath = await this.saveFile(file.name, 'json', jsonContent);
          fileSize = jsonContent.length;
          break;

        case FileType.XML:
          const xmlContent = await this.generateXml(file);
          filePath = await this.saveFile(file.name, 'xml', xmlContent);
          fileSize = xmlContent.length;
          break;

        case FileType.TEXT:
          const textContent = await this.generateText(file);
          filePath = await this.saveFile(file.name, 'txt', textContent);
          fileSize = textContent.length;
          break;

        default:
          throw new Error(`不支持的文件类型：${file.fileType}`);
      }

      // 更新文件记录
      file.filePath = filePath;
      file.fileSize = fileSize;
      file.status = FileStatus.COMPLETED;
      file.fileUrl = this.getFileUrl(file);
      
      await this.fileRepository.save(file);

      this.logger.log(`文件生成成功：${file.id}, 路径：${filePath}`);
    } catch (error) {
      this.logger.error(`文件生成失败：${file.id}`, error);
      file.status = FileStatus.FAILED;
      file.errorMessage = error.message;
      await this.fileRepository.save(file);
    }
  }

  /**
   * 生成 PDF
   */
  private async generatePdf(file: GeneratedFile): Promise<Buffer> {
    // TODO: 集成 Puppeteer 或 pdfkit
    // const puppeteer = require('puppeteer');
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.setContent(file.templateData?.html || '<h1>Hello</h1>');
    // const pdf = await page.pdf({ format: 'A4' });
    // await browser.close();
    // return pdf;

    // 临时实现：返回简单的 PDF
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 24 Tf
100 700 Td
(File: ${file.name}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
307
%%EOF`;

    return Buffer.from(pdfContent);
  }

  /**
   * 生成 Word
   */
  private async generateWord(file: GeneratedFile): Promise<Buffer> {
    // TODO: 集成 docx 库
    // const { Document, Packer, Paragraph, TextRun } = require('docx');
    // const doc = new Document({ ... });
    // const buffer = await Packer.toBuffer(doc);
    // return buffer;

    // 临时实现：返回简单的 Word 文档（ZIP 格式）
    const wordContent = Buffer.from('PK简易 Word 文档');
    return wordContent;
  }

  /**
   * 生成 Excel
   */
  private async generateExcel(file: GeneratedFile): Promise<Buffer> {
    // TODO: 集成 ExcelJS
    // const ExcelJS = require('exceljs');
    // const workbook = new ExcelJS.Workbook();
    // const worksheet = workbook.addWorksheet('Sheet1');
    // worksheet.columns = [...];
    // worksheet.addRows([...]);
    // const buffer = await workbook.xlsx.writeBuffer();
    // return buffer;

    // 临时实现：返回简单的 Excel 内容
    const excelContent = Buffer.from('简易 Excel 内容');
    return excelContent;
  }

  /**
   * 生成 CSV
   */
  private async generateCsv(file: GeneratedFile): Promise<Buffer> {
    const data = file.templateData?.rows || [];
    const headers = file.templateData?.headers || [];

    const csvLines = [
      headers.join(','),
      ...data.map((row: any[]) => row.map((cell) => `"${cell}"`).join(',')),
    ];

    return Buffer.from(csvLines.join('\n'));
  }

  /**
   * 生成 HTML
   */
  private async generateHtml(file: GeneratedFile): Promise<Buffer> {
    const html = file.templateData?.html || `
      <html>
        <head><title>${file.name}</title></head>
        <body>
          <h1>${file.name}</h1>
          <p>生成时间：${new Date().toLocaleString()}</p>
        </body>
      </html>
    `;

    return Buffer.from(html);
  }

  /**
   * 生成 JSON
   */
  private async generateJson(file: GeneratedFile): Promise<Buffer> {
    const json = JSON.stringify(file.templateData || {}, null, 2);
    return Buffer.from(json);
  }

  /**
   * 生成 XML
   */
  private async generateXml(file: GeneratedFile): Promise<Buffer> {
    const data = file.templateData || {};
    
    const xmlLines = ['<?xml version="1.0" encoding="UTF-8"?>'];
    xmlLines.push(`<${file.name.replace(/\s/g, '_')}>`);
    
    Object.keys(data).forEach((key) => {
      xmlLines.push(`  <${key}>${data[key]}</${key}>`);
    });
    
    xmlLines.push(`</${file.name.replace(/\s/g, '_')}>`);

    return Buffer.from(xmlLines.join('\n'));
  }

  /**
   * 生成文本
   */
  private async generateText(file: GeneratedFile): Promise<Buffer> {
    const text = file.templateData?.text || `${file.name}\n生成时间：${new Date().toLocaleString()}`;
    return Buffer.from(text);
  }

  /**
   * 保存文件
   */
  private async saveFile(name: string, extension: string, content: Buffer): Promise<string> {
    const filename = `${name}_${Date.now()}.${extension}`;
    const filePath = path.join(this.uploadDir, filename);

    await fs.promises.writeFile(filePath, content);
    return filePath;
  }

  /**
   * 获取文件 URL
   */
  private getFileUrl(file: GeneratedFile): string {
    // 本地存储返回相对路径
    if (file.storage === FileStorage.LOCAL) {
      return `/api/v1/files/${file.id}/download`;
    }
    
    // 云存储返回完整 URL（需要配置）
    return file.filePath;
  }

  /**
   * 获取 MIME 类型
   */
  private getMimeType(fileType: FileType): string {
    const mimeTypes: Record<FileType, string> = {
      [FileType.PDF]: 'application/pdf',
      [FileType.WORD]: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      [FileType.EXCEL]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      [FileType.CSV]: 'text/csv',
      [FileType.HTML]: 'text/html',
      [FileType.JSON]: 'application/json',
      [FileType.XML]: 'application/xml',
      [FileType.TEXT]: 'text/plain',
    };

    return mimeTypes[fileType];
  }

  /**
   * 获取所有文件
   */
  async findAll(query: any): Promise<{ files: GeneratedFile[]; total: number }> {
    const { fileType, status, storage, createdBy, page = 1, limit = 20 } = query;

    const where: any = {};

    if (fileType) {
      where.fileType = fileType;
    }

    if (status) {
      where.status = status;
    }

    if (storage) {
      where.storage = storage;
    }

    if (createdBy) {
      where.createdBy = createdBy;
    }

    const queryBuilder = this.fileRepository
      .createQueryBuilder('file')
      .where(where)
      .orderBy('file.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [files, total] = await queryBuilder.getManyAndCount();

    return { files, total };
  }

  /**
   * 根据 ID 获取文件
   */
  async findOne(id: string): Promise<GeneratedFile> {
    const file = await this.fileRepository.findOne({ where: { id } });

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    return file;
  }

  /**
   * 下载文件
   */
  async download(id: string): Promise<{ path: string; name: string; mimeType: string }> {
    const file = await this.findOne(id);

    if (file.status !== FileStatus.COMPLETED) {
      throw new BadRequestException('文件未生成完成');
    }

    // 检查是否过期
    if (file.expiresAt && new Date() > file.expiresAt) {
      throw new BadRequestException('文件已过期');
    }

    // 更新下载统计
    file.downloadCount += 1;
    file.lastDownloadedAt = new Date();
    await this.fileRepository.save(file);

    return {
      path: file.filePath,
      name: file.originalName,
      mimeType: file.mimeType,
    };
  }

  /**
   * 删除文件
   */
  async remove(id: string): Promise<void> {
    const file = await this.findOne(id);
    
    // 物理删除文件
    if (fs.existsSync(file.filePath)) {
      await fs.promises.unlink(file.filePath);
    }

    // 删除记录
    await this.fileRepository.remove(file);
    
    this.logger.log(`文件已删除：${id}`);
  }

  /**
   * 清理过期文件
   */
  async cleanupExpiredFiles(): Promise<number> {
    const now = new Date();
    
    const expiredFiles = await this.fileRepository.find({
      where: {
        expiresAt: LessThan(now),
        status: FileStatus.COMPLETED,
      },
    });

    let deletedCount = 0;

    for (const file of expiredFiles) {
      try {
        if (fs.existsSync(file.filePath)) {
          await fs.promises.unlink(file.filePath);
        }
        await this.fileRepository.remove(file);
        deletedCount++;
      } catch (error) {
        this.logger.error(`清理过期文件失败：${file.id}`, error);
      }
    }

    this.logger.log(`清理了 ${deletedCount} 个过期文件`);
    return deletedCount;
  }

  /**
   * 获取文件统计
   */
  async getStatistics(): Promise<any> {
    const queryBuilder = this.fileRepository.createQueryBuilder('file');

    const totalQuery = await queryBuilder.getCount();

    const byTypeQuery = await queryBuilder
      .select('file.fileType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('file.fileType')
      .getRawMany();

    const byType = byTypeQuery.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count);
      return acc;
    }, {});

    const byStatusQuery = await queryBuilder
      .select('file.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('file.status')
      .getRawMany();

    const byStatus = byStatusQuery.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {});

    const completedCount = await queryBuilder
      .where('file.status = :status', { status: FileStatus.COMPLETED })
      .getCount();

    const failedCount = await queryBuilder
      .where('file.status = :status', { status: FileStatus.FAILED })
      .getCount();

    const pendingCount = await queryBuilder
      .where('file.status = :status', { status: FileStatus.PENDING })
      .getCount();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await queryBuilder
      .where('file.createdAt >= :today', { today })
      .getCount();

    // 计算总大小
    const totalSizeQuery = await queryBuilder
      .select('SUM(file.fileSize)', 'total')
      .where('file.status = :status', { status: FileStatus.COMPLETED })
      .getRawOne();

    const totalSize = parseInt(totalSizeQuery.total) || 0;

    return {
      totalFiles: totalQuery,
      byType,
      byStatus,
      completedCount,
      failedCount,
      pendingCount,
      todayCount,
      totalSize,
    };
  }
}

// 导入 LessThan
import { LessThan } from 'typeorm';
