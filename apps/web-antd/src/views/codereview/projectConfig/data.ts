import type { VxeGridProps } from '#/adapter/vxe-table';

import dayjs from 'dayjs';

/** 表格列配置 */
export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 50 },
  { field: 'projectName', title: '项目名称', minWidth: 130 },
  {
    field: 'platform',
    title: '平台',
    width: 90,
    slots: { default: 'platform' },
  },
  { field: 'platformUrl', title: '平台地址', minWidth: 220, showOverflow: true },
  { field: 'modelId', title: 'AI模型', minWidth: 150, slots: { default: 'modelId' } },
  {
    field: 'reviewEnabled',
    title: '审查状态',
    width: 90,
    slots: { default: 'reviewEnabled' },
  },
  {
    field: 'pushReviewEnabled',
    title: 'Push审查',
    width: 90,
    slots: { default: 'pushReviewEnabled' },
  },
  { field: 'reviewStyle', title: '审查风格', width: 90 },
  { field: 'passScore', title: '通过分数', width: 80 },
  { field: 'createTime', title: '创建时间', minWidth: 160,
    formatter: ({ cellValue }) => cellValue ? dayjs(cellValue).format('YYYY-MM-DD HH:mm:ss') : '' },
  { title: '操作', width: 150, fixed: 'right', slots: { default: 'action' } },
];

/** 搜索表单配置 */
export function querySchema() {
  return [
    {
      component: 'Input',
      fieldName: 'projectName',
      label: '项目名称',
      componentProps: {
        placeholder: '请输入项目名称',
        allowClear: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'platform',
      label: '平台',
      componentProps: {
        placeholder: '请选择平台',
        showSearch: true,
        options: [
          { label: 'GitLab', value: 'gitlab' },
          { label: 'GitHub', value: 'github' },
          { label: 'Gitea', value: 'gitea' },
        ],
      },
    },
  ];
}

/** 平台选项 */
export const platformOptions = [
  { label: 'GitLab', value: 'gitlab' },
  { label: 'GitHub', value: 'github' },
  { label: 'Gitea', value: 'gitea' },
];

/** 审查风格选项 */
export const reviewStyleOptions = [
  { label: '专业严谨', value: 'professional' },
  { label: '幽默讽刺', value: 'sarcastic' },
  { label: '温和友善', value: 'gentle' },
  { label: '轻松幽默', value: 'humorous' },
];
