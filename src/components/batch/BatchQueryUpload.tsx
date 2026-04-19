'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Trash2,
  FileText,
  Table,
  Search,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export type QueryType = 'company' | 'product';
export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export interface BatchQueryItem {
  id: string;
  query: string;
  type: QueryType;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: {
    found: boolean;
    name?: string;
    country?: string;
    registrationCount?: number;
    riskLevel?: 'low' | 'medium' | 'high';
  };
  error?: string;
}

export interface BatchQueryUploadProps {
  onUpload: (file: File, type: QueryType) => Promise<void>;
  onDownloadTemplate: (type: QueryType) => void;
  items: BatchQueryItem[];
  status: UploadStatus;
  progress: number;
  className?: string;
  onClear?: () => void;
  onRetry?: (id: string) => void;
}

function UploadZone({
  onFileSelect,
  isDragging,
  setIsDragging,
  queryType,
  setQueryType
}: {
  onFileSelect: (file: File) => void;
  isDragging: boolean;
  setIsDragging: (value: boolean) => void;
  queryType: QueryType;
  setQueryType: (type: QueryType) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, [setIsDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, [setIsDragging]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      onFileSelect(file);
    }
  }, [onFileSelect, setIsDragging]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setQueryType('company')}
          className={`
            flex-1 py-3 px-4 rounded-xl border-2 transition-all
            ${queryType === 'company'
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <Search className="w-5 h-5" />
            <span className="font-medium">Company Search</span>
          </div>
        </button>
        <button
          onClick={() => setQueryType('product')}
          className={`
            flex-1 py-3 px-4 rounded-xl border-2 transition-all
            ${queryType === 'product'
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <Table className="w-5 h-5" />
            <span className="font-medium">Product Search</span>
          </div>
        </button>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white shadow-sm flex items-center justify-center">
          <Upload className={`w-8 h-8 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`} />
        </div>
        <h4 className="text-lg font-medium text-gray-900 mb-1">
          Drag files here or click to upload
        </h4>
        <p className="text-sm text-gray-500">
          Supports Excel (.xlsx, .xls) or CSV format
        </p>
      </div>
    </div>
  );
}

function ProgressBar({ progress, status }: { progress: number; status: UploadStatus }) {
  const statusConfig = {
    idle: { label: 'Waiting for upload', color: 'bg-gray-200' },
    uploading: { label: 'Uploading...', color: 'bg-blue-500' },
    processing: { label: 'Processing...', color: 'bg-primary-500' },
    completed: { label: 'Completed', color: 'bg-green-500' },
    error: { label: 'Error', color: 'bg-red-500' }
  };

  const config = statusConfig[status];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{config.label}</span>
        <span className="font-medium text-gray-900">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={`h-full ${config.color} transition-all duration-300`}
        />
      </div>
    </div>
  );
}

function ResultItem({
  item,
  onRetry
}: {
  item: BatchQueryItem;
  onRetry?: (id: string) => void;
}) {
  const statusIcons = {
    pending: <Clock className="w-5 h-5 text-gray-400" />,
    processing: <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />,
    completed: item.result?.found
      ? <CheckCircle className="w-5 h-5 text-green-500" />
      : <XCircle className="w-5 h-5 text-gray-400" />,
    error: <XCircle className="w-5 h-5 text-red-500" />
  };

  const statusLabels = {
    pending: 'Pending',
    processing: 'Processing',
    completed: item.result?.found ? 'Found' : 'Not Found',
    error: 'Error'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
    >
      {statusIcons[item.status]}
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{item.query}</p>
        {item.result?.name && (
          <p className="text-sm text-gray-500 truncate">{item.result.name}</p>
        )}
        {item.error && (
          <p className="text-sm text-red-500 truncate">{item.error}</p>
        )}
      </div>

      <Badge variant={item.status === 'completed' && item.result?.found ? 'success' : 'gray'}>
        {statusLabels[item.status]}
      </Badge>

      {item.status === 'error' && onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRetry(item.id)}
        >
          Retry
        </Button>
      )}
    </motion.div>
  );
}

export function BatchQueryUpload({
  onUpload,
  onDownloadTemplate,
  items,
  status,
  progress,
  className = '',
  onClear,
  onRetry
}: BatchQueryUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [queryType, setQueryType] = useState<QueryType>('company');

  const handleFileSelect = async (file: File) => {
    await onUpload(file, queryType);
  };

  const completedCount = items.filter(i => i.status === 'completed').length;
  const errorCount = items.filter(i => i.status === 'error').length;

  return (
    <div className={`space-y-6 ${className}`}>
      <UploadZone
        onFileSelect={handleFileSelect}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        queryType={queryType}
        setQueryType={setQueryType}
      />

      {status !== 'idle' && (
        <ProgressBar progress={progress} status={status} />
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              Results ({completedCount}/{items.length})
            </h4>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadTemplate(queryType)}
              >
                <Download className="w-4 h-4 mr-1" />
                Template
              </Button>
              {onClear && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClear}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {items.map((item) => (
              <ResultItem
                key={item.id}
                item={item}
                onRetry={onRetry}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
