'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReportPreview, ReportType } from './ReportPreview';

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  isPro?: boolean;
}

/**
 * 报告下载模态框组件
 */
export function ReportModal({
  isOpen,
  onClose,
  companyId,
  companyName,
  isPro = false
}: ReportModalProps) {
  const [selectedType, setSelectedType] = useState<ReportType>('summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const reportTypes: ReportType[] = ['summary', 'compliance', 'due-diligence', 'full'];

  const handleDownload = async () => {
    setIsGenerating(true);
    setDownloadStatus('idle');

    try {
      // 模拟报告生成
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 触发下载
      const link = document.createElement('a');
      link.href = `/api/reports/${companyId}?type=${selectedType}`;
      link.download = `${companyName}_${selectedType}_report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadStatus('success');
    } catch {
      setDownloadStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">下载企业报告</h2>
                <p className="text-sm text-gray-500">{companyName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* 内容区 */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* 报告类型选择 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">选择报告类型</h3>
              <div className="flex flex-wrap gap-2">
                {reportTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${selectedType === type
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {type === 'compliance' && '合规性报告'}
                    {type === 'due-diligence' && '尽职调查'}
                    {type === 'summary' && '企业摘要'}
                    {type === 'full' && '完整分析'}
                  </button>
                ))}
              </div>
            </div>

            {/* 报告预览 */}
            <ReportPreview
              companyId={companyId}
              companyName={companyName}
              reportType={selectedType}
              onDownload={handleDownload}
              isPro={isPro}
              usageCount={2}
              usageLimit={10}
            />

            {/* 状态提示 */}
            {downloadStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-800">报告生成成功</p>
                  <p className="text-sm text-green-600">报告下载即将开始</p>
                </div>
              </motion.div>
            )}

            {downloadStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-800">报告生成失败</p>
                  <p className="text-sm text-red-600">请稍后重试或联系客服</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* 底部 */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              报告将在生成后自动下载
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handleDownload}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    下载报告
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ReportModal;
