import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityRule } from './quality-rule.entity';
import { QualityCheckResult } from './quality-check-result.entity';
import { QualityScore } from './quality-score.entity';
import { QualityService } from './quality.service';
import { QualityController } from './quality.controller';

@Module({
  imports: [TypeOrmModule.forFeature([
    QualityRule,
    QualityCheckResult,
    QualityScore,
  ])],
  controllers: [QualityController],
  providers: [QualityService],
  exports: [QualityService],
})
export class QualityModule {}
