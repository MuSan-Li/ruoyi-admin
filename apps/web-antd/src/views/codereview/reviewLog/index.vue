<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import { Page, type VbenFormProps } from '@vben/common-ui';
import { getVxePopupContainer } from '@vben/utils';

import { Modal, Popconfirm, Space, Tag, Tabs, TabPane } from 'ant-design-vue';

import {
  useVbenVxeGrid,
  type VxeGridProps,
} from '#/adapter/vxe-table';

import {
  mrReviewLogList,
  mrReviewLogInfo,
  mrReviewLogRemove,
  pushReviewLogList,
  pushReviewLogInfo,
  pushReviewLogRemove,
  statisticsAuthors,
} from '#/api/codereview/reviewLog';

import { projectConfigList } from '#/api/codereview/projectConfig';

import { mrColumns, pushColumns, querySchema } from './data';

// 加载项目选项并注入到表单 schema
const projectOptions = ref<{ label: string; value: string }[]>([]);
const authorOptions = ref<{ label: string; value: string }[]>([]);

async function loadProjectOptions() {
  try {
    const result = await projectConfigList({ pageNum: 1, pageSize: 100 });
    const rows: any[] = result.rows || [];
    projectOptions.value = rows.map((p: any) => ({ label: p.projectName, value: p.projectName }));
  } catch {
    projectOptions.value = [];
  }
}

async function loadAuthorOptions() {
  try {
    const authors = await statisticsAuthors('') || [];
    authorOptions.value = authors.map((a: string) => ({ label: a, value: a }));
  } catch {
    authorOptions.value = [];
  }
}

const mrSchema = querySchema();
const pushSchema = querySchema();

// MR 审查日志表格
const mrFormOptions: VbenFormProps = {
  commonConfig: {
    labelWidth: 80,
    componentProps: { allowClear: true },
  },
  schema: mrSchema,
  wrapperClass: 'grid-cols-1 md:grid-cols-4',
  showCollapseButton: false,
};

const mrGridOptions: VxeGridProps = {
  checkboxConfig: { highlight: true, reserve: true },
  columns: mrColumns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        return await mrReviewLogList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
      },
    },
  },
  rowConfig: { keyField: 'id' },
  id: 'codereview-mr-log',
};

const [MrTable, mrTableApi] = useVbenVxeGrid({
  formOptions: mrFormOptions,
  gridOptions: mrGridOptions,
});

// Push 审查日志表格
const pushFormOptions: VbenFormProps = {
  commonConfig: {
    labelWidth: 80,
    componentProps: { allowClear: true },
  },
  schema: pushSchema,
  wrapperClass: 'grid-cols-1 md:grid-cols-4',
  showCollapseButton: false,
};

const pushGridOptions: VxeGridProps = {
  checkboxConfig: { highlight: true, reserve: true },
  columns: pushColumns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        return await pushReviewLogList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
      },
    },
  },
  rowConfig: { keyField: 'id' },
  id: 'codereview-push-log',
};

const [PushTable, pushTableApi] = useVbenVxeGrid({
  formOptions: pushFormOptions,
  gridOptions: pushGridOptions,
});

// 详情弹窗
const detailVisible = ref(false);
const detailContent = ref<string>('');
const detailTitle = ref<string>('');

async function viewMrDetail(row: any) {
  const result = await mrReviewLogInfo(row.id);
  detailTitle.value = `MR审查详情 - ${row.projectName}`;
  detailContent.value = result.reviewResult || '无审查结果';
  detailVisible.value = true;
}

async function viewPushDetail(row: any) {
  const result = await pushReviewLogInfo(row.id);
  detailTitle.value = `Push审查详情 - ${row.projectName}`;
  detailContent.value = result.reviewResult || '无审查结果';
  detailVisible.value = true;
}

async function deleteMrLog(row: any) {
  await mrReviewLogRemove(row.id);
  await mrTableApi.query();
}

