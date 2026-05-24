import type { ProjectConfigForm, ProjectConfigQuery, ProjectConfigVO } from './projectConfig';

import type { ID, IDS, PageResult } from '#/api/common';

import { requestClient } from '#/api/request';

/**
 * 查询项目配置列表
 */
export function projectConfigList(params?: ProjectConfigQuery) {
  return requestClient.get<PageResult<ProjectConfigVO>>('/codereview/projectConfig/list', { params });
}

/**
 * 查询所有项目配置
 */
export function projectConfigListAll() {
  return requestClient.get<ProjectConfigVO[]>('/codereview/projectConfig/listAll');
}

/**
 * 查询项目配置详情
 */
export function projectConfigInfo(id: ID) {
  return requestClient.get<ProjectConfigVO>(`/codereview/projectConfig/${id}`);
}

/**
 * 根据项目名和平台获取配置
 */
export function projectConfigGetByProject(projectName: string, platform: string) {
  return requestClient.get<ProjectConfigVO>('/codereview/projectConfig/getByProject', {
    params: { projectName, platform },
  });
}

/**
 * 新增项目配置
 */
export function projectConfigAdd(data: ProjectConfigForm) {
  return requestClient.postWithMsg<void>('/codereview/projectConfig', data);
}

/**
 * 更新项目配置
 */
export function projectConfigUpdate(data: ProjectConfigForm) {
  return requestClient.putWithMsg<void>('/codereview/projectConfig', data);
}

/**
 * 删除项目配置
 */
export function projectConfigRemove(id: ID | IDS) {
  return requestClient.deleteWithMsg<void>(`/codereview/projectConfig/${id}`);
}

/**
 * 修改审查状态
 */
export function projectConfigChangeStatus(id: number, reviewEnabled: number) {
  return requestClient.putWithMsg<void>('/codereview/projectConfig/changeStatus', { id, reviewEnabled });
}

/**
 * 测试平台连接
 */
export function projectConfigTestConnection(data: ProjectConfigForm) {
  return requestClient.post<boolean>('/codereview/projectConfig/testConnection', data);
}

/**
 * 发送测试通知
 */
export function projectConfigTestNotification(data: ProjectConfigForm) {
  return requestClient.post<boolean>('/codereview/projectConfig/testNotification', data);
}
