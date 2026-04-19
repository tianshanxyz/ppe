import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Ppe } from '../ppe/ppe.entity';

export enum CompanyType {
  MANUFACTURER = 'manufacturer',
  DISTRIBUTOR = 'distributor',
  RETAILER = 'retailer',
  SERVICE = 'service',
  OTHER = 'other',
}

export enum CompanyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
}

@Entity('companies')
@Index(['credit_code'])
@Index(['province', 'city'])
@Index(['company_type', 'status'])
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, nullable: true })
  shortName: string;

  @Column({ length: 50, nullable: true })
  logo: string;

  @Column({ type: 'enum', enum: CompanyType, default: CompanyType.MANUFACTURER })
  companyType: CompanyType;

  @Column({ name: 'credit_code', length: 100 })
  creditCode: string;

  @Column({ name: 'legal_representative', length: 100, nullable: true })
  legalRepresentative: string;

  @Column({ name: 'registered_capital', type: 'decimal', precision: 15, scale: 2, nullable: true })
  registeredCapital: number;

  @Column({ name: 'registration_date', type: 'date', nullable: true })
  registrationDate: Date;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  province: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 200, nullable: true })
  district: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 255, nullable: true })
  website: string;

  @Column({ name: 'business_scope', type: 'text', nullable: true })
  businessScope: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: CompanyStatus, default: CompanyStatus.ACTIVE })
  status: CompanyStatus;

  @Column({ name: 'product_count', default: 0 })
  productCount: number;

  @Column({ name: 'quality_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  qualityScore: number;

  @Column({ name: 'certifications', type: 'jsonb', nullable: true })
  certifications: string[];

  @Column({ name: 'licenses', type: 'jsonb', nullable: true })
  licenses: Record<string, any>[];

  @Column({ nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Ppe, ppe => ppe.manufacturer)
  products: Ppe[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      shortName: this.shortName,
      logo: this.logo,
      companyType: this.companyType,
      creditCode: this.creditCode,
      legalRepresentative: this.legalRepresentative,
      registeredCapital: parseFloat(this.registeredCapital as unknown as string),
      registrationDate: this.registrationDate,
      address: this.address,
      province: this.province,
      city: this.city,
      district: this.district,
      phone: this.phone,
      email: this.email,
      website: this.website,
      businessScope: this.businessScope,
      description: this.description,
      status: this.status,
      productCount: this.productCount,
      qualityScore: parseFloat(this.qualityScore as unknown as string),
      certifications: this.certifications,
      licenses: this.licenses,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
