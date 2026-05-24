<script setup lang="ts">
import type { RuleObject } from 'ant-design-vue/es/form';

import { computed, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { cloneDeep } from '@vben/utils';

import {
  Button,
  Card,
  Col,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Switch,
  Tabs,
  TabPane,
  Textarea,
} from 'ant-design-vue';
import { pick } from 'lodash-es';

import {
  projectConfigAdd,
  projectConfigInfo,
  projectConfigTestConnection,
  projectConfigTestNotification,
  projectConfigUpdate,
} from '#/api/codereview/projectConfig';
import type { NotificationChannel, ReviewRule } from '#/api/codereview/projectConfig';

import { modelList } from '#/api/chat/model';

import { platformOptions, reviewStyleOptions } from './data';

/** 表单数据类型 */
type FormData = Partial<import('#/api/codereview/projectConfig').ProjectConfigForm>;

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const activeTab = ref('basic');

// 模型选项列表
const modelOptions = ref<{ label: string; value: number }[]>([]);

async function loadModelOptions() {
  try {
    const result = await modelList({ pageNum: 1, pageSize: 200 });
    const rows: any[] = result.rows || [];
    modelOptions.value = rows.map((m: any) => ({
      label: m.modelName,
      value: m.id,
    }));
  } catch {
    modelOptions.value = [];
  }
}

// 页面加载时获取模型列表
loadModelOptions();

// 通知渠道列表
const notificationChannels = ref<NotificationChannel[]>([]);
// 自定义规则列表
const customRules = ref<ReviewRule[]>([]);

const title = computed(() => {
  return isUpdate.value ? '编辑项目配置' : '新增项目配置';
});

/**
 * 定义默认值
 */
const defaultValues: FormData = {
  id: undefined,
  projectName: undefined,
  platform: undefined,
  projectId: undefined,
  platformUrl: undefined,
  platformToken: undefined,
  webhookSecret: undefined,
  modelId: undefined,
  reviewEnabled: 1,
  pushReviewEnabled: 1,
  protectedBranchesOnly: 0,
  fileExtensions: '.java,.js,.ts,.vue,.py,.go,.md,.json,.yml',
  excludePatterns: undefined,
  maxFilesPerReview: 20,
  maxTokens: 10000,
  reviewStyle: 'professional',
  passScore: 60,
  notificationChannels: undefined,
  customRules: undefined,
};

/**
 * 表单数据 - 使用 reactive 以配合 Form.useForm
 */
const formData = reactive<FormData>(cloneDeep(defaultValues));

type AntdFormRules<T> = Partial<Record<keyof T, RuleObject[]>> & {
  [key: string]: RuleObject[];
};

/**
 * 表单校验规则
 */
const formRules = reactive<AntdFormRules<FormData>>({
  projectName: [{ required: true, message: '请输入项目名称' }],
  platform: [{ required: true, message: '请选择平台' }],
  platformUrl: [{ required: true, message: '请输入平台地址' }],
});

/**
 * useForm解构出表单方法
 */
const { validate, resetFields } = Form.useForm(formData, formRules);

const [BasicModal, modalApi] = useVbenModal({
  class: 'w-[800px]',
  fullscreenButton: false,
  closeOnClickModal: false,
  onClosed: handleCancel,
  onConfirm: handleConfirm,
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      return null;
    }
    modalApi.modalLoading(true);

    const { id } = modalApi.getData() as { id?: number | string };
    isUpdate.value = !!id;

    if (isUpdate.value && id) {
      try {
        const record = await projectConfigInfo(id);
        const filterRecord = pick(record, Object.keys(defaultValues));
        Object.assign(formData, filterRecord);

        // 解析通知渠道
        if (record.notificationChannels) {
          try {
            notificationChannels.value = JSON.parse(record.notificationChannels);
          } catch {
            notificationChannels.value = [];
          }
        }

        // 解析自定义规则
        if (record.customRules) {
          try {
            customRules.value = JSON.parse(record.customRules);
          } catch {
            customRules.value = [];
          }
        }
      } catch (error) {
        console.error('加载项目配置失败:', error);
      }
    } else {
      notificationChannels.value = [];
      customRules.value = [];
    }

    modalApi.modalLoading(false);
  },
});

