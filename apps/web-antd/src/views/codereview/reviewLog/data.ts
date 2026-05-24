import type { VxeGridProps } from '#/adapter/vxe-table';

import dayjs from 'dayjs';

/** MR审查日志表格列配置 */
export const mrColumns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 50 },
  { field: 'projectName', title: '项目名称', minWidth: 120 },
  {
    field: 'platform',
    title: '平台',
    width: 90,
    slots: { default: 'platform' },
  },
  { field: 'author', title: '作者', minWidth: 100 },
  { field: 'sourceBranch', title: '源分支', minWidth: 130 },
  { field: 'targetBranch', title: '目标分支', minWidth: 100 },
  {
    field: 'score',
    title: '评分',
    width: 80,
    slots: { default: 'score' },
  },
  { field: 'additions', title: '新增行', width: 80 },
  { field: 'deletions', title: '删除行', width: 80 },
  { field: 'createTime', title: '审查时间', minWidth: 160,
    formatter: ({ cellValue }) => cellValue ? dayjs(cellValue).format('YYYY-MM-DD HH:mm:ss') : '' },
  { title: '操作', width: 130, fixed: 'right', slots: { default: 'action' } },
];

/** Push审查日志表格列配置 */
export const pushColumns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 50 },
  { field: 'projectName', title: '项目名称', minWidth: 120 },
  {
    field: 'platform',
    title: '平台',
    width: 90,
    slots: { default: 'platform' },
  },
  { field: 'author', title: '作者', minWidth: 100 },
  { field: 'branch', title: '分支', minWidth: 130 },
  {
    field: 'score',
    title: '评分',
    width: 80,
    slots: { default: 'score' },
  },
  { field: 'additions', title: '新增行', width: 80 },
  { field: 'deletions', title: '删除行', width: 80 },
  { field: 'createTime', title: '审查时间', minWidth: 160,
    formatter: ({ cellValue }) => cellValue ? dayjs(cellValue).format('YYYY-MM-DD HH:mm:ss') : '' },
  { title: '操作', width: 130, fixed: 'right', slots: { default: 'action' } },
];

/** 搜索表单配置 */
export function querySchema() {
  return [
    {
      component: 'Select',
      fieldName: 'projectName',
      label: '项目名称',
      componentProps: {
        placeholder: '请选择或输入项目',
        showSearch: true,
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
    {
      component: 'Select',
      fieldName: 'author',
      label: '作者',
      componentProps: {
        placeholder: '请选择或输入作者',
        showSearch: true,
        allowClear: true,
      },
    },
  ];
}
