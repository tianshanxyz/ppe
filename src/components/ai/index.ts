/**
 * AI 组件库
 * 提供 AI 助手和提取结果展示等组件
 */

export { AIFloatingAssistant } from './AIFloatingAssistant';
export { AIExtractionCard } from './AIExtractionCard';

export type {
  MessageRole,
  MessageType,
  Message,
  AIFloatingAssistantProps
} from './AIFloatingAssistant';

export type {
  ExtractionStatus,
  EntityType,
  ExtractedField,
  ExtractedEntity,
  AIExtractionCardProps
} from './AIExtractionCard';