async function handleConfirm() {
  try {
    modalApi.modalLoading(true);
    await validate();

    // 序列化通知渠道和规则
    const data = cloneDeep(formData);
    data.notificationChannels = JSON.stringify(notificationChannels.value);
    data.customRules = JSON.stringify(customRules.value);

    await (isUpdate.value ? projectConfigUpdate(data) : projectConfigAdd(data));
    emit('reload');
    await handleCancel();
  } catch (error: any) {
    console.error(error);
    message.error(error.message || '操作失败');
  } finally {
    modalApi.modalLoading(false);
  }
}

async function handleCancel() {
  modalApi.close();
  Object.assign(formData, cloneDeep(defaultValues));
  notificationChannels.value = [];
  customRules.value = [];
  resetFields();
}

/** 测试连接 */
async function handleTestConnection() {
  try {
    await projectConfigTestConnection(formData);
    message.success('连接测试成功');
  } catch (error: any) {
    message.error(error.message || '连接测试失败');
  }
}

/** 测试通知 */
async function handleTestNotification() {
  try {
    // 临时设置通知渠道用于测试
    const testData = cloneDeep(formData);
    testData.notificationChannels = JSON.stringify(notificationChannels.value);
    await projectConfigTestNotification(testData);
    message.success('通知发送成功');
  } catch (error: any) {
    message.error(error.message || '通知发送失败');
  }
}

/** 添加通知渠道 */
function addNotificationChannel() {
  notificationChannels.value.push({
    type: 'wecom',
    webhookUrl: '',
    enabled: true,
  });
}

/** 删除通知渠道 */
function removeNotificationChannel(index: number) {
  notificationChannels.value.splice(index, 1);
}

/** 添加自定义规则 */
function addCustomRule() {
  customRules.value.push({
    ruleName: '',
    description: '',
  });
}

/** 删除自定义规则 */
function removeCustomRule(index: number) {
  customRules.value.splice(index, 1);
}

/** 通知类型选项 */
const notificationTypeOptions = [
  { label: '企业微信', value: 'wecom' },
  { label: '钉钉', value: 'dingtalk' },
  { label: '飞书', value: 'feishu' },
  { label: '自定义Webhook', value: 'webhook' },
];

/** 模型搜索过滤 */
function filterModelOption(input: string, option: any) {
  const label = option.label || '';
  return label.toLowerCase().includes(input.toLowerCase());
}
</script>

