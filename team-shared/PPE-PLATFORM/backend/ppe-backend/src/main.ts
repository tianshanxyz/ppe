import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `${timestamp} [${context}] ${level}: ${message}`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  });

  const configService = app.get(ConfigService);

  // 全局前缀
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // 启用 CORS
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';
  
  let allowedOrigins: (string | RegExp)[];
  
  if (isProduction) {
    // 生产环境：必须配置具体的域名白名单
    const envOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    if (envOrigins.length === 0) {
      console.warn('⚠️  警告：生产环境未配置 ALLOWED_ORIGINS，CORS 将被限制');
      allowedOrigins = []; // 默认不允许任何来源
    } else {
      allowedOrigins = envOrigins.map(origin => origin.trim());
    }
  } else {
    // 开发环境：更宽松，可以允许 localhost
    const envOrigins = process.env.ALLOWED_ORIGINS?.split(',');
    allowedOrigins = envOrigins 
      ? envOrigins.map(origin => origin.trim())
      : [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/];
  }
  
  app.enableCors({
    origin: (origin, callback) => {
      // 允许没有 origin 的请求（如 Postman 等工具）
      if (!origin) return callback(null, true);
      
      // 检查是否在允许列表中
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') return origin === allowed;
        if (allowed instanceof RegExp) return allowed.test(origin);
        return false;
      });
      
      if (isAllowed || !isProduction) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger 文档
  if (configService.get<boolean>('SWAGGER_ENABLED', true)) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('PPE Platform API')
      .setDescription('全球 PPE 数据平台后端 API 文档')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('ppe', 'PPE 数据相关接口')
      .addTag('auth', '认证相关接口')
      .addTag('users', '用户管理接口')
      .addTag('regulations', '法规数据接口')
      .addTag('companies', '企业数据接口')
      .addTag('alerts', '预警系统接口')
      .build();

    const swaggerPath = configService.get<string>('SWAGGER_PATH', '/api/docs');
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(swaggerPath.replace(/^\//, ''), app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    console.log(`Swagger documentation available at http://localhost:${configService.get('PORT', 3000)}${swaggerPath}`);
  }

  // Prometheus 指标
  if (configService.get<boolean>('METRICS_ENABLED', true)) {
    const metricsPath = configService.get<string>('METRICS_PATH', '/metrics');
    // Prometheus 指标端点将在 metrics 模块中配置
    console.log(`Metrics endpoint available at http://localhost:${configService.get('PORT', 3000)}${metricsPath}`);
  }

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Environment: ${configService.get('NODE_ENV', 'development')}`);
}

bootstrap();