async function deletePushLog(row: any) {
  await pushReviewLogRemove(row.id);
  await pushTableApi.query();
}

const getPlatformColor = computed(() => (platform: string) => {
  const colorMap: Record<string, string> = {
    gitlab: 'orange',
    github: 'blue',
    gitea: 'green',
  };
  return colorMap[platform] || 'default';
});

const getScoreColor = computed(() => (score: number) => {
  if (score >= 90) return 'success';
  if (score >= 70) return 'processing';
  if (score >= 60) return 'warning';
  return 'error';
});

const activeTabKey = ref('mr');

onMounted(async () => {
  await Promise.all([loadProjectOptions(), loadAuthorOptions()]);
  // 注入选项到 schema
  const injectOptions = (schema: any[]) => {
    const projectField = schema.find((s: any) => s.fieldName === 'projectName');
    if (projectField) {
      projectField.componentProps = {
        ...projectField.componentProps,
        options: projectOptions.value,
      };
    }
    const authorField = schema.find((s: any) => s.fieldName === 'author');
    if (authorField) {
      authorField.componentProps = {
        ...authorField.componentProps,
        options: authorOptions.value,
      };
    }
  };
  injectOptions(mrSchema);
  injectOptions(pushSchema);
});
</script>

<template>
  <Page :auto-content-height="true">
    <Tabs v-model:activeKey="activeTabKey" class="h-full flex-tabs">
      <TabPane key="mr" tab="MR/PR 审查日志">
        <MrTable v-if="activeTabKey === 'mr'" table-title="MR/PR 审查日志">
          <template #platform="{ row }">
            <Tag :color="getPlatformColor(row.platform)">
              {{ row.platform?.toUpperCase() }}
            </Tag>
          </template>
          <template #score="{ row }">
            <Tag :color="getScoreColor(row.score)">
              {{ row.score }}分
            </Tag>
          </template>
          <template #action="{ row }">
            <Space>
              <ghost-button @click.stop="viewMrDetail(row)">
                查看
              </ghost-button>
              <Popconfirm
                :get-popup-container="getVxePopupContainer"
                placement="left"
                title="确认删除？"
                @confirm="deleteMrLog(row)"
              >
                <ghost-button danger @click.stop="">
                  删除
                </ghost-button>
              </Popconfirm>
            </Space>
          </template>
        </MrTable>
      </TabPane>

      <TabPane key="push" tab="Push 审查日志">
        <PushTable v-if="activeTabKey === 'push'" table-title="Push 审查日志">
          <template #platform="{ row }">
            <Tag :color="getPlatformColor(row.platform)">
              {{ row.platform?.toUpperCase() }}
            </Tag>
          </template>
          <template #score="{ row }">
            <Tag :color="getScoreColor(row.score)">
              {{ row.score }}分
            </Tag>
          </template>
          <template #action="{ row }">
            <Space>
              <ghost-button @click.stop="viewPushDetail(row)">
                查看
              </ghost-button>
              <Popconfirm
                :get-popup-container="getVxePopupContainer"
                placement="left"
                title="确认删除？"
                @confirm="deletePushLog(row)"
              >
                <ghost-button danger @click.stop="">
                  删除
                </ghost-button>
              </Popconfirm>
            </Space>
          </template>
        </PushTable>
      </TabPane>
    </Tabs>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      :title="detailTitle"
      width="800px"
      :footer="null"
    >
      <div class="p-4 bg-gray-50 rounded max-h-[500px] overflow-auto">
        <pre class="whitespace-pre-wrap text-sm">{{ detailContent }}</pre>
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.flex-tabs {
  display: flex;
  flex-direction: column;
}
.flex-tabs :deep(.ant-tabs-content-holder) {
  flex: 1;
  overflow: hidden;
}
.flex-tabs :deep(.ant-tabs-content) {
  height: 100%;
}
.flex-tabs :deep(.ant-tabs-tabpane-active) {
  height: 100%;
}
</style>