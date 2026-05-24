<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';

import { Page, useVbenModal, type VbenFormProps } from '@vben/common-ui';
import { getVxePopupContainer } from '@vben/utils';

import { Modal, Popconfirm, Space, Tag, Switch, message } from 'ant-design-vue';

import {
  useVbenVxeGrid,
  vxeCheckboxChecked,
  type VxeGridProps,
} from '#/adapter/vxe-table';

import {
  projectConfigList,
  projectConfigRemove,
  projectConfigChangeStatus,
} from '#/api/codereview/projectConfig';

import { modelList } from '#/api/chat/model';

import configModal from './config-modal.vue';
import { columns, querySchema } from './data';

// 模型名称映射
const modelMap = ref<Record<number, string>>({});

async function loadModelMap() {
  try {
    const result = await modelList({ pageNum: 1, pageSize: 200 });
    const rows: any[] = result.rows || [];
    for (const m of rows) {
      modelMap.value[m.id as number] = m.modelName;
    }
  } catch {
    // ignore
  }
}

onMounted(() => {
  loadModelMap();
});

const formOptions: VbenFormProps = {
  commonConfig: {
    labelWidth: 80,
    componentProps: {
      allowClear: true,
    },
  },
  schema: querySchema(),
  wrapperClass: 'grid-cols-1 md:grid-cols-3',
  showCollapseButton: false,
};

const gridOptions: VxeGridProps = {
  checkboxConfig: {
    highlight: true,
    reserve: true,
  },
  columns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        return await projectConfigList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
      },
    },
  },
  rowConfig: {
    keyField: 'id',
  },
  id: 'codereview-project-config',
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

const [ConfigModal, modalApi] = useVbenModal({
  connectedComponent: configModal,
});

function handleAdd() {
  modalApi.setData({});
  modalApi.open();
}

function handleEdit(row: any) {
  modalApi.setData({ id: row.id });
  modalApi.open();
}

async function handleDelete(row: any) {
  await projectConfigRemove(row.id);
  await tableApi.query();
}

function handleMultiDelete() {
  const rows = tableApi.grid.getCheckboxRecords();
  const ids = rows.map((row: any) => row.id);
  Modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await projectConfigRemove(ids);
      await tableApi.query();
    },
  });
}

/** 切换审查状态 */
async function handleStatusChange(row: any, checked: boolean) {
  try {
    await projectConfigChangeStatus(row.id as number, checked ? 1 : 0);
    message.success('状态修改成功');
    await tableApi.query();
  } catch (error) {
    message.error('状态修改失败');
  }
}

/** 获取平台标签颜色 */
const getPlatformColor = computed(() => (platform: string) => {
  const colorMap: Record<string, string> = {
    gitlab: 'orange',
    github: 'blue',
    gitea: 'green',
  };
  return colorMap[platform] || 'default';
});
</script>

<template>
  <Page :auto-content-height="true">
    <BasicTable table-title="项目配置管理">
      <template #toolbar-tools>
        <Space>
          <a-button
            :disabled="!vxeCheckboxChecked(tableApi)"
            danger
            type="primary"
            v-access:code="['codereview:projectConfig:remove']"
            @click="handleMultiDelete"
          >
            删除
          </a-button>
          <a-button
            type="primary"
            v-access:code="['codereview:projectConfig:add']"
            @click="handleAdd"
          >
            新增
          </a-button>
        </Space>
      </template>

      <template #platform="{ row }">
        <Tag :color="getPlatformColor(row.platform)">
          {{ row.platform?.toUpperCase() }}
        </Tag>
      </template>

      <template #modelId="{ row }">
        {{ modelMap[row.modelId] || row.modelId }}
      </template>

      <template #reviewEnabled="{ row }">
        <Switch
          :checked="row.reviewEnabled === 1"
          checked-children="启用"
          un-checked-children="禁用"
          @change="(checked: any) => handleStatusChange(row, !!checked)"
        />
      </template>

      <template #pushReviewEnabled="{ row }">
        <Tag :color="row.pushReviewEnabled === 1 ? 'success' : 'default'">
          {{ row.pushReviewEnabled === 1 ? '启用' : '禁用' }}
        </Tag>
      </template>

      <template #action="{ row }">
        <Space>
          <ghost-button
            v-access:code="['codereview:projectConfig:edit']"
            @click.stop="handleEdit(row)"
          >
            编辑
          </ghost-button>
          <Popconfirm
            :get-popup-container="getVxePopupContainer"
            placement="left"
            title="确认删除？"
            @confirm="handleDelete(row)"
          >
            <ghost-button
              danger
              v-access:code="['codereview:projectConfig:remove']"
              @click.stop=""
            >
              删除
            </ghost-button>
          </Popconfirm>
        </Space>
      </template>
    </BasicTable>
    <ConfigModal @reload="tableApi.query()" />
  </Page>
</template>
