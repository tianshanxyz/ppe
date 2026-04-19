import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('quality_scores')
@Index(['resource_type', 'resource_id'])
@Index(['overall_score', 'created_at'])
export class QualityScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'resource_type', length: 100 })
  resourceType: string;

  @Column({ name: 'resource_id' })
  resourceId: string;

  @Column({ name: 'overall_score', type: 'decimal', precision: 5, scale: 2 })
  overallScore: number;

  @Column({ name: 'total_checks', default: 0 })
  totalChecks: number;

  @Column({ name: 'passed_checks', default: 0 })
  passedChecks: number;

  @Column({ name: 'failed_checks', default: 0 })
  failedChecks: number;

  @Column({ name: 'warning_checks', default: 0 })
  warningChecks: number;

  @Column({ name: 'critical_issues', default: 0 })
  criticalIssues: number;

  @Column({ name: 'high_issues', default: 0 })
  highIssues: number;

  @Column({ name: 'medium_issues', default: 0 })
  mediumIssues: number;

  @Column({ name: 'low_issues', default: 0 })
  lowIssues: number;

  @Column({ type: 'jsonb', nullable: true })
  breakdown: Record<string, any>;

  @Column({ nullable: true })
  recommendations: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  toJSON() {
    return {
      id: this.id,
      resourceType: this.resourceType,
      resourceId: this.resourceId,
      overallScore: parseFloat(this.overallScore as unknown as string),
      totalChecks: this.totalChecks,
      passedChecks: this.passedChecks,
      failedChecks: this.failedChecks,
      warningChecks: this.warningChecks,
      criticalIssues: this.criticalIssues,
      highIssues: this.highIssues,
      mediumIssues: this.mediumIssues,
      lowIssues: this.lowIssues,
      breakdown: this.breakdown,
      recommendations: this.recommendations,
      createdAt: this.createdAt,
    };
  }
}
