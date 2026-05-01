'use client'

import { useState, useMemo } from 'react'
import {
  BookOpen,
  ExternalLink,
  Globe,
  Shield,
  FileText,
  CheckCircle,
  Download,
  ChevronRight,
  Clock,
  DollarSign,
  AlertCircle,
  ArrowRight,
  FileCheck,
  Building2,
  Users,
  HelpCircle,
  Search,
  X,
  Filter,
  MapPin,
  Tag,
  BarChart3,
  Layers
} from 'lucide-react'
import { Button } from '@/components/ui'

// Market definitions with flags and labels
const MARKETS = [
  { id: 'EU', label: 'European Union', flag: '🇪🇺' },
  { id: 'US', label: 'United States', flag: '🇺🇸' },
  { id: 'CN', label: 'China', flag: '🇨🇳' },
  { id: 'UK', label: 'United Kingdom', flag: '🇬🇧' },
  { id: 'AU', label: 'Australia', flag: '🇦🇺' },
  { id: 'JP', label: 'Japan', flag: '🇯🇵' },
  { id: 'CA', label: 'Canada', flag: '🇨🇦' },
  { id: 'Global', label: 'Global', flag: '🌍' },
] as const

// Category definitions
const CATEGORIES = [
  { id: 'Respiratory Protection', label: 'Respiratory Protection', icon: '😷' },
  { id: 'Eye Protection', label: 'Eye Protection', icon: '🥽' },
  { id: 'Hand Protection', label: 'Hand Protection', icon: '🧤' },
  { id: 'Body Protection', label: 'Body Protection', icon: '🦺' },
  { id: 'Foot Protection', label: 'Foot Protection', icon: '🥾' },
  { id: 'Head Protection', label: 'Head Protection', icon: '⛑️' },
  { id: 'General PPE', label: 'General PPE', icon: '🛡️' },
  { id: 'Regulatory Framework', label: 'Regulatory Framework', icon: '📋' },
] as const

// Regulation data type
interface RegulationDoc {
  name: string
  type: string
  size: string
  url: string
}

interface Regulation {
  id: string
  title: string
  description: string
  market: string
  flag: string
  category: string
  effectiveDate: string
  status: 'Active' | 'Draft' | 'Under Review' | 'Amended'
  keyPoints: string[]
  documents: RegulationDoc[]
  relatedStandards: string[]
  certificationBodies: string[]
  scope: string
  estimatedCost: string
  estimatedTime: string
  difficulty: 'Low' | 'Medium' | 'High' | 'Very High'
}

