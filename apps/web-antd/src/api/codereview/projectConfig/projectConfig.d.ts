import type { BaseEntity, PageQuery } from '#/api/common';

export interface ProjectConfigVO {
  /** 主键 */
  id: number | string;
  /** 项目名称 */
  projectName: string;
  /** 平台: gitlab, github, gitea */
  platform: string;
  /** 平台项目ID */
  projectId: string;
  /** 平台服务器URL */
  platformUrl: string;
  /** 平台访问Token */
  platformToken: string;
  /** Webhook 密钥 */
  webhookSecret: string;
  /** 使用的模型ID */
  modelId: number;
  /** 是否启用审查 */
  reviewEnabled: number;
  /** 是否启用Push审查 */
  pushReviewEnabled: number;
  /** 仅审查受保护分支 */
  protectedBranchesOnly: number;
  /** 审查文件扩展名 */
  fileExtensions: string;
  /** 排除文件模式 */
  excludePatterns: string;
  /** 单次最大审查文件数 */
  maxFilesPerReview: number;
  /** 最大Token数 */
  maxTokens: number;
  /** 审查风格 */
  reviewStyle: string;
  /** 通过分数 */
  passScore: number;
  /** 通知渠道(JSON) */
  notificationChannels: string;
  /** 自定义规则(JSON) */
  customRules: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
}

export interface ProjectConfigForm extends BaseEntity {
  id?: number | string;
  projectName?: string;
  platform?: string;
  projectId?: string;
  platformUrl?: string;
  platformToken?: string;
  webhookSecret?: string;
  modelId?: number;
  reviewEnabled?: number;
  pushReviewEnabled?: number;
  protectedBranchesOnly?: number;
  fileExtensions?: string;
  excludePatterns?: string;
  maxFilesPerReview?: number;
  maxTokens?: number;
  reviewStyle?: string;
  passScore?: number;
  notificationChannels?: string;
  customRules?: string;
}

export interface ProjectConfigQuery extends PageQuery {
  projectName?: string;
  platform?: string;
}

/** 通知渠道配置 */
export interface NotificationChannel {
  type: 'dingtalk' | 'feishu' | 'wecom' | 'webhook';
  webhookUrl: string;
  secret?: string;
  secretEnabled?: boolean;
  enabled: boolean;
}

/** 自定义审查规则 */
export interface ReviewRule {
  ruleName: string;
  description?: string;
}
