import type { BaseEntity, PageQuery } from '#/api/common';

export interface MrReviewLogVO {
  id: number | string;
  projectName: string;
  author: string;
  sourceBranch: string;
  targetBranch: string;
  url: string;
  lastCommitId: string;
  reviewResult: string;
  score: number;
  platform: string;
  projectId: string;
  additions: number;
  deletions: number;
  createTime?: string;
}

export interface PushReviewLogVO {
  id: number | string;
  projectName: string;
  author: string;
  branch: string;
  commitMessages: string;
  reviewResult: string;
  score: number;
  platform: string;
  projectId: string;
  additions: number;
  deletions: number;
  createTime?: string;
}

export interface MrReviewLogQuery extends PageQuery {
  projectName?: string;
  platform?: string;
  author?: string;
}

export interface PushReviewLogQuery extends PageQuery {
  projectName?: string;
  platform?: string;
}
