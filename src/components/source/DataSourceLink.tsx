'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ExternalLink, 
  Database, 
  Globe, 
  Link2,
  CheckCircle,
  Building2,
  FileText
} from 'lucide-react';

export type DataSource = 'FDA' | 'EUDAMED' | 'NMPA' | 'PMDA' | 'MHRA' | 'WHO' | 'ICB';

export interface DataSourceLinkProps {
  source: DataSource;
  url: string;
  label?: string;
  showIcon?: boolean;
  variant?: 'button' | 'link' | 'badge' | 'card';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onTrack?: (source: DataSource) => void;
}

/**
 * 数据源配置
 */
const sourceConfig: Record<DataSource, {
  name: string;
  fullName: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}> = {
  FDA: {
    name: 'FDA',
    fullName: '美国食品药品监督管理局',
    icon: Link2,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: '美国医疗器械注册数据库'
  },
  EUDAMED: {
    name: 'EUDAMED',
    fullName: '欧盟医疗器械数据库',
    icon: Globe,
    color: 'text-sky-700',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    description: '欧盟医疗器械注册信息'
  },
  NMPA: {
    name: 'NMPA',
    fullName: '国家药品监督管理局',
    icon: Building2,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: '中国医疗器械注册数据库'
  },
  PMDA: {
    name: 'PMDA',
    fullName: '日本医药品医疗器械综合机构',
    icon: FileText,
    color: 'text-pink-700',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    description: '日本医疗器械注册信息'
  },
  MHRA: {
    name: 'MHRA',
    fullName: '英国药品和医疗保健产品监管局',
    icon: CheckCircle,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    description: '英国医疗器械注册数据库'
  },
  WHO: {
    name: 'WHO',
    fullName: '世界卫生组织',
    icon: Globe,
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    description: 'WHO医疗器械数据库'
  },
  ICB: {
    name: 'ICB',
    fullName: '国际商业数据库',
    icon: Database,
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    description: '国际商业信用数据库'
  }
};

/**
 * 一键溯源链接组件
 * 显示官方数据源链接，支持多种展示模式
 */
export function DataSourceLink({
  source,
  url,
  label,
  showIcon = true,
  variant = 'button',
  size = 'md',
  className = '',
  onTrack
}: DataSourceLinkProps) {
  const config = sourceConfig[source];
  const Icon = config.icon;

  const handleClick = () => {
    onTrack?.(source);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 尺寸配置
  const sizeConfig = {
    sm: {
      button: 'px-2 py-1 text-xs gap-1',
      link: 'text-xs gap-1',
      badge: 'px-1.5 py-0.5 text-xs gap-1',
      card: 'p-2 gap-2',
      icon: 'w-3 h-3'
    },
    md: {
      button: 'px-3 py-1.5 text-sm gap-1.5',
      link: 'text-sm gap-1.5',
      badge: 'px-2 py-1 text-sm gap-1',
      card: 'p-3 gap-3',
      icon: 'w-4 h-4'
    },
    lg: {
      button: 'px-4 py-2 text-base gap-2',
      link: 'text-base gap-2',
      badge: 'px-2.5 py-1 text-sm gap-1.5',
      card: 'p-4 gap-4',
      icon: 'w-5 h-5'
    }
  };

  const sizes = sizeConfig[size];

  // Button 模式
  if (variant === 'button') {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className={`
          inline-flex items-center rounded-lg border font-medium
          transition-all duration-200 hover:shadow-md
          ${config.bgColor} ${config.color} ${config.borderColor}
          ${sizes.button}
          ${className}
        `}
      >
        {showIcon && <Icon className={sizes.icon} />}
        <span>{label || config.name}</span>
        <ExternalLink className={`${sizes.icon} opacity-60`} />
      </motion.button>
    );
  }

  // Link 模式
  if (variant === 'link') {
    return (
      <motion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ x: 2 }}
        onClick={() => onTrack?.(source)}
        className={`
          inline-flex items-center font-medium hover:underline
          ${config.color}
          ${sizes.link}
          ${className}
        `}
      >
        {showIcon && <Icon className={sizes.icon} />}
        <span>{label || config.name}</span>
        <ExternalLink className={`${sizes.icon} opacity-60`} />
      </motion.a>
    );
  }

  // Badge 模式
  if (variant === 'badge') {
    return (
      <motion.span
        whileHover={{ scale: 1.05 }}
        onClick={handleClick}
        className={`
          inline-flex items-center rounded-full border cursor-pointer
          transition-all duration-200 hover:shadow-sm
          ${config.bgColor} ${config.color} ${config.borderColor}
          ${sizes.badge}
          ${className}
        `}
      >
        {showIcon && <Icon className={sizes.icon} />}
        <span>{label || config.name}</span>
      </motion.span>
    );
  }

  // Card 模式
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`
        flex items-start gap-3 rounded-lg border cursor-pointer
        transition-all duration-200 hover:shadow-lg
        bg-white border-gray-200 hover:border-gray-300
        ${sizes.card}
        ${className}
      `}
    >
      <div className={`
        flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
        ${config.bgColor}
      `}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900">
            {label || config.name}
          </h4>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{config.fullName}</p>
        <p className="text-xs text-gray-400 mt-1">{config.description}</p>
      </div>
    </motion.div>
  );
}

export interface DataSourceListProps {
  sources: Array<{
    source: DataSource;
    url: string;
    label?: string;
  }>;
  variant?: 'button' | 'link' | 'badge' | 'card';
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical' | 'grid';
  className?: string;
  onTrack?: (source: DataSource) => void;
}

/**
 * 数据源列表组件
 * 显示多个数据源链接
 */
export function DataSourceList({
  sources,
  variant = 'button',
  size = 'md',
  layout = 'horizontal',
  className = '',
  onTrack
}: DataSourceListProps) {
  if (sources.length === 0) return null;

  const layoutClasses = {
    horizontal: 'flex flex-wrap items-center gap-2',
    vertical: 'flex flex-col gap-2',
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
  };

  return (
    <div className={`${layoutClasses[layout]} ${className}`}>
      {sources.map((item, index) => (
        <DataSourceLink
          key={`${item.source}-${index}`}
          source={item.source}
          url={item.url}
          label={item.label}
          variant={variant}
          size={size}
          onTrack={onTrack}
        />
      ))}
    </div>
  );
}

export default DataSourceLink;
