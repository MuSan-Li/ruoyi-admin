<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Card, Row, Col, Select, DatePicker, Statistic, Progress, Tag, Spin, Empty, message, Input } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';
import { marked } from 'marked';

import { statisticsTrend, statisticsReport, statisticsRefresh, statisticsAuthors } from '#/api/codereview/reviewLog';
import { projectConfigList } from '#/api/codereview/projectConfig';

// 项目列表
const projectList = ref<any[]>([]);
const selectedProject = ref<string>('');
const selectedPlatform = ref<string>('');
const selectedAuthor = ref<string>('');
const dateRange = ref<[Dayjs, Dayjs]>();

// 作者列表
const authorList = ref<string[]>([]);

// 统计数据
const trendData = ref<any[]>([]);
const reportContent = ref<string>('');
const reportHtml = ref<string>('');
const loading = ref(false);
const refreshing = ref(false);

// 平台选项
const platformOptions = [
  { label: '全部', value: '' },
  { label: 'GitLab', value: 'gitlab' },
  { label: 'GitHub', value: 'github' },
  { label: 'Gitea', value: 'gitea' },
];

// 计算统计数据
const avgScore = computed(() => {
  if (trendData.value.length === 0) return 0;
  const total = trendData.value.reduce((sum, item) => sum + (item.avgScore || 0), 0);
  return Math.round(total / trendData.value.length);
});

const totalReviews = computed(() => {
  return trendData.value.reduce((sum, item) => sum + (item.totalReviews || 0), 0);
});

const passRate = computed(() => {
  if (trendData.value.length === 0) return 0;
  const passed = trendData.value.reduce((sum, item) => sum + (item.passCount || 0), 0);
  const total = trendData.value.reduce((sum, item) => sum + (item.totalReviews || 0), 0);
  return total > 0 ? Math.round((passed / total) * 100) : 0;
});

const scoreColor = computed(() => {
  if (avgScore.value >= 90) return '#52c41a';
  if (avgScore.value >= 70) return '#1890ff';
  if (avgScore.value >= 60) return '#faad14';
  return '#ff4d4f';
});

// 项目选项
const projectOptions = computed(() => {
  return projectList.value.map(p => ({ label: p.projectName, value: p.projectName }));
});

// 作者选项
const authorOptions = computed(() => {
  const options = authorList.value.map(a => ({ label: a, value: a }));
  return [{ label: '全部', value: '' }, ...options];
});

// 加载项目列表
async function loadProjects() {
  try {
    const result = await projectConfigList({ pageNum: 1, pageSize: 100 });
    projectList.value = result.rows || [];
    if (projectList.value.length > 0) {
      selectedProject.value = projectList.value[0].projectName;
      selectedPlatform.value = projectList.value[0].platform;
      loadAuthors();
      loadStatistics();
    }
  } catch (error) {
    console.error('加载项目列表失败', error);
  }
}

// 加载作者列表
async function loadAuthors() {
  if (!selectedProject.value) return;
  try {
    authorList.value = await statisticsAuthors(selectedProject.value, selectedPlatform.value) || [];
  } catch (error) {
    console.error('加载作者列表失败', error);
    authorList.value = [];
  }
}

// 加载统计数据
async function loadStatistics() {
  if (!selectedProject.value) return;

  loading.value = true;
  try {
    let days = 7;
    if (dateRange.value && dateRange.value.length === 2) {
      const diffDays = Math.ceil((dateRange.value[1].valueOf() - dateRange.value[0].valueOf()) / (1000 * 60 * 60 * 24));
      // 后端 days 参数含义为"最近 N 天"，至少为 1
      days = Math.max(1, diffDays + 1);
    }

    const [trendResult, reportResult] = await Promise.allSettled([
      statisticsTrend(selectedProject.value, selectedPlatform.value, days, selectedAuthor.value),
      statisticsReport(selectedProject.value, selectedPlatform.value, days, selectedAuthor.value),
    ]);

    if (trendResult.status === 'fulfilled') {
      trendData.value = trendResult.value || [];
    }
    if (reportResult.status === 'fulfilled') {
      reportContent.value = reportResult.value || '';
      reportHtml.value = reportContent.value ? marked(reportContent.value) as string : '';
    }
  } catch (error) {
    console.error('加载统计数据失败', error);
  } finally {
    loading.value = false;
  }
}

// 项目选择变更（仅更新关联字段，不自动搜索）
function handleProjectChange(projectName: string) {
  const project = projectList.value.find(p => p.projectName === projectName);
  if (project) {
    selectedPlatform.value = project.platform;
  }
  selectedAuthor.value = '';
  loadAuthors();
}

// Select 搜索过滤
function filterOption(input: string, option: any) {
  const label = option.label || option.children?.[0]?.children || '';
  return label.toLowerCase().includes(input.toLowerCase());
}

// 点击搜索按钮
function handleSearch() {
  loadStatistics();
}

// 重置筛选条件
function handleReset() {
  selectedProject.value = '';
  selectedPlatform.value = '';
  selectedAuthor.value = '';
  dateRange.value = undefined;
  trendData.value = [];
  reportContent.value = '';
  reportHtml.value = '';
}

