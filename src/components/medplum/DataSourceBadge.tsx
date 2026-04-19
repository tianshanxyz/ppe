'use client';

import React from 'react';
import { Badge } from '../ui/Badge';
import { Info, Database, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface DataSourceBadgeProps {
  source: 'medplum' | 'local' | 'fda' | 'eudamed' | 'nmpa' | 'other';
  className?: string;
  showTooltip?: boolean;
  url?: string;
}

export function DataSourceBadge({ 
  source, 
  className = '', 
  showTooltip = true,
  url 
}: DataSourceBadgeProps) {
  const sourceConfig = {
    medplum: {
      label: 'Medplum',
      variant: 'primary' as const,
      icon: <Database className="w-3 h-3 mr-1" />,
      description: '数据来源：Medplum 医疗合规标准库',
      url: 'https://medplum.com'
    },
    local: {
      label: 'MDLooker',
      variant: 'secondary' as const,
      icon: <Database className="w-3 h-3 mr-1" />,
      description: '数据来源：MDLooker 本地数据库',
      url: 'https://mdlooker.com'
    },
    fda: {
      label: 'FDA',
      variant: 'info' as const,
      icon: <ExternalLink className="w-3 h-3 mr-1" />,
      description: '数据来源：FDA 数据库',
      url: 'https://www.fda.gov'
    },
    eudamed: {
      label: 'EUDAMED',
      variant: 'info' as const,
      icon: <ExternalLink className="w-3 h-3 mr-1" />,
      description: '数据来源：EUDAMED 数据库',
      url: 'https://ec.europa.eu/health/documents/community-register/html/'
    },
    nmpa: {
      label: 'NMPA',
      variant: 'info' as const,
      icon: <ExternalLink className="w-3 h-3 mr-1" />,
      description: '数据来源：NMPA 数据库',
      url: 'https://www.nmpa.gov.cn'
    },
    other: {
      label: 'Other',
      variant: 'gray' as const,
      icon: <Info className="w-3 h-3 mr-1" />,
      description: '数据来源：其他',
      url: undefined
    }
  };

  const config = sourceConfig[source];
  const linkUrl = url || config.url;

  return linkUrl ? (
    <Link href={linkUrl} target="_blank" rel="noopener noreferrer">
      <Badge 
        variant={config.variant}
        className={`flex items-center cursor-pointer hover:opacity-80 ${className}`}
      >
        {config.icon}
        {config.label}
        {showTooltip && (
          <span className="sr-only">{config.description}</span>
        )}
      </Badge>
    </Link>
  ) : (
    <Badge 
      variant={config.variant}
      className={`flex items-center ${className}`}
    >
      {config.icon}
      {config.label}
      {showTooltip && (
        <span className="sr-only">{config.description}</span>
      )}
    </Badge>
  );
}

// Data source legend component
export function DataSourceLegend() {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">数据来源说明</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <DataSourceBadge source="medplum" showTooltip={false} />
          <span className="text-xs text-gray-600">Medplum 医疗合规标准库</span>
        </div>
        <div className="flex items-center gap-2">
          <DataSourceBadge source="local" showTooltip={false} />
          <span className="text-xs text-gray-600">MDLooker 本地数据库</span>
        </div>
        <div className="flex items-center gap-2">
          <DataSourceBadge source="fda" showTooltip={false} />
          <span className="text-xs text-gray-600">FDA 官方数据库</span>
        </div>
        <div className="flex items-center gap-2">
          <DataSourceBadge source="eudamed" showTooltip={false} />
          <span className="text-xs text-gray-600">EUDAMED 官方数据库</span>
        </div>
        <div className="flex items-center gap-2">
          <DataSourceBadge source="nmpa" showTooltip={false} />
          <span className="text-xs text-gray-600">NMPA 官方数据库</span>
        </div>
      </div>
    </div>
  );
}