<template>
  <BasicModal :title="title">
    <Form :model="formData" :label-col="{ span: 24 }" :wrapper-col="{ span: 24 }">
      <Tabs v-model:active-key="activeTab">
        <TabPane key="basic" tab="基本配置">
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="项目名称" name="projectName" required>
                <Input
                  v-model:value="formData.projectName"
                  placeholder="请输入项目名称（与Git平台一致）"
                />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="平台" name="platform" required>
                <Select
                  v-model:value="formData.platform"
                  :options="platformOptions"
                  placeholder="请选择平台"
                />
              </FormItem>
            </Col>
          </Row>

          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="平台项目ID">
                <Input
                  v-model:value="formData.projectId"
                  placeholder="平台项目ID（可选）"
                />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="AI模型" name="modelId">
                <Select
                  v-model:value="formData.modelId"
                  :options="modelOptions"
                  show-search
                  :filter-option="filterModelOption"
                  placeholder="请选择或输入模型名称"
                  style="width: 100%"
                  allow-clear
                />
              </FormItem>
            </Col>
          </Row>

          <FormItem label="平台地址" name="platformUrl" required>
            <Input
              v-model:value="formData.platformUrl"
              placeholder="如: https://github.com 或 https://gitlab.example.com"
            />
          </FormItem>

          <Row :gutter="16">
            <Col :span="16">
              <FormItem label="平台Token">
                <Input.Password
                  v-model:value="formData.platformToken"
                  placeholder="平台访问Token（可选）"
                />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label=" ">
                <Button type="default" @click="handleTestConnection">
                  测试连接
                </Button>
              </FormItem>
            </Col>
          </Row>

          <FormItem label="Webhook密钥">
            <Input.Password
              v-model:value="formData.webhookSecret"
              placeholder="Webhook验证密钥（可选）"
            />
          </FormItem>
        </TabPane>

        <TabPane key="review" tab="审查配置">
          <Row :gutter="16">
            <Col :span="8">
              <FormItem label="启用MR审查">
                <Switch
                  v-model:checked="formData.reviewEnabled"
                  :checked-value="1"
                  :un-checked-value="0"
                />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="启用Push审查">
                <Switch
                  v-model:checked="formData.pushReviewEnabled"
                  :checked-value="1"
                  :un-checked-value="0"
                />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="仅审查保护分支">
                <Switch
                  v-model:checked="formData.protectedBranchesOnly"
                  :checked-value="1"
                  :un-checked-value="0"
                />
              </FormItem>
            </Col>
          </Row>

          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="审查风格">
                <Select
                  v-model:value="formData.reviewStyle"
                  :options="reviewStyleOptions"
                />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="通过分数">
                <InputNumber
                  v-model:value="formData.passScore"
                  :min="0"
                  :max="100"
                  style="width: 100%"
                  addon-after="分"
                />
              </FormItem>
            </Col>
          </Row>

          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="最大Token数">
                <InputNumber
                  v-model:value="formData.maxTokens"
                  :min="1000"
                  :max="100000"
                  style="width: 100%"
                />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="最大文件数">
                <InputNumber
                  v-model:value="formData.maxFilesPerReview"
                  :min="1"
                  :max="100"
                  style="width: 100%"
                />
              </FormItem>
            </Col>
          </Row>

          <FormItem label="文件扩展名">
            <Textarea
              v-model:value="formData.fileExtensions"
              :rows="2"
              placeholder=".java,.js,.ts,.vue,.py,.go"
            />
          </FormItem>

          <FormItem label="排除模式">
            <Textarea
              v-model:value="formData.excludePatterns"
              :rows="2"
              placeholder="target/,node_modules/,.git/"
            />
          </FormItem>
        </TabPane>

        <TabPane key="notification" tab="通知配置">
          <div class="mb-4 flex gap-2">
            <Button type="dashed" @click="addNotificationChannel">
              + 添加通知渠道
            </Button>
            <Button type="default" @click="handleTestNotification">
              测试通知
            </Button>
          </div>

          <Card
            v-for="(channel, index) in notificationChannels"
            :key="index"
            size="small"
            class="mb-3"
          >
            <template #title>
              <div class="flex items-center justify-between">
                <span>通知渠道 {{ index + 1 }}</span>
                <Button type="link" danger size="small" @click="removeNotificationChannel(index)">
                  删除
                </Button>
              </div>
            </template>

            <Row :gutter="16">
              <Col :span="12">
                <FormItem label="类型">
                  <Select
                    v-model:value="channel.type"
                    :options="notificationTypeOptions"
                  />
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="启用">
                  <Switch v-model:checked="channel.enabled" />
                </FormItem>
              </Col>
            </Row>

            <FormItem label="Webhook URL">
              <Input
                v-model:value="channel.webhookUrl"
                placeholder="请输入Webhook地址"
              />
            </FormItem>

            <FormItem v-if="channel.type === 'dingtalk'" label="签名密钥">
              <Input
                v-model:value="channel.secret"
                placeholder="钉钉签名密钥（可选）"
              />
            </FormItem>
          </Card>

          <div v-if="notificationChannels.length === 0" class="text-center text-gray-400 py-4">
            暂无通知渠道，点击上方按钮添加
          </div>
        </TabPane>

        <TabPane key="rules" tab="自定义规则">
          <div class="mb-4">
            <Button type="dashed" @click="addCustomRule">
              + 添加审查规则
            </Button>
          </div>

          <Card
            v-for="(rule, index) in customRules"
            :key="index"
            size="small"
            class="mb-3"
          >
            <template #title>
              <div class="flex items-center justify-between">
                <span>规则 {{ index + 1 }}</span>
                <Button type="link" danger size="small" @click="removeCustomRule(index)">
                  删除
                </Button>
              </div>
            </template>

            <FormItem label="规则名称">
              <Input
                v-model:value="rule.ruleName"
                placeholder="如: 禁止System.out"
              />
            </FormItem>

            <FormItem label="规则描述">
              <Textarea
                v-model:value="rule.description"
                :rows="2"
                placeholder="规则详细说明"
              />
            </FormItem>
          </Card>

          <div v-if="customRules.length === 0" class="text-center text-gray-400 py-4">
            暂无自定义规则，点击上方按钮添加
          </div>
        </TabPane>
      </Tabs>
    </Form>
  </BasicModal>
</template>

<style scoped>
:deep(.ant-form-item) {
  padding: 0 8px;
  margin-bottom: 16px;
}

:deep(.ant-form-item-label) {
  padding-bottom: 4px;
  text-align: left !important;
}

:deep(.ant-form-item-label > label) {
  justify-content: flex-start !important;
  font-weight: 500;
  color: rgb(0 0 0 / 85%);
  text-align: left !important;
}

:deep(.ant-card-head-title) {
  padding: 8px 0;
}

:deep(.ant-card-body) {
  padding: 12px;
}
</style>
