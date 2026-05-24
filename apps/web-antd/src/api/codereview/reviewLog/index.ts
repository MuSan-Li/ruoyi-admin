import type { MrReviewLogQuery, MrReviewLogVO, PushReviewLogQuery, PushReviewLogVO } from './reviewLog';

import type { ID, IDS, PageResult } from '#/api/common';

import { requestClient } from '#/api/request';

/**
 * 查询 MR 审查日志列表
 */
export function mrReviewLogList(params?: MrReviewLogQuery) {
  return requestClient.get<PageResult<MrReviewLogVO>>('/codereview/reviewLog/mr/list', { params });
}

/**
 * 查询 MR 审查日志详情
 */
export function mrReviewLogInfo(id: ID) {
  return requestClient.get<MrReviewLogVO>(`/codereview/reviewLog/mr/${id}`);
}

/**
 * 查询 Push 审查日志列表
 */
export function pushReviewLogList(params?: PushReviewLogQuery) {
  return requestClient.get<PageResult<PushReviewLogVO>>('/codereview/reviewLog/push/list', { params });
}

/**
 * 查询 Push 审查日志详情
 */
export function pushReviewLogInfo(id: ID) {
  return requestClient.get<PushReviewLogVO>(`/codereview/reviewLog/push/${id}`);
}

/**
 * 删除 MR 审查日志
 */
export function mrReviewLogRemove(id: ID | IDS) {
  return requestClient.deleteWithMsg<void>(`/codereview/reviewLog/mr/${id}`);
}

/**
 * 删除 Push 审查日志
 */
export function pushReviewLogRemove(id: ID | IDS) {
  return requestClient.deleteWithMsg<void>(`/codereview/reviewLog/push/${id}`);
}

/**
 * 获取趋势数据
 */
export function statisticsTrend(projectName: string, platform: string, days: number = 7, author?: string) {
  return requestClient.get<any[]>('/codereview/statistics/trend', {
    params: { projectName, platform, days, author: author || undefined },
  });
}

/**
 * 生成趋势报告
 */
export function statisticsReport(projectName: string, platform: string, days: number = 7, author?: string) {
  return requestClient.get<string>('/codereview/statistics/report', {
    params: { projectName, platform, days, author: author || undefined },
  });
}

/**
 * 获取项目作者列表
 */
export function statisticsAuthors(projectName: string, platform?: string) {
  return requestClient.get<string[]>('/codereview/statistics/authors', {
    params: { projectName, platform: platform || undefined },
  });
}

/**
 * 刷新统计数据
 */
export function statisticsRefresh(projectName: string, platform: string) {
  return requestClient.postWithMsg<void>('/codereview/statistics/refresh', null, {
    params: { projectName, platform },
  });
}
