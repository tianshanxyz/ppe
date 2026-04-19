export const PPE_INDEX_NAME = 'ppe';

export const PPE_INDEX_MAPPING = {
  settings: {
    analysis: {
      analyzer: {
        ppe_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'stop'],
        },
      },
    },
    number_of_shards: 1,
    number_of_replicas: 0,
  },
  mappings: {
    properties: {
      // 基本信息
      id: { type: 'keyword' },
      name: {
        type: 'text',
        analyzer: 'ppe_analyzer',
        fields: {
          keyword: { type: 'keyword' },
          suggest: { type: 'completion' },
        },
      },
      description: {
        type: 'text',
        analyzer: 'ppe_analyzer',
      },
      
      // 分类
      category: {
        type: 'keyword',
      },
      subcategory: {
        type: 'keyword',
      },
      type: {
        type: 'keyword',
      },
      
      // 注册信息
      registrationNumber: {
        type: 'keyword',
      },
      registrationDate: {
        type: 'date',
      },
      expiryDate: {
        type: 'date',
      },
      
      // 企业信息
      manufacturer: {
        type: 'text',
        fields: {
          keyword: { type: 'keyword' },
        },
      },
      manufacturerId: {
        type: 'keyword',
      },
      
      // 规格信息
      specifications: {
        type: 'text',
      },
      model: {
        type: 'keyword',
      },
      
      // 标准信息
      standards: {
        type: 'keyword',
      },
      certificationMarks: {
        type: 'keyword',
      },
      
      // 使用场景
      usageScenarios: {
        type: 'keyword',
      },
      protectionLevel: {
        type: 'keyword',
      },
      
      // 价格
      price: {
        type: 'float',
      },
      currency: {
        type: 'keyword',
      },
      
      // 库存
      stock: {
        type: 'integer',
      },
      
      // 状态
      status: {
        type: 'keyword',
      },
      approvalStatus: {
        type: 'keyword',
      },
      
      // 质量评分
      qualityScore: {
        type: 'float',
      },
      
      // 图片
      images: {
        type: 'keyword',
      },
      
      // 文档
      documents: {
        type: 'nested',
        properties: {
          name: { type: 'text' },
          url: { type: 'keyword' },
          type: { type: 'keyword' },
        },
      },
      
      // 关键词
      keywords: {
        type: 'keyword',
      },
      
      // 元数据
      metadata: {
        type: 'object',
        enabled: false, // 不索引，只存储
      },
      
      // 时间戳
      createdAt: {
        type: 'date',
      },
      updatedAt: {
        type: 'date',
      },
      
      // 全文搜索字段（组合字段）
      fullText: {
        type: 'text',
        analyzer: 'ppe_analyzer',
      },
    },
  },
};

export const REGULATION_INDEX_NAME = 'regulations';

export const REGULATION_INDEX_MAPPING = {
  settings: {
    analysis: {
      analyzer: {
        regulation_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'stop'],
        },
      },
    },
    number_of_shards: 1,
    number_of_replicas: 0,
  },
  mappings: {
    properties: {
      id: { type: 'keyword' },
      title: {
        type: 'text',
        analyzer: 'regulation_analyzer',
        fields: {
          keyword: { type: 'keyword' },
          suggest: { type: 'completion' },
        },
      },
      content: {
        type: 'text',
        analyzer: 'regulation_analyzer',
      },
      
      // 法规类型
      regulationType: {
        type: 'keyword',
      },
      level: {
        type: 'keyword',
      },
      
      // 发布机构
      issuingAgency: {
        type: 'keyword',
      },
      
      // 编号
      documentNumber: {
        type: 'keyword',
      },
      
      // 时间
      releaseDate: {
        type: 'date',
      },
      implementationDate: {
        type: 'date',
      },
      
      // 状态
      status: {
        type: 'keyword',
      },
      
      // 适用领域
      applicableFields: {
        type: 'keyword',
      },
      
      // 关键词
      keywords: {
        type: 'keyword',
      },
      
      // 时间戳
      createdAt: {
        type: 'date',
      },
      updatedAt: {
        type: 'date',
      },
      
      // 全文搜索字段
      fullText: {
        type: 'text',
        analyzer: 'regulation_analyzer',
      },
    },
  },
};

export const COMPANY_INDEX_NAME = 'companies';

export const COMPANY_INDEX_MAPPING = {
  settings: {
    analysis: {
      analyzer: {
        company_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'stop'],
        },
      },
    },
    number_of_shards: 1,
    number_of_replicas: 0,
  },
  mappings: {
    properties: {
      id: { type: 'keyword' },
      name: {
        type: 'text',
        analyzer: 'company_analyzer',
        fields: {
          keyword: { type: 'keyword' },
          suggest: { type: 'completion' },
        },
      },
      
      // 企业类型
      companyType: {
        type: 'keyword',
      },
      
      // 统一社会信用代码
      creditCode: {
        type: 'keyword',
      },
      
      // 注册信息
      registrationDate: {
        type: 'date',
      },
      registeredCapital: {
        type: 'float',
      },
      
      // 地址
      address: {
        type: 'text',
      },
      province: {
        type: 'keyword',
      },
      city: {
        type: 'keyword',
      },
      
      // 联系信息
      phone: {
        type: 'keyword',
      },
      email: {
        type: 'keyword',
      },
      website: {
        type: 'keyword',
      },
      
      // 经营范围
      businessScope: {
        type: 'text',
      },
      
      // 状态
      status: {
        type: 'keyword',
      },
      
      // 认证
      certifications: {
        type: 'keyword',
      },
      
      // 产品数量
      productCount: {
        type: 'integer',
      },
      
      // 质量评分
      qualityScore: {
        type: 'float',
      },
      
      // 时间戳
      createdAt: {
        type: 'date',
      },
      updatedAt: {
        type: 'date',
      },
      
      // 全文搜索字段
      fullText: {
        type: 'text',
        analyzer: 'company_analyzer',
      },
    },
  },
};