// Comprehensive PPE Regulations Database
const REGULATIONS: Regulation[] = [
  // ===== EU Regulations =====
  {
    id: 'eu-2016-425',
    title: 'EU Regulation 2016/425 (PPE Regulation)',
    market: 'EU',
    flag: '🇪🇺',
    category: 'Regulatory Framework',
    description: 'The cornerstone EU regulation on personal protective equipment, replacing Directive 89/686/EEC. Covers the design, manufacture, and marketing of PPE in the EU market with enhanced conformity assessment procedures.',
    effectiveDate: '2018-04-21',
    status: 'Active',
    scope: 'All PPE products placed on the EU market',
    keyPoints: [
      'PPE divided into three categories based on risk level (I, II, III)',
      'Category II and III require Notified Body involvement for conformity assessment',
      'Module B (EU Type Examination) required for Category II and III',
      'Module B + C2 (Conformity to type based on internal production plus supervised checks) or Module D (Quality assurance of the production process) for Category III',
      'CE marking mandatory for all PPE categories before placing on the market',
      'EU Declaration of Conformity must be drawn up for all PPE',
      'Technical documentation must be kept available for 10 years',
      'Ongoing conformity assurance required for Category III PPE'
    ],
    documents: [
      { name: 'Full Regulation Text (EU 2016/425)', type: 'DOC', size: '1.2 MB', url: '#' },
      { name: 'Guidance Document on PPE Regulation', type: 'DOC', size: '2.4 MB', url: '#' },
      { name: 'FAQ on PPE Classification', type: 'DOC', size: '856 KB', url: '#' },
      { name: 'Notified Bodies List', type: 'DOC', size: '432 KB', url: '#' }
    ],
    relatedStandards: ['EN ISO 13688', 'EN 149', 'EN 14683', 'EN 14126', 'EN 388', 'EN 166'],
    certificationBodies: ['BSI', 'SGS', 'TUV SUD', 'DEKRA', 'TUV Rheinland', 'Intertek'],
    estimatedCost: '€5,000 - €50,000',
    estimatedTime: '3-6 months',
    difficulty: 'High'
  },
  {
    id: 'en-149-2001',
    title: 'EN 149:2001+A1:2009 (Respiratory Protective Devices)',
    market: 'EU',
    flag: '🇪🇺',
    category: 'Respiratory Protection',
    description: 'European standard for filtering half masks used as respiratory protective devices against particles. Defines performance requirements for FFP1, FFP2, and FFP3 class filtering facepieces.',
    effectiveDate: '2009-09-01',
    status: 'Active',
    scope: 'Filtering facepiece respirators (FFP1, FFP2, FFP3)',
    keyPoints: [
      'Three protection classes: FFP1 (80% minimum filtration), FFP2 (94%), FFP3 (99%)',
      'Total inward leakage (TIL) requirements for each class',
      'Breathing resistance limits during inhalation and exhalation',
      'Dolomite dust clogging test for optional "D" marking',
      'Marking requirements include NR (non-reusable) or R (reusable) designation',
      'Valve leakage test for respirators with exhalation valves',
      'Flammability test requirements',
      'Carbon dioxide content of inhalation air must not exceed 1%'
    ],
    documents: [
      { name: 'EN 149:2001+A1:2009 Standard', type: 'DOC', size: '4.2 MB', url: '#' },
      { name: 'Test Methods Guide for FFP Respirators', type: 'DOC', size: '1.5 MB', url: '#' },
      { name: 'Marking and Labeling Requirements', type: 'DOC', size: '678 KB', url: '#' }
    ],
    relatedStandards: ['EN 132', 'EN 143', 'EN 529', 'EN 14683', 'ISO 16900'],
    certificationBodies: ['BSI', 'SGS', 'TUV SUD', 'DEKRA'],
    estimatedCost: '€2,000 - €10,000',
    estimatedTime: '4-8 weeks',
    difficulty: 'Medium'
  },
  {
    id: 'en-166-2001',
    title: 'EN 166:2001 (Personal Eye Protection)',
    market: 'EU',
    flag: '🇪🇺',
    category: 'Eye Protection',
    description: 'European standard specifying the general requirements for personal eye protection equipment. Covers optical and mechanical requirements, testing methods, and marking requirements for all types of eye protectors.',
    effectiveDate: '2001-12-19',
    status: 'Active',
    scope: 'All types of personal eye protection equipment',
    keyPoints: [
      'Defines optical class (1, 2, 3) based on refractive power tolerance',
      'Mechanical strength categories: S (increased), F (low energy impact), B (medium energy impact), A (high energy impact)',
      'Field of vision requirements minimum 120 degrees horizontal',
      'Resistance to ignition and corrosion requirements',
      'Stability to UV radiation testing required',
      'Protection against droplets and splashes of liquids',
      'Protection against large dust particles and gas/fine dust',
      'Marking must include manufacturer, optical class, mechanical strength, and specific use symbols'
    ],
    documents: [
      { name: 'EN 166:2001 Standard', type: 'DOC', size: '3.8 MB', url: '#' },
      { name: 'Eye Protection Testing Guide', type: 'DOC', size: '1.2 MB', url: '#' },
      { name: 'Marking Requirements for Eye Protection', type: 'DOC', size: '534 KB', url: '#' }
    ],
    relatedStandards: ['EN 167', 'EN 168', 'EN 169', 'EN 170', 'EN 171', 'EN 172', 'EN 175'],
    certificationBodies: ['BSI', 'SGS', 'TUV SUD', 'DEKRA', 'Intertek'],
    estimatedCost: '€2,000 - €8,000',
    estimatedTime: '4-6 weeks',
    difficulty: 'Medium'
  },
  {
    id: 'en-388-2016',
    title: 'EN 388:2016+A1:2018 (Protective Gloves)',
    market: 'EU',
    flag: '🇪🇺',
    category: 'Hand Protection',
    description: 'European standard specifying the requirements, test methods, marking, and information to be supplied for protective gloves against mechanical risks including abrasion, blade cut, tear, puncture, and impact.',
    effectiveDate: '2018-11-14',
    status: 'Active',
    scope: 'Protective gloves against mechanical risks',
    keyPoints: [
      'Performance levels for abrasion resistance (0-4)',
      'Blade cut resistance measured by Coupe test (0-5)',
      'Tear resistance performance levels (0-4)',
      'Puncture resistance performance levels (0-4)',
      'Optional TDM-100 test for cut resistance (A-F) per ISO 13997',
      'Optional impact protection test (P or no marking)',
      'Pictogram marking showing all performance levels',
      'A1:2018 amendment clarifies cut testing methodology'
    ],
    documents: [
      { name: 'EN 388:2016+A1:2018 Standard', type: 'DOC', size: '3.5 MB', url: '#' },
      { name: 'Glove Testing Methods Guide', type: 'DOC', size: '1.8 MB', url: '#' },
      { name: 'Cut Resistance Testing Comparison', type: 'DOC', size: '945 KB', url: '#' }
    ],
    relatedStandards: ['EN 420', 'EN 374', 'EN 407', 'EN 511', 'ISO 13997', 'ASTM F2992'],
    certificationBodies: ['BSI', 'SGS', 'TUV SUD', 'SATRA', 'CTC'],
    estimatedCost: '€2,000 - €8,000',
    estimatedTime: '4-6 weeks',
    difficulty: 'Medium'
  },
  {
    id: 'en-13688-2013',
    title: 'EN 13688:2013 (Protective Clothing - General Requirements)',
    market: 'EU',
    flag: '🇪🇺',
    category: 'Body Protection',
    description: 'European standard specifying the general performance requirements for ergonomics, innocuousness, sizing designation, ageing, compatibility, and marking of protective clothing. Serves as the baseline standard referenced by all specific protective clothing standards.',
    effectiveDate: '2013-09-01',
    status: 'Active',
    scope: 'All protective clothing products',
    keyPoints: [
      'General ergonomic requirements including comfort and mobility',
      'Innocuousness requirements ensuring no harmful substances in contact with skin',
      'Sizing designation based on body measurements',
      'Ageing requirements for material durability over time',
      'Compatibility requirements when multiple PPE items are worn together',
      'Marking and manufacturer information requirements',
      'User information must be provided in official language(s) of the country of sale',
      'Serves as reference standard for all specific protective clothing standards'
    ],
    documents: [
      { name: 'EN 13688:2013 Standard', type: 'DOC', size: '2.8 MB', url: '#' },
      { name: 'Protective Clothing Sizing Guide', type: 'DOC', size: '1.1 MB', url: '#' },
      { name: 'Material Safety Requirements', type: 'DOC', size: '756 KB', url: '#' }
    ],
    relatedStandards: ['EN 340', 'EN ISO 13688', 'EN 14126', 'EN 1073', 'EN 469', 'EN 13034'],
    certificationBodies: ['BSI', 'SGS', 'TUV SUD', 'DEKRA', 'Intertek'],
    estimatedCost: '€1,500 - €6,000',
    estimatedTime: '3-6 weeks',
    difficulty: 'Low'
  },
  {
    id: 'en-1073-2-2002',
    title: 'EN 1073-2:2002 (Protective Clothing against Radioactive Contamination)',
    market: 'EU',
    flag: '🇪🇺',
    category: 'Body Protection',
    description: 'European standard for protective clothing providing protection against radioactive contamination. Covers requirements and test methods for both ventilated and non-ventilated protective clothing against particulate radioactive contamination.',
    effectiveDate: '2002-07-01',
    status: 'Active',
    scope: 'Protective clothing against particulate radioactive contamination',
    keyPoints: [
      'Classification into ventilated and non-ventilated types',
      'Inward leakage test requirements for full protective suits',
      'Resistance to penetration by liquid aerosols and liquids',
      'Resistance to penetration by solid particles',
      'Seam strength and material mechanical properties',
      'Decontamination efficiency requirements',
      'Leak-tightness test for ventilated suits',
      'Marking must indicate type of protection and performance class'
    ],
    documents: [
      { name: 'EN 1073-2:2002 Standard', type: 'DOC', size: '3.1 MB', url: '#' },
      { name: 'Radioactive Protection Testing Guide', type: 'DOC', size: '1.4 MB', url: '#' }
    ],
    relatedStandards: ['EN 1073-1', 'EN 14126', 'EN 13688', 'ISO 14120'],
    certificationBodies: ['BSI', 'SGS', 'TUV SUD'],
    estimatedCost: '€5,000 - €20,000',
    estimatedTime: '6-10 weeks',
    difficulty: 'High'
  },
  {
    id: 'en-14387-2004',
    title: 'EN 14387:2004+A1:2008 (Gas Filters and Combined Filters)',
    market: 'EU',
    flag: '🇪🇺',
    category: 'Respiratory Protection',
    description: 'European standard specifying the requirements, testing, and marking of gas filters and combined filters for use in respiratory protective devices. Covers filter types, classes, and performance requirements.',
    effectiveDate: '2008-05-01',
    status: 'Active',
    scope: 'Gas filters and combined gas/particulate filters for respiratory protection',
    keyPoints: [
      'Gas filter types: A (organic gases), B (inorganic gases), E (acid gases), K (ammonia), AX (low boiling point), SX (specific named gases)',
      'Filter classes: Class 1 (low capacity), Class 2 (medium capacity), Class 3 (high capacity)',
      'Combined filters include particulate filter element (P1, P2, P3)',
      'Breathing resistance limits for each filter class',
      'Gas breakthrough test requirements with specific test agents',
      'Shelf life and service time requirements',
      'Color coding system for filter identification (brown, grey, yellow, green)',
      'A1:2008 amendment updates test methods and requirements'
    ],
    documents: [
      { name: 'EN 14387:2004+A1:2008 Standard', type: 'DOC', size: '3.6 MB', url: '#' },
      { name: 'Gas Filter Selection Guide', type: 'DOC', size: '1.2 MB', url: '#' },
      { name: 'Filter Color Coding Reference', type: 'DOC', size: '423 KB', url: '#' }
    ],
    relatedStandards: ['EN 143', 'EN 149', 'EN 132', 'EN 529', 'EN 12941', 'EN 12942'],
    certificationBodies: ['BSI', 'SGS', 'TUV SUD', 'DEKRA'],
    estimatedCost: '€3,000 - €12,000',
    estimatedTime: '6-8 weeks',
    difficulty: 'High'
  },
  {
    id: 'en-iso-20345-2022',
    title: 'EN ISO 20345:2022 (Safety Footwear)',
    market: 'EU',
    flag: '🇪🇺',
    category: 'Foot Protection',
    description: 'European/International standard specifying the fundamental and additional requirements for safety footwear used for general purposes. Includes mechanical risks, slip resistance, thermal risks, and ergonomic requirements.',
    effectiveDate: '2022-10-01',
    status: 'Active',
    scope: 'Safety footwear for professional use with toecap protection',
    keyPoints: [
      'Safety toecap providing impact resistance up to 200J and compression resistance to 15kN',
      'Basic requirements (SB) and additional requirements (S1, S2, S3, S4, S5)',
      'S1: closed seat region + antistatic + energy absorption of seat region',
      'S2: S1 + water penetration and absorption resistance',
      'S3: S2 + cleated outsole + puncture resistance',
      'S4/S5: all-rubber/all-polymer footwear equivalent to S1/S3',
      'Slip resistance classification (SRA, SRB, SRC)',
      'Optional requirements including metatarsal protection, conductivity, insulation against cold/heat'
    ],
    documents: [
      { name: 'EN ISO 20345:2022 Standard', type: 'DOC', size: '5.1 MB', url: '#' },
      { name: 'Footwear Classification Guide', type: 'DOC', size: '1.6 MB', url: '#' },
      { name: 'Slip Resistance Testing Methods', type: 'DOC', size: '987 KB', url: '#' }
    ],
    relatedStandards: ['EN ISO 20346', 'EN ISO 20347', 'EN ISO 20344', 'ASTM F2413'],
    certificationBodies: ['BSI', 'SGS', 'SATRA', 'PFI', 'CTC'],
    estimatedCost: '€2,500 - €10,000',
    estimatedTime: '4-8 weeks',
    difficulty: 'Medium'
  },

  // ===== US Regulations =====
  {
    id: '42-cfr-84',
    title: '42 CFR Part 84 (NIOSH Respirator Certification)',
    market: 'US',
    flag: '🇺🇸',
    category: 'Respiratory Protection',
    description: 'Federal regulation establishing the certification requirements for respiratory protective devices by the National Institute for Occupational Safety and Health (NIOSH). Defines the nine classes of filters and the testing procedures for air-purifying respirators.',
    effectiveDate: '1995-07-10',
    status: 'Active',
    scope: 'All respiratory protective devices for occupational use in the US',
    keyPoints: [
      'Nine classes of filters: three efficiency levels (95, 99, 100) x three series (N, R, P)',
      'N-series: Not resistant to oil (N95, N99, N100)',
      'R-series: Resistant to oil (R95, R99, R100)',
      'P-series: Oil-proof (P95, P99, P100)',
      'Filter efficiency testing using 0.3 micron sodium chloride or dioctyl phthalate aerosol',
      'Breathing resistance requirements during inhalation and exhalation',
      'Fit testing requirements for tight-fitting respirators',
      'Approval label and marking requirements including TC number'
    ],
    documents: [
      { name: '42 CFR Part 84 Full Text', type: 'DOC', size: '2.8 MB', url: '#' },
      { name: 'NIOSH Respirator Certification Guide', type: 'DOC', size: '1.9 MB', url: '#' },
      { name: 'Filter Classification Reference', type: 'DOC', size: '567 KB', url: '#' },
      { name: 'Application Instructions for NIOSH Approval', type: 'DOC', size: '1.3 MB', url: '#' }
    ],
    relatedStandards: ['ASTM F2100', 'FDA 510(k)', 'OSHA 29 CFR 1910.134', 'ANSI Z88.2'],
    certificationBodies: ['NIOSH NPPTL', 'FDA CDRH'],
    estimatedCost: '$5,000 - $30,000',
    estimatedTime: '3-6 months',
    difficulty: 'High'
  },
  {
    id: 'fda-510k-surgical-masks',
    title: 'FDA 510(k) Requirements for Surgical Masks',
    market: 'US',
    flag: '🇺🇸',
    category: 'Respiratory Protection',
    description: 'FDA premarket notification requirements specifically for surgical masks classified as Class II medical devices. Requires demonstration of substantial equivalence to a legally marketed predicate device.',
    effectiveDate: 'Ongoing',
    status: 'Active',
    scope: 'Surgical masks and surgical respirators for US market',
    keyPoints: [
      'Surgical masks are Class II medical devices under 21 CFR 878.4040',
      'Substantial equivalence to a legally marketed predicate device required',
      'Performance testing per ASTM F2100 (Level 1, 2, or 3 barrier performance)',
      'Fluid resistance testing per ASTM F1862 at specified pressures',
      'Biocompatibility evaluation per ISO 10993 series',
      'Bacterial filtration efficiency (BFE) and particulate filtration efficiency (PFE) testing',
      'Quality System Regulation (21 CFR Part 820) compliance required',
      '510(k) summary or statement must be submitted to FDA'
    ],
    documents: [
      { name: 'FDA 510(k) Submission Guidance', type: 'DOC', size: '1.8 MB', url: '#' },
      { name: 'Surgical Mask Guidance Document', type: 'DOC', size: '2.1 MB', url: '#' },
      { name: '21 CFR Part 820 (QSR)', type: 'DOC', size: '3.1 MB', url: '#' },
      { name: 'Refuse to Accept Checklist', type: 'DOC', size: '289 KB', url: '#' }
    ],
    relatedStandards: ['ASTM F2100', 'ASTM F1862', 'ASTM F2101', 'ISO 10993', '21 CFR 820'],
    certificationBodies: ['FDA CDRH'],
    estimatedCost: '$10,000 - $100,000',
    estimatedTime: '3-12 months',
    difficulty: 'High'
  },
  {
    id: 'fda-niosh-respirators-guidance',
    title: 'FDA Guidance on NIOSH-Approved Respirators',
    market: 'US',
    flag: '🇺🇸',
    category: 'Respiratory Protection',
    description: 'FDA guidance on the regulatory requirements for NIOSH-approved respirators, including the transition of surgical respirators from FDA oversight to NIOSH primary regulation under the MDRU framework.',
    effectiveDate: '2022-12-01',
    status: 'Active',
    scope: 'NIOSH-approved respirators for medical use in the US',
    keyPoints: [
      'Surgical N95 respirators require both NIOSH approval and FDA 510(k) clearance',
      'Medical Device Reporting (MDR) requirements apply to surgical respirators',
      'FDA has transitioned oversight of most respirators to NIOSH',
      'NIOSH-approved respirators no longer require separate FDA authorization for medical use',
      'Manufacturers must comply with NIOSH quality and testing requirements',
      'Labeling must include NIOSH approval number (TC-84A-XXXX)',
      'Fit testing requirements per OSHA 29 CFR 1910.134',
      'Counterfeit respirator identification and reporting guidance'
    ],
    documents: [
      { name: 'FDA NIOSH Respirator Guidance', type: 'DOC', size: '1.5 MB', url: '#' },
      { name: 'NIOSH Approved Respirators List', type: 'DOC', size: '2.3 MB', url: '#' },
      { name: 'Counterfeit Detection Guide', type: 'DOC', size: '876 KB', url: '#' }
    ],
    relatedStandards: ['42 CFR 84', 'ASTM F2100', 'OSHA 29 CFR 1910.134', '21 CFR 820'],
    certificationBodies: ['NIOSH NPPTL', 'FDA CDRH'],
    estimatedCost: '$5,000 - $50,000',
    estimatedTime: '3-9 months',
    difficulty: 'High'
  },
  {
    id: 'osha-29-cfr-1910-132',
    title: 'OSHA 29 CFR 1910.132 (PPE Requirements)',
    market: 'US',
    flag: '🇺🇸',
    category: 'Regulatory Framework',
    description: 'OSHA general requirements for personal protective equipment in the workplace. Establishes employer obligations for hazard assessment, PPE selection, training, and recordkeeping for worker safety.',
    effectiveDate: '1994-07-05',
    status: 'Active',
    scope: 'All workplaces under OSHA jurisdiction requiring PPE for worker safety',
    keyPoints: [
      'Employers must conduct workplace hazard assessment to determine PPE needs',
      'Written certification of hazard assessment required',
      'PPE must be provided, used, and maintained in sanitary and reliable condition',
      'Employee training on PPE use, care, and limitations required',
      'Training must be documented with certification records',
      'Defective or damaged PPE must not be used',
      'Employer must retrain employees when PPE requirements change',
      'Specific PPE standards for eye/face, head, foot, and hand protection referenced'
    ],
    documents: [
      { name: '29 CFR 1910.132 Full Text', type: 'DOC', size: '1.4 MB', url: '#' },
      { name: 'Hazard Assessment Guide', type: 'DOC', size: '2.2 MB', url: '#' },
      { name: 'PPE Training Requirements', type: 'DOC', size: '987 KB', url: '#' }
    ],
    relatedStandards: ['29 CFR 1910.133', '29 CFR 1910.135', '29 CFR 1910.136', '29 CFR 1910.138', 'ANSI Z87.1', 'ANSI Z89.1'],
    certificationBodies: ['OSHA'],
    estimatedCost: '$1,000 - $10,000',
    estimatedTime: '2-4 weeks',
    difficulty: 'Low'
  },
  {
    id: 'astm-f2100',
    title: 'ASTM F2100 (Medical Face Masks)',
    market: 'US',
    flag: '🇺🇸',
    category: 'Respiratory Protection',
    description: 'ASTM standard specification for performance of materials used in medical face masks. Establishes bacterial filtration efficiency, particulate filtration efficiency, fluid resistance, breathability, and flammability requirements.',
    effectiveDate: '2024-03-01',
    status: 'Active',
    scope: 'Materials used in medical face masks',
    keyPoints: [
      'Three performance levels: Level 1 (low barrier), Level 2 (moderate barrier), Level 3 (high barrier)',
      'Bacterial Filtration Efficiency (BFE) minimum 95% for Level 1, 98% for Level 2 and 3',
      'Sub-micron Particulate Filtration Efficiency (PFE) minimum 95% at 0.1 micron',
      'Fluid resistance: Level 1 (80 mmHg), Level 2 (120 mmHg), Level 3 (160 mmHg)',
      'Differential pressure (breathability): < 4.0 mm H2O/cm2 for Level 1, < 5.0 for Level 2/3',
      'Flammability: Class 1 (normal flammability) per 16 CFR Part 1610',
      'Testing must be performed on finished product or representative samples',
      'Labeling must indicate performance level and test methods used'
    ],
    documents: [
      { name: 'ASTM F2100 Standard', type: 'DOC', size: '1.9 MB', url: '#' },
      { name: 'Mask Testing Protocol Guide', type: 'DOC', size: '1.1 MB', url: '#' },
      { name: 'Performance Level Comparison Chart', type: 'DOC', size: '345 KB', url: '#' }
    ],
    relatedStandards: ['ASTM F1862', 'ASTM F2101', 'ASTM F2299', 'FDA 510(k)'],
    certificationBodies: ['FDA', 'Nelson Labs', 'ITS', 'SGS'],
    estimatedCost: '$3,000 - $15,000',
    estimatedTime: '2-4 weeks',
    difficulty: 'Medium'
  },
  {
    id: 'ansi-z87-1',
    title: 'ANSI Z87.1 (Eye and Face Protection)',
    market: 'US',
    flag: '🇺🇸',
    category: 'Eye Protection',
    description: 'American National Standard for occupational and educational personal eye and face protection devices. Establishes performance criteria and testing requirements for various types of eye and face protectors.',
    effectiveDate: '2020-01-01',
    status: 'Active',
    scope: 'Occupational and educational eye and face protection devices',
    keyPoints: [
      'Classifies protectors by hazard type: impact, radiation, splash, dust',
      'Impact-rated protectors must pass high-velocity and high-mass impact tests',
      'Basic impact vs. high impact classification',
      'Prescription lens requirements for impact-rated protectors',
      'UV protection requirements with specific transmittance limits',
      'Infrared and visible light filtration requirements for welding and related processes',
      'Lens thickness and optical quality requirements',
      'Marking must include Z87 or Z87+ for impact-rated devices'
    ],
    documents: [
      { name: 'ANSI Z87.1-2020 Standard', type: 'DOC', size: '4.5 MB', url: '#' },
      { name: 'Eye Protection Selection Guide', type: 'DOC', size: '1.3 MB', url: '#' },
      { name: 'Impact Testing Requirements', type: 'DOC', size: '876 KB', url: '#' }
    ],
    relatedStandards: ['OSHA 29 CFR 1910.133', 'EN 166', 'EN 167', 'CSA Z94.3', 'AS/NZS 1337'],
    certificationBodies: ['ANSI', 'OSHA', 'SEI', 'UL'],
    estimatedCost: '$2,000 - $10,000',
    estimatedTime: '3-6 weeks',
    difficulty: 'Medium'
  },

  // ===== China Regulations =====
  {
    id: 'gb-2626-2019',
    title: 'GB 2626-2019 (Respiratory Protective Equipment)',
    market: 'CN',
    flag: '🇨🇳',
    category: 'Respiratory Protection',
    description: 'Chinese mandatory national standard for respiratory protective equipment - non-powered air-purifying particle respirators. Specifies classification, technical requirements, test methods, and marking for filtering half masks.',
    effectiveDate: '2020-07-01',
    status: 'Active',
    scope: 'Non-powered air-purifying particle respirators (KN/KP series)',
    keyPoints: [
      'Two series: KN (non-oil resistant particles) and KP (oil-resistant particles)',
      'KN series classes: KN90 (90% efficiency), KN95 (95%), KN100 (99.97%)',
      'KP series classes: KP90 (90% efficiency), KP95 (95%), KP100 (99.97%)',
      'Total inward leakage requirements for each class',
      'Inhalation and exhalation resistance limits',
      'Dead space carbon dioxide content must not exceed 1%',
      'Head harness strength and mask structural requirements',
      'Mandatory CCC certification required for production and sale'
    ],
    documents: [
      { name: 'GB 2626-2019 Standard (Chinese)', type: 'DOC', size: '3.8 MB', url: '#' },
      { name: 'GB 2626-2019 English Translation', type: 'DOC', size: '2.9 MB', url: '#' },
      { name: 'KN95 Testing Requirements', type: 'DOC', size: '1.2 MB', url: '#' },
      { name: 'CCC Certification Guide for Respirators', type: 'DOC', size: '1.5 MB', url: '#' }
    ],
    relatedStandards: ['GB/T 18664', 'GB 19083', 'YY 0469', 'YY/T 0969', 'GB/T 32610'],
    certificationBodies: ['NMPA', 'CNCA', 'CQC', 'CCIC'],
    estimatedCost: '¥20,000 - ¥100,000',
    estimatedTime: '3-6 months',
    difficulty: 'High'
  },
  {
    id: 'gb-14866-2006',
    title: 'GB 14866-2006 (Personal Eye Protection)',
    market: 'CN',
    flag: '🇨🇳',
    category: 'Eye Protection',
    description: 'Chinese mandatory national standard for personal eye and face protectors. Specifies classification, technical requirements, test methods, and marking for eye and face protection equipment.',
    effectiveDate: '2007-04-01',
    status: 'Active',
    scope: 'Personal eye and face protection equipment',
    keyPoints: [
      'Classification by protection type: welding, impact, chemical, dust, radiation',
      'Optical requirements including refractive power and prismatic power limits',
      'Impact resistance requirements for different protection levels',
      'UV and IR radiation transmittance limits',
      'Corrosion resistance for metal components',
      'Field of vision requirements',
      'Marking must include standard number, protection type, and manufacturer',
      'Mandatory production license required for manufacturing'
    ],
    documents: [
      { name: 'GB 14866-2006 Standard (Chinese)', type: 'DOC', size: '2.6 MB', url: '#' },
      { name: 'Eye Protection Testing Guide', type: 'DOC', size: '1.1 MB', url: '#' }
    ],
    relatedStandards: ['GB/T 3609.1', 'EN 166', 'ANSI Z87.1', 'JIS T 8147'],
    certificationBodies: ['NMPA', 'CNCA', 'CQC'],
    estimatedCost: '¥15,000 - ¥60,000',
    estimatedTime: '2-4 months',
    difficulty: 'Medium'
  },
  {
    id: 'gb-t-13640-2008',
    title: 'GB/T 13640-2008 (Protective Clothing)',
    market: 'CN',
    flag: '🇨🇳',
    category: 'Body Protection',
    description: 'Chinese national standard for protective clothing - general requirements. Specifies the classification, technical requirements, test methods, marking, and information for protective clothing.',
    effectiveDate: '2009-01-01',
    status: 'Active',
    scope: 'General requirements for all protective clothing',
    keyPoints: [
      'General requirements for protective clothing design and construction',
      'Material performance requirements including strength and durability',
      'Ergonomic and comfort requirements',
      'Sizing and fit requirements based on Chinese anthropometric data',
      'Water resistance and breathability requirements where applicable',
      'Flame resistance requirements for specific applications',
      'Marking and labeling requirements in Chinese',
      'User information must be provided in Chinese'
    ],
    documents: [
      { name: 'GB/T 13640-2008 Standard (Chinese)', type: 'DOC', size: '2.3 MB', url: '#' },
      { name: 'Protective Clothing Sizing Guide', type: 'DOC', size: '876 KB', url: '#' }
    ],
    relatedStandards: ['GB 19082', 'GB 24539', 'GB/T 13661', 'EN 13688', 'EN 14126'],
    certificationBodies: ['NMPA', 'CNCA', 'CQC'],
    estimatedCost: '¥10,000 - ¥50,000',
    estimatedTime: '2-4 months',
    difficulty: 'Medium'
  },
  {
    id: 'nmpa-ppe-registration',
    title: 'NMPA PPE Registration Requirements',
    market: 'CN',
    flag: '🇨🇳',
    category: 'Regulatory Framework',
    description: 'Registration requirements for PPE products under the supervision of the National Medical Products Administration (NMPA). Covers classification, registration procedures, technical requirements, and post-market surveillance.',
    effectiveDate: 'Ongoing',
    status: 'Active',
    scope: 'Medical device PPE products for China market',
    keyPoints: [
      'Class I: Filing management with local NMPA branch',
      'Class II: Registration certificate required with NMPA review',
      'Class III: Registration certificate + clinical trials often required',
      'Type testing at NMPA-accredited laboratories in China mandatory',
      'Quality system assessment (GMP inspection) for Class II and III',
      'Chinese labeling and instructions for use required',
      'Clinical evaluation or clinical trial data required for most PPE devices',
      'Domestic agent required for foreign manufacturers'
    ],
    documents: [
      { name: 'Medical Device Regulation (Chinese)', type: 'DOC', size: '2.1 MB', url: '#' },
      { name: 'Registration Guidance for PPE', type: 'DOC', size: '1.5 MB', url: '#' },
      { name: 'Classification Catalogue', type: 'DOC', size: '3.2 MB', url: '#' },
      { name: 'Clinical Evaluation Requirements', type: 'DOC', size: '1.8 MB', url: '#' }
    ],
    relatedStandards: ['GB 19083', 'YY 0469', 'GB 2626', 'GB/T 32610', 'GB 14866'],
    certificationBodies: ['NMPA', 'CMDCAS', 'CQC', 'CCIC'],
    estimatedCost: '¥50,000 - ¥500,000',
    estimatedTime: '6-18 months',
    difficulty: 'Very High'
  },
  {
    id: 'gb-21148-2020',
    title: 'GB 21148-2020 (Safety Footwear)',
    market: 'CN',
    flag: '🇨🇳',
    category: 'Foot Protection',
    description: 'Chinese mandatory national standard for safety footwear. Specifies classification, technical requirements, test methods, marking, and information for safety footwear with protective toecap.',
    effectiveDate: '2021-08-01',
    status: 'Active',
    scope: 'Safety footwear with protective toecap for occupational use',
    keyPoints: [
      'Safety toecap impact resistance up to 200J and compression resistance to 15kN',
      'Classification: An1 (basic), An2 (with additional features), An3 (full protection)',
      'Slip resistance requirements on ceramic and steel surfaces',
      'Antistatic requirements for specific work environments',
      'Puncture resistance for soles where specified',
      'Water resistance and insulation requirements',
      'Oil and fuel resistance for outsoles',
      'CCC certification required for production and sale in China'
    ],
    documents: [
      { name: 'GB 21148-2020 Standard (Chinese)', type: 'DOC', size: '4.1 MB', url: '#' },
      { name: 'Safety Footwear Testing Guide', type: 'DOC', size: '1.6 MB', url: '#' },
      { name: 'CCC Certification Requirements', type: 'DOC', size: '1.1 MB', url: '#' }
    ],
    relatedStandards: ['GB/T 20991', 'EN ISO 20345', 'ASTM F2413', 'AS/NZS 2210'],
    certificationBodies: ['CNCA', 'CQC', 'CCIC'],
    estimatedCost: '¥20,000 - ¥80,000',
    estimatedTime: '3-6 months',
    difficulty: 'High'
  },

  // ===== UK Regulations =====
  {
    id: 'ukca-marking',
    title: 'UKCA Marking Requirements for PPE',
    market: 'UK',
    flag: '🇬🇧',
    category: 'Regulatory Framework',
    description: 'UK Conformity Assessed marking requirements for PPE products placed on the Great Britain market post-Brexit. UKCA marking replaces CE marking for goods sold in England, Wales, and Scotland.',
    effectiveDate: '2021-01-01',
    status: 'Active',
    scope: 'PPE products for Great Britain (England, Wales, Scotland)',
    keyPoints: [
      'UKCA marking replaces CE marking for the GB market',
      'Northern Ireland continues to use CE marking (or UKNI marking)',
      'UK Approved Body required for Category II and III PPE conformity assessment',
      'UK Declaration of Conformity required for all PPE categories',
      'UK Responsible Person required for non-UK manufacturers',
      'Technical documentation must be available for UK market surveillance authorities',
      'Transition period allowed CE marking alongside UKCA until December 2024 (extended)',
      'UKCA marking must be affixed to product, packaging, or accompanying documents'
    ],
    documents: [
      { name: 'PPE Regulations 2018 (UK)', type: 'DOC', size: '1.8 MB', url: '#' },
      { name: 'UKCA Marking Guidance', type: 'DOC', size: '945 KB', url: '#' },
      { name: 'Approved Bodies List (UK)', type: 'DOC', size: '234 KB', url: '#' },
      { name: 'UK Responsible Person Requirements', type: 'DOC', size: '567 KB', url: '#' }
    ],
    relatedStandards: ['BS EN 149', 'BS EN 14683', 'BS EN 14126', 'BS EN 388', 'BS EN 166'],
    certificationBodies: ['BSI UK', 'SGS UK', 'TUV UK', 'Intertek UK'],
    estimatedCost: '£3,000 - £30,000',
    estimatedTime: '2-4 months',
    difficulty: 'Medium'
  },
  {
    id: 'uk-ppe-regulation-2016-425',
    title: 'UK PPE Regulation 2016/425 (Retained EU Law)',
    market: 'UK',
    flag: '🇬🇧',
    category: 'Regulatory Framework',
    description: 'The UK retained version of EU Regulation 2016/425 on personal protective equipment, as incorporated into UK law after Brexit. Maintains the same essential requirements but with UK-specific modifications.',
    effectiveDate: '2021-01-01',
    status: 'Active',
    scope: 'All PPE products placed on the UK market',
    keyPoints: [
      'Retained EU law with UK-specific modifications for the GB market',
      'Same three-category system (I, II, III) as EU regulation',
      'UK Approved Bodies replace EU Notified Bodies for GB market',
      'Module B + C2 or D conformity assessment for Category III',
      'UK Declaration of Conformity replaces EU Declaration',
      'References to EU standards replaced with designated UK standards (BS EN)',
      'Post-market surveillance requirements aligned with UK regulations',
      'Future divergence from EU regulation possible through UK statutory instruments'
    ],
    documents: [
      { name: 'UK PPE Regulation 2016/425 (Retained)', type: 'DOC', size: '1.9 MB', url: '#' },
      { name: 'UK vs EU Regulation Comparison', type: 'DOC', size: '1.2 MB', url: '#' },
      { name: 'Designated Standards List (UK)', type: 'DOC', size: '876 KB', url: '#' }
    ],
    relatedStandards: ['BS EN 149', 'BS EN 166', 'BS EN 388', 'BS EN 13688', 'BS EN ISO 20345'],
    certificationBodies: ['BSI UK', 'SGS UK', 'TUV UK', 'Intertek UK'],
    estimatedCost: '£3,000 - £25,000',
    estimatedTime: '2-4 months',
    difficulty: 'Medium'
  },
  {
    id: 'bs-en-149-uk',
    title: 'BS EN 149:2001+A1:2009 (UK Adopted Standard)',
    market: 'UK',
    flag: '🇬🇧',
    category: 'Respiratory Protection',
    description: 'UK adopted version of the European standard for filtering half masks. Identical technical content to EN 149 but designated as a UK standard for compliance with UK PPE regulations.',
    effectiveDate: '2009-09-01',
    status: 'Active',
    scope: 'Filtering facepiece respirators (FFP1, FFP2, FFP3) for UK market',
    keyPoints: [
      'Identical technical requirements to EN 149:2001+A1:2009',
      'FFP1, FFP2, FFP3 classification with same filtration efficiency requirements',
      'Total inward leakage and breathing resistance requirements unchanged',
      'Testing must be performed by UKAS-accredited or equivalent laboratories',
      'UKCA marking required alongside CE marking during transition',
      'UK Approved Body assessment required for UK market placement',
      'Dolomite dust clogging test (D marking) optional as per EN 149',
      'Marking must include UK Approved Body number for Category III'
    ],
    documents: [
      { name: 'BS EN 149:2001+A1:2009 Standard', type: 'DOC', size: '4.2 MB', url: '#' },
      { name: 'UK Respirator Testing Guide', type: 'DOC', size: '1.4 MB', url: '#' },
      { name: 'UKCA Marking for Respirators', type: 'DOC', size: '678 KB', url: '#' }
    ],
    relatedStandards: ['BS EN 143', 'BS EN 132', 'BS EN 529', 'EN 149', 'GB 2626'],
    certificationBodies: ['BSI UK', 'SGS UK', 'Intertek UK'],
    estimatedCost: '£2,000 - £8,000',
    estimatedTime: '4-8 weeks',
    difficulty: 'Medium'
  },

  // ===== Australia Regulations =====
  {
    id: 'as-nzs-1716-2012',
    title: 'AS/NZS 1716:2012 (Respiratory Protective Devices)',
    market: 'AU',
    flag: '🇦🇺',
    category: 'Respiratory Protection',
    description: 'Joint Australian/New Zealand standard specifying the requirements, testing, and marking of respiratory protective devices. Covers filtering facepiece respirators, gas filters, and combined filters.',
    effectiveDate: '2012-03-16',
    status: 'Active',
    scope: 'Respiratory protective devices for Australian and New Zealand markets',
    keyPoints: [
      'P1 class (80% minimum filtration), P2 class (94%), P3 class (99.95%)',
      'Gas filter types: AUS, A, B, E, G, and specialty types',
      'Filter classes based on capacity: Class 1, 2, 3 for gas filters',
      'Inhalation and exhalation resistance requirements',
      'Total inward leakage requirements for half and full face masks',
      'Fit testing requirements per AS/NZS 1715',
      'Marking requirements include class, type, and manufacturer information',
      'Must be listed on the ARTG (Australian Register of Therapeutic Goods) for medical use'
    ],
    documents: [
      { name: 'AS/NZS 1716:2012 Standard', type: 'DOC', size: '4.8 MB', url: '#' },
      { name: 'Respirator Selection Guide (AU/NZ)', type: 'DOC', size: '1.5 MB', url: '#' },
      { name: 'Fit Testing Requirements', type: 'DOC', size: '876 KB', url: '#' }
    ],
    relatedStandards: ['AS/NZS 1715', 'AS/NZS 1714', 'EN 149', 'GB 2626', '42 CFR 84'],
    certificationBodies: ['TGA', 'SAI Global', 'BSI ANZ', 'SGS ANZ'],
    estimatedCost: 'A$5,000 - A$30,000',
    estimatedTime: '3-6 months',
    difficulty: 'High'
  },
  {
    id: 'tga-ppe-registration',
    title: 'TGA PPE Registration Requirements',
    market: 'AU',
    flag: '🇦🇺',
    category: 'Regulatory Framework',
    description: 'Therapeutic Goods Administration requirements for registration of PPE products as medical devices in Australia. Covers classification, conformity assessment, and inclusion on the Australian Register of Therapeutic Goods (ARTG).',
    effectiveDate: 'Ongoing',
    status: 'Active',
    scope: 'Medical device PPE products for Australian market',
    keyPoints: [
      'PPE classified as Class I, Class IIa, or Class IIb medical devices depending on use',
      'Surgical masks classified as Class IIa medical devices',
      'Inclusion on the ARTG mandatory before supply in Australia',
      'Conformity assessment evidence required (EU or TGA assessment)',
      'Australian sponsor required for all overseas manufacturers',
      'Medical Device Incident Reporting (MDIR) obligations',
      'Advertising and labeling must comply with TG Act and Regulations',
      'Mutual recognition agreements with EU for conformity assessment'
    ],
    documents: [
      { name: 'TGA Medical Device Registration Guide', type: 'DOC', size: '2.3 MB', url: '#' },
      { name: 'ARTG Inclusion Requirements', type: 'DOC', size: '1.6 MB', url: '#' },
      { name: 'Sponsor Obligations Guide', type: 'DOC', size: '987 KB', url: '#' }
    ],
    relatedStandards: ['AS/NZS 1716', 'AS/NZS 4381', 'AS/NZS 1337', 'EN 14683'],
    certificationBodies: ['TGA', 'BSI ANZ', 'SAI Global', 'TUV SUD ANZ'],
    estimatedCost: 'A$10,000 - A$80,000',
    estimatedTime: '3-9 months',
    difficulty: 'High'
  },

  // ===== Japan Regulations =====
  {
    id: 'jis-t-8159-2018',
    title: 'JIS T 8159:2018 (Respiratory Protective Devices)',
    market: 'JP',
    flag: '🇯🇵',
    category: 'Respiratory Protection',
    description: 'Japanese Industrial Standard for respiratory protective devices - particulate respirators. Specifies requirements for disposable and reusable particulate filtering half masks used in occupational settings.',
    effectiveDate: '2018-03-20',
    status: 'Active',
    scope: 'Particulate filtering half masks for occupational use in Japan',
    keyPoints: [
      'Three protection classes: DS1 (80% filtration), DS2 (95%), DS3 (99.9%) for disposable',
      'Three protection classes: RS1, RS2, RS3 for reusable respirators',
      'Sodium chloride aerosol test method for filtration efficiency',
      'Inhalation and exhalation resistance requirements',
      'Total inward leakage test requirements',
      'Head harness strength and durability requirements',
      'Valve leakage test for respirators with exhalation valves',
      'Marking must include JIS mark, class, and manufacturer information'
    ],
    documents: [
      { name: 'JIS T 8159:2018 Standard (Japanese)', type: 'DOC', size: '3.5 MB', url: '#' },
      { name: 'JIS T 8159 English Summary', type: 'DOC', size: '1.2 MB', url: '#' },
      { name: 'Respirator Testing Protocol', type: 'DOC', size: '987 KB', url: '#' }
    ],
    relatedStandards: ['JIS T 8150', 'JIS T 8151', 'EN 149', 'GB 2626', '42 CFR 84'],
    certificationBodies: ['MHLW', 'JISC', 'JQA', 'TISS'],
    estimatedCost: '¥500,000 - ¥3,000,000',
    estimatedTime: '3-6 months',
    difficulty: 'High'
  },
  {
    id: 'pmd-act-ppe',
    title: 'PMD Act PPE Requirements',
    market: 'JP',
    flag: '🇯🇵',
    category: 'Regulatory Framework',
    description: 'Pharmaceutical and Medical Device Act requirements for PPE products classified as medical devices in Japan. Covers classification, registration, quality management, and post-market surveillance requirements.',
    effectiveDate: '2014-11-25',
    status: 'Active',
    scope: 'Medical device PPE products for Japanese market',
    keyPoints: [
      'PPE classified as Class I, II, III, or IV medical devices under PMD Act',
      'Class I: Notification to PMDA required (self-declaration)',
      'Class II: Third-party certification or PMDA approval required',
      'Class III/IV: PMDA approval mandatory with clinical data',
      'Marketing Authorization Holder (MAH) must be established in Japan',
      'Quality Management System (QMS) compliance per MHLW Ordinance 169',
      'Foreign manufacturer registration with PMDA required',
      'Japanese labeling and instructions for use mandatory'
    ],
    documents: [
      { name: 'PMD Act Overview (English)', type: 'DOC', size: '2.1 MB', url: '#' },
      { name: 'Medical Device Classification Guide', type: 'DOC', size: '1.8 MB', url: '#' },
      { name: 'MAH Requirements Guide', type: 'DOC', size: '1.3 MB', url: '#' },
      { name: 'QMS Ordinance 169 Summary', type: 'DOC', size: '1.5 MB', url: '#' }
    ],
    relatedStandards: ['JIS T 8159', 'JIS T 8062', 'JIS T 8115', 'ISO 13485'],
    certificationBodies: ['PMDA', 'MHLW', 'JQA', 'TISS', 'BSI Japan'],
    estimatedCost: '¥2,000,000 - ¥15,000,000',
    estimatedTime: '6-18 months',
    difficulty: 'Very High'
  },

  // ===== Canada Regulations =====
  {
    id: 'sor-2016-195',
    title: 'SOR/2016-195 (PPE Regulations)',
    market: 'CA',
    flag: '🇨🇦',
    category: 'Regulatory Framework',
    description: 'Canadian regulation under the Canada Consumer Product Safety Act establishing safety requirements for personal protective equipment. Covers design, manufacturing, testing, labeling, and sale of PPE in Canada.',
    effectiveDate: '2016-06-22',
    status: 'Active',
    scope: 'PPE products sold in Canada',
    keyPoints: [
      'General safety requirements for all PPE sold in Canada',
      'PPE must not pose a risk to health or safety when used as intended',
      'Testing and certification to applicable Canadian or international standards',
      'Labeling requirements in both English and French',
      'Manufacturer must maintain technical documentation',
      'Product must bear the name and address of the manufacturer or importer',
      'Recall and incident reporting obligations',
      'Provincial occupational health and safety regulations may impose additional requirements'
    ],
    documents: [
      { name: 'SOR/2016-195 Full Text', type: 'DOC', size: '1.6 MB', url: '#' },
      { name: 'PPE Safety Requirements Guide', type: 'DOC', size: '1.2 MB', url: '#' },
      { name: 'Labeling Requirements (EN/FR)', type: 'DOC', size: '567 KB', url: '#' }
    ],
    relatedStandards: ['CSA Z94.3', 'CSA Z195', 'CAN/CSA Z94.1', 'AS/NZS 1716', 'EN 149'],
    certificationBodies: ['Health Canada', 'SCC', 'CSA Group', 'ULC'],
    estimatedCost: 'C$3,000 - C$25,000',
    estimatedTime: '2-6 months',
    difficulty: 'Medium'
  },
  {
    id: 'health-canada-medical-device',
    title: 'Health Canada Medical Device Requirements',
    market: 'CA',
    flag: '🇨🇦',
    category: 'Regulatory Framework',
    description: 'Health Canada requirements for PPE products classified as medical devices under the Medical Devices Regulations (SOR/98-282). Covers classification, licensing, quality systems, and post-market surveillance.',
    effectiveDate: 'Ongoing',
    status: 'Active',
    scope: 'Medical device PPE products for Canadian market',
    keyPoints: [
      'PPE classified as Class I, II, III, or IV medical devices',
      'Medical face masks: Class II requiring Medical Device License (MDL)',
      'N95-equivalent respirators for medical use: Class II requiring MDL',
      'Medical Device Establishment License (MDEL) for importers/distributors',
      'Quality management system requirements per ISO 13485',
      'Clinical evidence requirements for Class II and above',
      'Bilingual labeling (English and French) mandatory',
      'Post-market surveillance and mandatory problem reporting'
    ],
    documents: [
      { name: 'Medical Devices Regulations (SOR/98-282)', type: 'DOC', size: '2.4 MB', url: '#' },
      { name: 'MDL Application Guide', type: 'DOC', size: '1.7 MB', url: '#' },
      { name: 'MDEL Requirements Guide', type: 'DOC', size: '1.1 MB', url: '#' },
      { name: 'Bilingual Labeling Guide', type: 'DOC', size: '876 KB', url: '#' }
    ],
    relatedStandards: ['CSA Z94.3', 'ASTM F2100', '42 CFR 84', 'ISO 13485', 'EN 14683'],
    certificationBodies: ['Health Canada', 'SCC', 'CSA Group', 'BSI Canada'],
    estimatedCost: 'C$10,000 - C$80,000',
    estimatedTime: '3-12 months',
    difficulty: 'High'
  },

  // ===== Global Standards =====
  {
    id: 'iso-13485',
    title: 'ISO 13485:2016 Medical Devices QMS',
    market: 'Global',
    flag: '🌍',
    category: 'Regulatory Framework',
    description: 'International standard for quality management systems specific to medical devices. Provides the foundation for regulatory compliance in virtually all markets worldwide.',
    effectiveDate: '2016-03-01',
    status: 'Active',
    scope: 'Medical device manufacturers worldwide',
    keyPoints: [
      'Risk management throughout product lifecycle per ISO 14971',
      'Design and development controls with documented procedures',
      'Process validation requirements for special processes',
      'Traceability and record keeping requirements',
      'Regulatory requirements integration for each target market',
      'Certification by accredited body recommended for market access',
      'Management responsibility and resource management requirements',
      'Monitoring, measurement, analysis, and improvement processes'
    ],
    documents: [
      { name: 'ISO 13485:2016 Standard Overview', type: 'DOC', size: '3.2 MB', url: '#' },
      { name: 'Implementation Guide', type: 'DOC', size: '2.1 MB', url: '#' },
      { name: 'Audit Checklist Template', type: 'DOC', size: '456 KB', url: '#' }
    ],
    relatedStandards: ['ISO 14971', 'ISO 10993', 'IEC 62304', 'ISO 14644', 'ISO 11607'],
    certificationBodies: ['BSI', 'TUV SUD', 'SGS', 'DNV', 'Intertek'],
    estimatedCost: '$5,000 - $50,000',
    estimatedTime: '6-12 months',
    difficulty: 'High'
  },
  {
    id: 'iso-13688-global',
    title: 'EN ISO 13688:2013 (Protective Clothing General Requirements)',
    market: 'Global',
    flag: '🌍',
    category: 'Body Protection',
    description: 'International standard (identical to EN 13688) specifying general performance requirements for ergonomics, innocuousness, sizing, ageing, compatibility, and marking of protective clothing.',
    effectiveDate: '2013-11-01',
    status: 'Active',
    scope: 'All protective clothing products globally',
    keyPoints: [
      'General ergonomic requirements for comfort and mobility',
      'Innocuousness requirements ensuring no harmful substances',
      'Sizing designation based on body measurements (ISO 8559)',
      'Ageing requirements for material durability',
      'Compatibility requirements for multi-PPE systems',
      'Marking and manufacturer information requirements',
      'User information in language of country of sale',
      'Referenced by all specific protective clothing standards globally'
    ],
    documents: [
      { name: 'EN ISO 13688:2013 Standard', type: 'DOC', size: '2.5 MB', url: '#' },
      { name: 'Sizing Reference Chart', type: 'DOC', size: '678 KB', url: '#' }
    ],
    relatedStandards: ['EN 14126', 'EN 1073', 'EN 469', 'EN 13034', 'ISO 8559'],
    certificationBodies: ['BSI', 'SGS', 'TUV SUD', 'DEKRA', 'Intertek'],
    estimatedCost: '$1,500 - $6,000',
    estimatedTime: '3-6 weeks',
    difficulty: 'Low'
  },
]