// 刷新统计数据（补齐历史数据）
async function handleRefresh() {
  if (!selectedProject.value) {
    message.warning('请先选择项目');
    return;
  }

  const platform = selectedPlatform.value || projectList.value.find(p => p.projectName === selectedProject.value)?.platform;
  if (!platform) {
    message.warning('无法确定平台');
    return;
  }

  refreshing.value = true;
  try {
    await statisticsRefresh(selectedProject.value, platform);
    message.success('统计刷新成功');
    await loadStatistics();
  } catch (error: any) {
    message.error(error.message || '统计刷新失败');
  } finally {
    refreshing.value = false;
  }
}

onMounted(() => {
  loadProjects();
});
</script>

<template>
  <Page :auto-content-height="true">
    <div class="p-4">
      <!-- 筛选条件 -->
      <Card class="mb-4">
        <Row :gutter="16" align="middle">
          <Col :span="5">
            <div class="flex items-center">
              <span class="mr-2 w-14 shrink-0">项目:</span>
              <Select
                v-model:value="selectedProject"
                :options="projectOptions"
                show-search
                :filter-option="filterOption"
                placeholder="请选择或输入项目"
                style="width: 100%"
                @change="(val: any) => handleProjectChange(val)"
              />
            </div>
          </Col>
          <Col :span="3">
            <div class="flex items-center">
              <span class="mr-2 shrink-0">平台:</span>
              <Select
                v-model:value="selectedPlatform"
                :options="platformOptions"
                style="width: 100%"
              />
            </div>
          </Col>
          <Col :span="3">
            <div class="flex items-center">
              <span class="mr-2 shrink-0">用户:</span>
              <Select
                v-model:value="selectedAuthor"
                :options="authorOptions"
                show-search
                :filter-option="filterOption"
                placeholder="全部"
                style="width: 100%"
              />
            </div>
          </Col>
          <Col :span="7">
            <div class="flex items-center">
              <span class="mr-2 shrink-0">时间:</span>
              <DatePicker.RangePicker
                v-model:value="dateRange"
                style="width: 100%"
              />
            </div>
          </Col>
          <Col :span="6">
            <div class="flex gap-2">
              <Button type="primary" :loading="loading" @click="handleSearch">搜索</Button>
              <Button @click="handleReset">重置</Button>
              <Button :loading="refreshing" @click="handleRefresh">刷新统计</Button>
            </div>
          </Col>
        </Row>
      </Card>

      <Spin :spinning="loading">
        <!-- 统计概览 -->
        <Row :gutter="16" class="mb-4">
          <Col :span="6">
            <Card>
              <Statistic title="平均评分" :value="avgScore" suffix="分">
                <template #formatter="{ value }">
                  <span :style="{ color: scoreColor }">{{ value }}</span>
                </template>
              </Statistic>
              <Progress
                :percent="avgScore"
                :stroke-color="scoreColor"
                :show-info="false"
                class="mt-2"
              />
            </Card>
          </Col>
          <Col :span="6">
            <Card>
              <Statistic title="审查次数" :value="totalReviews" suffix="次" />
            </Card>
          </Col>
          <Col :span="6">
            <Card>
              <Statistic title="通过率" :value="passRate" suffix="%" />
              <Progress
                :percent="passRate"
                :stroke-color="passRate >= 80 ? '#52c41a' : passRate >= 60 ? '#faad14' : '#ff4d4f'"
                :show-info="false"
                class="mt-2"
              />
            </Card>
          </Col>
          <Col :span="6">
            <Card>
              <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center">
                  <span>优秀 (≥90)</span>
                  <Tag color="success">{{ trendData.filter(d => d.avgScore >= 90).length }}</Tag>
                </div>
                <div class="flex justify-between items-center">
                  <span>良好 (70-89)</span>
                  <Tag color="processing">{{ trendData.filter(d => d.avgScore >= 70 && d.avgScore < 90).length }}</Tag>
                </div>
                <div class="flex justify-between items-center">
                  <span>及格 (60-69)</span>
                  <Tag color="warning">{{ trendData.filter(d => d.avgScore >= 60 && d.avgScore < 70).length }}</Tag>
                </div>
                <div class="flex justify-between items-center">
                  <span>不及格 (&lt;60)</span>
                  <Tag color="error">{{ trendData.filter(d => d.avgScore < 60).length }}</Tag>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <!-- 趋势报告 -->
        <Card title="审查趋势报告">
          <div v-if="reportHtml" class="p-4 bg-gray-50 rounded max-h-[500px] overflow-auto markdown-body" v-html="reportHtml"></div>
          <Empty v-else description="暂无数据，请选择项目查看统计" />
        </Card>
      </Spin>
    </div>
  </Page>
</template>

<style scoped>
.markdown-body {
  font-size: 14px;
  line-height: 1.6;
}
.markdown-body h1 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e8e8e8;
}
.markdown-body h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 16px 0 8px;
}
.markdown-body strong {
  font-weight: 600;
}
.markdown-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
}
.markdown-body th,
.markdown-body td {
  border: 1px solid #e8e8e8;
  padding: 6px 12px;
  text-align: left;
}
.markdown-body th {
  background: #fafafa;
  font-weight: 600;
}
.markdown-body ul {
  padding-left: 20px;
}
.markdown-body li {
  margin: 2px 0;
}
</style>