export default function RegulationsNewPage() {
  const [selectedRegulation, setSelectedRegulation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Compute statistics
  const stats = useMemo(() => {
    const marketCounts: Record<string, number> = {}
    const categoryCounts: Record<string, number> = {}
    MARKETS.forEach(m => { marketCounts[m.id] = 0 })
    CATEGORIES.forEach(c => { categoryCounts[c.id] = 0 })
    REGULATIONS.forEach(r => {
      marketCounts[r.market] = (marketCounts[r.market] || 0) + 1
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1
    })
    return { marketCounts, categoryCounts }
  }, [])

  // Filter regulations
  const filteredRegulations = useMemo(() => {
    return REGULATIONS.filter(reg => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesSearch = (
          reg.title.toLowerCase().includes(q) ||
          reg.description.toLowerCase().includes(q) ||
          reg.market.toLowerCase().includes(q) ||
          reg.scope.toLowerCase().includes(q) ||
          reg.category.toLowerCase().includes(q) ||
          reg.status.toLowerCase().includes(q) ||
          reg.difficulty.toLowerCase().includes(q) ||
          reg.estimatedCost.toLowerCase().includes(q) ||
          reg.estimatedTime.toLowerCase().includes(q) ||
          reg.keyPoints.some(point => point.toLowerCase().includes(q)) ||
          reg.documents.some(doc => doc.name.toLowerCase().includes(q)) ||
          reg.relatedStandards.some(std => std.toLowerCase().includes(q)) ||
          reg.certificationBodies.some(body => body.toLowerCase().includes(q))
        )
        if (!matchesSearch) return false
      }

      // Market filter
      if (selectedMarkets.length > 0 && !selectedMarkets.includes(reg.market)) {
        return false
      }

      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(reg.category)) {
        return false
      }

      return true
    })
  }, [searchQuery, selectedMarkets, selectedCategories])

  const toggleMarket = (marketId: string) => {
    setSelectedMarkets(prev =>
      prev.includes(marketId)
        ? prev.filter(m => m !== marketId)
        : [...prev, marketId]
    )
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    )
  }

  const clearFilters = () => {
    setSelectedMarkets([])
    setSelectedCategories([])
    setSearchQuery('')
  }

  const hasActiveFilters = selectedMarkets.length > 0 || selectedCategories.length > 0 || searchQuery.length > 0

  const handleDownload = (docName: string, regId: string) => {
    const reg = REGULATIONS.find(r => r.id === regId)
    if (!reg) return

    const date = new Date().toISOString().split('T')[0]
    const year = new Date().getFullYear()
    const docRef = `${regId.toUpperCase()}-${year}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    const bodyContent = `
<h1>${docName}</h1>
<p><strong>Regulation:</strong> ${reg.title}</p>
<p><strong>Market:</strong> ${reg.flag} ${reg.market}</p>
<p><strong>Category:</strong> ${reg.category}</p>
<p><strong>Status:</strong> ${reg.status}</p>
<p><strong>Effective Date:</strong> ${reg.effectiveDate}</p>
<p><strong>Scope:</strong> ${reg.scope}</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>Description</h2>
<p>${reg.description}</p>

<h2>Key Requirements</h2>
<ol>
${reg.keyPoints.map((point, idx) => `<li>${point}</li>`).join('\n')}
</ol>

<h2>Related Standards</h2>
<ul>
${reg.relatedStandards.map(std => `<li>${std}</li>`).join('\n')}
</ul>

<h2>Certification Bodies</h2>
<ul>
${reg.certificationBodies.map(body => `<li>${body}</li>`).join('\n')}
</ul>

<h2>Estimated Cost and Timeline</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Estimated Cost</td><td>${reg.estimatedCost}</td></tr>
<tr><td>Estimated Time</td><td>${reg.estimatedTime}</td></tr>
<tr><td>Difficulty</td><td>${reg.difficulty}</td></tr>
</table>
`

    const htmlContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${docName}</title>
<style>
  body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.6; color: #333; margin: 40px; }
  h1 { color: #339999; font-size: 22pt; border-bottom: 2px solid #339999; padding-bottom: 8px; margin-top: 24px; }
  h2 { color: #339999; font-size: 16pt; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 20px; }
  h3 { color: #555; font-size: 13pt; margin-top: 16px; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th { background-color: #339999; color: white; padding: 8px; text-align: left; border: 1px solid #2d8b8b; }
  td { padding: 8px; border: 1px solid #ddd; }
  tr:nth-child(even) { background-color: #f9f9f9; }
  .header { text-align: center; border-bottom: 3px solid #339999; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { border: none; font-size: 28pt; margin-bottom: 4px; color: #339999; }
  .header p { color: #666; font-size: 10pt; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; color: #888; font-size: 9pt; text-align: center; }
  ul, ol { margin: 8px 0; padding-left: 24px; }
  li { margin: 4px 0; }
  hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
</style>
</head>
<body>
<div class="header">
  <h1>MDLooker</h1>
  <p>PPE Compliance Platform</p>
</div>
${bodyContent}
<div class="footer">
<p>Generated by MDLooker PPE Compliance Platform | ${date}</p>
<p><em>Document: ${docName} | Regulation: ${reg.title} | Ref: ${docRef}</em></p>
<p><em>This document is confidential and proprietary. Unauthorized distribution is prohibited.</em></p>
</div>
</body>
</html>`

    const blob = new Blob([htmlContent], { type: 'application/msword' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${docName.replace(/[^a-zA-Z0-9\s-]/g, '')}_${date}.doc`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Detail view for a selected regulation
  if (selectedRegulation) {
    const reg = REGULATIONS.find(r => r.id === selectedRegulation)
    if (!reg) return null

    const marketInfo = MARKETS.find(m => m.id === reg.market)

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => setSelectedRegulation(null)}
              className="text-[#339999] hover:underline mb-4 flex items-center gap-1"
            >
              &larr; Back to Regulations
            </button>
            <div className="flex items-start gap-4">
              <span className="text-5xl">{reg.flag}</span>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block px-3 py-1 bg-[#339999]/10 text-[#339999] text-sm font-medium rounded-full">
                    {reg.category}
                  </span>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                    reg.status === 'Active' ? 'bg-green-100 text-green-700' :
                    reg.status === 'Draft' ? 'bg-yellow-100 text-yellow-700' :
                    reg.status === 'Under Review' ? 'bg-blue-100 text-blue-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {reg.status}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{reg.title}</h1>
                <p className="mt-2 text-gray-600 max-w-3xl">{reg.description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Key Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#339999]" />
                  Key Information
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Clock className="w-4 h-4" />
                      Effective Date
                    </div>
                    <div className="font-semibold text-gray-900">{reg.effectiveDate}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Globe className="w-4 h-4" />
                      Scope
                    </div>
                    <div className="font-semibold text-gray-900">{reg.scope}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Clock className="w-4 h-4" />
                      Estimated Time
                    </div>
                    <div className="font-semibold text-gray-900">{reg.estimatedTime}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <DollarSign className="w-4 h-4" />
                      Estimated Cost
                    </div>
                    <div className="font-semibold text-gray-900">{reg.estimatedCost}</div>
                  </div>
                </div>
              </div>

              {/* Key Points */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#339999]" />
                  Key Requirements
                </h2>
                <ul className="space-y-3">
                  {reg.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#339999]/10 text-[#339999] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Documents */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#339999]" />
                  Official Documents
                </h2>
                <div className="space-y-3">
                  {reg.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          doc.type === 'DOC' ? 'bg-blue-100 text-blue-600' :
                          doc.type === 'XLSX' ? 'bg-green-100 text-green-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-500">{doc.type} &middot; {doc.size}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(doc.name, reg.id)}
                        className="flex items-center gap-2 px-3 py-2 text-[#339999] hover:bg-[#339999]/10 rounded-lg transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Standards */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[#339999]" />
                  Related Standards
                </h2>
                <div className="flex flex-wrap gap-2">
                  {reg.relatedStandards.map((standard, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-default"
                    >
                      {standard}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Market Info */}
              {marketInfo && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#339999]" />
                    Market
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{marketInfo.flag}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{marketInfo.label}</p>
                      <p className="text-sm text-gray-500">{stats.marketCounts[marketInfo.id] || 0} regulations in database</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Certification Bodies */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#339999]" />
                  Certification Bodies
                </h3>
                <ul className="space-y-2">
                  {reg.certificationBodies.map((body, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {body}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Difficulty */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[#339999]" />
                  Complexity Level
                </h3>
                <div className={`inline-flex items-center px-4 py-2 rounded-lg font-medium
                  ${reg.difficulty === 'Very High' ? 'bg-red-100 text-red-700' :
                    reg.difficulty === 'High' ? 'bg-orange-100 text-orange-700' :
                    reg.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'}`}>
                  {reg.difficulty}
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  {reg.difficulty === 'Very High' ? 'Requires extensive documentation, local expertise, and significant time investment.' :
                   reg.difficulty === 'High' ? 'Requires significant preparation, testing, and regulatory expertise.' :
                   reg.difficulty === 'Medium' ? 'Moderate complexity with clear requirements and established pathways.' :
                   'Straightforward requirements with well-defined compliance steps.'}
                </p>
              </div>

              {/* Help CTA */}
              <div className="bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-xl shadow-sm p-6 text-white">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Need Help?
                </h3>
                <p className="text-sm text-white/90 mb-4">
                  Our compliance experts can guide you through this regulation.
                </p>
                <Button className="w-full bg-white text-[#339999] hover:bg-gray-100">
                  Get Expert Help
                </Button>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="/compliance-guides" className="flex items-center gap-2 text-[#339999] hover:underline">
                      <BookOpen className="w-4 h-4" />
                      Step-by-Step Guide
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </a>
                  </li>
                  <li>
                    <a href="/documents" className="flex items-center gap-2 text-[#339999] hover:underline">
                      <Download className="w-4 h-4" />
                      Download Templates
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </a>
                  </li>
                  <li>
                    <a href="/manufacturers" className="flex items-center gap-2 text-[#339999] hover:underline">
                      <Users className="w-4 h-4" />
                      Find Certified Manufacturers
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#339999]/10 rounded-2xl mb-6">
              <BookOpen className="w-8 h-8 text-[#339999]" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              PPE Regulations & Standards
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Comprehensive database of global PPE regulations, standards, and compliance requirements covering {MARKETS.length} markets with official documents and guides
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search regulations, standards, markets, certification bodies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#339999] focus:border-transparent text-lg"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <BarChart3 className="w-4 h-4 text-[#339999]" />
                <span><strong className="text-gray-900">{REGULATIONS.length}</strong> Regulations</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Globe className="w-4 h-4 text-[#339999]" />
                <span><strong className="text-gray-900">{MARKETS.length}</strong> Markets</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Layers className="w-4 h-4 text-[#339999]" />
                <span><strong className="text-gray-900">{CATEGORIES.length}</strong> Categories</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FileText className="w-4 h-4 text-[#339999]" />
                <span><strong className="text-gray-900">{REGULATIONS.reduce((sum, r) => sum + r.documents.length, 0)}</strong> Documents</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear filters
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showFilters || hasActiveFilters
                    ? 'bg-[#339999]/10 text-[#339999]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="w-5 h-5 bg-[#339999] text-white rounded-full text-xs flex items-center justify-center">
                    {selectedMarkets.length + selectedCategories.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Market Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#339999]" />
                Market / Country
              </h3>
              <div className="flex flex-wrap gap-2">
                {MARKETS.map(market => (
                  <button
                    key={market.id}
                    onClick={() => toggleMarket(market.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedMarkets.includes(market.id)
                        ? 'bg-[#339999] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{market.flag}</span>
                    <span>{market.label}</span>
                    <span className={`text-xs ${
                      selectedMarkets.includes(market.id) ? 'text-white/70' : 'text-gray-400'
                    }`}>
                      ({stats.marketCounts[market.id] || 0})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#339999]" />
                Category
              </h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategories.includes(cat.id)
                        ? 'bg-[#339999] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className={`text-xs ${
                      selectedCategories.includes(cat.id) ? 'text-white/70' : 'text-gray-400'
                    }`}>
                      ({stats.categoryCounts[cat.id] || 0})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results count */}
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            Showing <strong className="text-gray-900">{filteredRegulations.length}</strong> of {REGULATIONS.length} regulations
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>

        {/* Regulations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRegulations.map((reg) => {
            const marketInfo = MARKETS.find(m => m.id === reg.market)
            return (
              <div
                key={reg.id}
                onClick={() => setSelectedRegulation(reg.id)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="bg-gradient-to-r from-[#339999]/10 to-[#339999]/5 p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{reg.flag}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-block px-2 py-0.5 bg-[#339999]/10 text-[#339999] text-xs font-medium rounded-full">
                            {reg.category}
                          </span>
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                            reg.status === 'Active' ? 'bg-green-100 text-green-700' :
                            reg.status === 'Draft' ? 'bg-yellow-100 text-yellow-700' :
                            reg.status === 'Under Review' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {reg.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 group-hover:text-[#339999] transition-colors">
                          {reg.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {reg.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Timeline</div>
                      <div className="font-semibold text-gray-900 text-sm">{reg.estimatedTime}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Cost</div>
                      <div className="font-semibold text-gray-900 text-sm">{reg.estimatedCost}</div>
                    </div>
                  </div>

                  {/* Difficulty indicator */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-gray-500">Complexity:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4].map(level => (
                        <div
                          key={level}
                          className={`w-2 h-2 rounded-full ${
                            level <= (reg.difficulty === 'Low' ? 1 : reg.difficulty === 'Medium' ? 2 : reg.difficulty === 'High' ? 3 : 4)
                              ? reg.difficulty === 'Very High' ? 'bg-red-500' :
                                reg.difficulty === 'High' ? 'bg-orange-500' :
                                reg.difficulty === 'Medium' ? 'bg-yellow-500' :
                                'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                      <span className={`text-xs font-medium ml-1 ${
                        reg.difficulty === 'Very High' ? 'text-red-600' :
                        reg.difficulty === 'High' ? 'text-orange-600' :
                        reg.difficulty === 'Medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {reg.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{reg.documents.length} documents</span>
                    </div>
                    <div className="flex items-center text-[#339999] font-medium group-hover:gap-2 transition-all">
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredRegulations.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-2xl mb-6">
              <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No regulations found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or filters
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      {/* Market Coverage Overview */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#339999]" />
            Market Coverage
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {MARKETS.map(market => (
              <button
                key={market.id}
                onClick={() => {
                  setSelectedMarkets([market.id])
                  setShowFilters(true)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="bg-gray-50 rounded-xl p-4 text-center hover:bg-[#339999]/10 hover:shadow-sm transition-all group"
              >
                <span className="text-3xl block mb-2">{market.flag}</span>
                <p className="text-sm font-medium text-gray-900 group-hover:text-[#339999] transition-colors">{market.label}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.marketCounts[market.id] || 0} regulations</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="/compliance-guides" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-all">
            <BookOpen className="w-10 h-10 text-[#339999] mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Compliance Guides</h3>
            <p className="text-sm text-gray-600">Step-by-step certification guides</p>
          </a>

          <a href="/documents" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-all">
            <Download className="w-10 h-10 text-[#339999] mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Document Center</h3>
            <p className="text-sm text-gray-600">Templates and checklists</p>
          </a>

          <a href="/certification-comparison" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-all">
            <Shield className="w-10 h-10 text-[#339999] mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Compare Certifications</h3>
            <p className="text-sm text-gray-600">Side-by-side comparison tool</p>
          </a>
        </div>
      </div>
    </div>
  )
}
