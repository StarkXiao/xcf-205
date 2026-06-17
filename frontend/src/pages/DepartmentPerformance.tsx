import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  DatePicker,
  Select,
  Tabs,
  Space,
  Tooltip,
} from 'antd';
import {
  TrophyOutlined,
  FileTextOutlined,
  FormOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import {
  getDepartmentRanking,
  getMonthlySummary,
  getWorkOrderDetailReport,
  getEventDetailReport,
  getInspectionDetailReport,
  getDepartmentList,
} from '../api/performance';

const { Option } = Select;

const DepartmentPerformance = () => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>();
  const [departmentList, setDepartmentList] = useState<any[]>([]);
  const [rankingData, setRankingData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [workOrderDetails, setWorkOrderDetails] = useState<any[]>([]);
  const [eventDetails, setEventDetails] = useState<any[]>([]);
  const [inspectionDetails, setInspectionDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const year = currentMonth.year();
  const month = currentMonth.month() + 1;

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    loadAllData();
  }, [currentMonth]);

  const loadDepartments = async () => {
    try {
      const data = await getDepartmentList();
      setDepartmentList(data);
    } catch (error) {
      console.error('加载部门列表失败:', error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [ranking, summaryData, workOrders, events, inspections] = await Promise.all([
        getDepartmentRanking(year, month),
        getMonthlySummary(year, month),
        getWorkOrderDetailReport(year, month, selectedDepartment),
        getEventDetailReport(year, month, selectedDepartment),
        getInspectionDetailReport(year, month, selectedDepartment),
      ]);
      setRankingData(ranking);
      setSummary(summaryData);
      setWorkOrderDetails(workOrders);
      setEventDetails(events);
      setInspectionDetails(inspections);
    } catch (error) {
      console.error('加载考核数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = (value: string | undefined) => {
    setSelectedDepartment(value);
  };

  const handleFilter = () => {
    loadAllData();
  };

  const getRankingChartOption = () => {
    const depts = rankingData.map(item => item.department);
    const scores = rankingData.map(item => item.totalScore);
    const completionRates = rankingData.map(item => item.workOrders.completionRate);
    const onTimeRates = rankingData.map(item => item.workOrders.onTimeRate);
    const verifyPassRates = rankingData.map(item => item.workOrders.verifyPassRate);
    const responseRates = rankingData.map(item => item.events.responseRate);
    const inspectionPassRates = rankingData.map(item => item.inspections.passRate);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['综合评分', '工单完成率', '按时完成率', '核查通过率', '事件响应率', '巡检通过率'],
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: depts,
        axisLabel: { rotate: 30, fontSize: 11 },
      },
      yAxis: [
        {
          type: 'value',
          name: '评分/百分比',
          max: 100,
          axisLabel: { formatter: '{value}' },
        },
      ],
      series: [
        {
          name: '综合评分',
          type: 'bar',
          data: scores,
          itemStyle: { color: '#1890ff' },
          barWidth: '10%',
        },
        {
          name: '工单完成率',
          type: 'line',
          data: completionRates,
          itemStyle: { color: '#52c41a' },
        },
        {
          name: '按时完成率',
          type: 'line',
          data: onTimeRates,
          itemStyle: { color: '#faad14' },
        },
        {
          name: '核查通过率',
          type: 'line',
          data: verifyPassRates,
          itemStyle: { color: '#722ed1' },
        },
        {
          name: '事件响应率',
          type: 'line',
          data: responseRates,
          itemStyle: { color: '#eb2f96' },
        },
        {
          name: '巡检通过率',
          type: 'line',
          data: inspectionPassRates,
          itemStyle: { color: '#13c2c2' },
        },
      ],
    };
  };

  const rankingColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (rank: number) => {
        if (rank <= 3) {
          const colors = ['#f5222d', '#fa8c16', '#faad14'];
          return (
            <span style={{ color: colors[rank - 1], fontWeight: 'bold', fontSize: 16 }}>
              <TrophyOutlined /> {rank}
            </span>
          );
        }
        return rank;
      },
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
    },
    {
      title: '工单完成率',
      dataIndex: ['workOrders', 'completionRate'],
      key: 'completionRate',
      render: (rate: number) => (
        <Tag color={rate >= 80 ? 'green' : rate >= 60 ? 'orange' : 'red'}>{rate}%</Tag>
      ),
    },
    {
      title: '按时完成率',
      dataIndex: ['workOrders', 'onTimeRate'],
      key: 'onTimeRate',
      render: (rate: number) => (
        <Tag color={rate >= 80 ? 'green' : rate >= 60 ? 'orange' : 'red'}>{rate}%</Tag>
      ),
    },
    {
      title: '核查通过率',
      dataIndex: ['workOrders', 'verifyPassRate'],
      key: 'verifyPassRate',
      render: (rate: number) => (
        <Tag color={rate >= 80 ? 'green' : rate >= 60 ? 'orange' : 'red'}>{rate}%</Tag>
      ),
    },
    {
      title: '平均处理时长',
      dataIndex: ['workOrders', 'avgHandleDurationText'],
      key: 'avgHandleDurationText',
    },
    {
      title: '事件响应率',
      dataIndex: ['events', 'responseRate'],
      key: 'responseRate',
      render: (rate: number) => (
        <Tag color={rate >= 80 ? 'green' : rate >= 60 ? 'orange' : 'red'}>{rate}%</Tag>
      ),
    },
    {
      title: '平均响应时长',
      dataIndex: ['events', 'avgResponseDurationText'],
      key: 'avgResponseDurationText',
    },
    {
      title: '巡检通过率',
      dataIndex: ['inspections', 'passRate'],
      key: 'inspectionPassRate',
      render: (rate: number) => (
        <Tag color={rate >= 80 ? 'green' : rate >= 60 ? 'orange' : 'red'}>{rate}%</Tag>
      ),
    },
    {
      title: '综合评分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 100,
      render: (score: number) => (
        <span style={{ fontWeight: 'bold', color: score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#f5222d' }}>
          {score}
        </span>
      ),
    },
  ];

  const workOrderColumns = [
    { title: '工单编号', dataIndex: 'orderNo', key: 'orderNo', width: 150 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '部门', dataIndex: 'department', key: 'department', width: 100 },
    { title: '处理人', dataIndex: 'handlerName', key: 'handlerName', width: 100 },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p: string) => {
        const colorMap: Record<string, string> = {
          low: 'green',
          medium: 'blue',
          high: 'orange',
          urgent: 'red',
        };
        const nameMap: Record<string, string> = {
          low: '低',
          medium: '中',
          high: '高',
          urgent: '紧急',
        };
        return <Tag color={colorMap[p]}>{nameMap[p] || p}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'default', text: '待分派' },
          assigned: { color: 'processing', text: '已分派' },
          processing: { color: 'processing', text: '处理中' },
          completed: { color: 'warning', text: '已完成' },
          verified: { color: 'success', text: '已核查' },
          closed: { color: 'success', text: '已关闭' },
        };
        const cfg = statusMap[s] || { color: 'default', text: s };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (t: string) => t && dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '首次响应时间',
      dataIndex: 'firstResponseTime',
      key: 'firstResponseTime',
      width: 160,
      render: (t: string) => (t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'),
    },
    { title: '响应时长', dataIndex: 'responseDurationText', key: 'responseDurationText', width: 100 },
    {
      title: '是否按时完成',
      dataIndex: 'isOnTime',
      key: 'isOnTime',
      width: 100,
      render: (v: boolean) => {
        if (v === null || v === undefined) return '-';
        return <Tag color={v ? 'green' : 'red'}>{v ? '是' : '否'}</Tag>;
      },
    },
    {
      title: '核查是否通过',
      dataIndex: 'verifyPassed',
      key: 'verifyPassed',
      width: 100,
      render: (v: boolean) => {
        if (v === null || v === undefined) return '-';
        return <Tag color={v ? 'green' : v === false ? 'red' : 'default'}>{v ? '通过' : '未通过'}</Tag>;
      },
    },
  ];

  const eventColumns = [
    { title: '工单编号', dataIndex: 'orderNo', key: 'orderNo', width: 150 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '部门', dataIndex: 'department', key: 'department', width: 100 },
    { title: '处理人', dataIndex: 'handlerName', key: 'handlerName', width: 100 },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (c: string) => {
        const map: Record<string, string> = {
          road: '道路设施',
          sanitation: '环境卫生',
          greening: '园林绿化',
          facility: '公共设施',
          noise: '噪声污染',
          water: '供排水',
          electricity: '电力设施',
          gas: '燃气设施',
          other: '其他',
        };
        return map[c] || c;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p: string) => {
        const colorMap: Record<string, string> = {
          low: 'green',
          medium: 'blue',
          high: 'orange',
          urgent: 'red',
        };
        const nameMap: Record<string, string> = {
          low: '低',
          medium: '中',
          high: '高',
          urgent: '紧急',
        };
        return <Tag color={colorMap[p]}>{nameMap[p] || p}</Tag>;
      },
    },
    { title: '上报人', dataIndex: 'reporterName', key: 'reporterName', width: 100 },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (t: string) => t && dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '首次响应时间',
      dataIndex: 'firstResponseTime',
      key: 'firstResponseTime',
      width: 160,
      render: (t: string) => (t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'),
    },
    { title: '响应时长', dataIndex: 'responseDurationText', key: 'responseDurationText', width: 100 },
    {
      title: '是否解决',
      dataIndex: 'isResolved',
      key: 'isResolved',
      width: 90,
      render: (v: boolean) => <Tag color={v ? 'green' : 'orange'}>{v ? '已解决' : '处理中'}</Tag>,
    },
  ];

  const inspectionColumns = [
    { title: '巡检计划', dataIndex: 'planName', key: 'planName', ellipsis: true },
    { title: '执行人', dataIndex: 'assigneeName', key: 'assigneeName', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'default', text: '待执行' },
          in_progress: { color: 'processing', text: '执行中' },
          completed: { color: 'success', text: '已完成' },
          exception: { color: 'error', text: '有异常' },
        };
        const cfg = statusMap[s] || { color: 'default', text: s };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '计划日期',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      width: 120,
      render: (t: string) => t && dayjs(t).format('YYYY-MM-DD'),
    },
    { title: '打卡点总数', dataIndex: 'totalCheckpoints', key: 'totalCheckpoints', width: 100 },
    { title: '已打卡', dataIndex: 'checkinCount', key: 'checkinCount', width: 90 },
    {
      title: '完成率',
      dataIndex: 'completionRate',
      key: 'completionRate',
      render: (rate: number) => (
        <Tag color={rate >= 80 ? 'green' : rate >= 60 ? 'orange' : 'red'}>{rate}%</Tag>
      ),
    },
    { title: '异常数量', dataIndex: 'exceptionCount', key: 'exceptionCount', width: 90 },
    {
      title: '是否通过',
      dataIndex: 'isPassed',
      key: 'isPassed',
      width: 90,
      render: (v: boolean) => {
        if (v === null || v === undefined) return '-';
        return <Tag color={v ? 'green' : 'red'}>{v ? '通过' : '未通过'}</Tag>;
      },
    },
  ];

  const rankingTab = (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="工单完成率"
              value={summary.workOrders?.completionRate || 0}
              suffix="%"
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="事件响应率"
              value={summary.events?.responseRate || 0}
              suffix="%"
              prefix={<FormOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="核查通过率"
              value={summary.workOrders?.verifyPassRate || 0}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="巡检通过率"
              value={summary.inspections?.passRate || 0}
              suffix="%"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <div className="chart-card">
            <div className="chart-title">部门考核综合排名对比</div>
            <ReactECharts option={getRankingChartOption()} style={{ height: 360 }} />
          </div>
        </Col>
      </Row>

      <div className="chart-card">
        <div className="chart-title">部门月度绩效考核排名</div>
        <Table
          dataSource={rankingData.map((item, index) => ({ ...item, key: index }))}
          columns={rankingColumns}
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
        />
      </div>
    </div>
  );

  const workOrderTab = (
    <div className="chart-card">
      <div className="chart-title">工单时效明细报表</div>
      <Table
        dataSource={workOrderDetails.map((item, index) => ({ ...item, key: index }))}
        columns={workOrderColumns}
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ x: 1600 }}
      />
    </div>
  );

  const eventTab = (
    <div className="chart-card">
      <div className="chart-title">事件响应明细报表</div>
      <Table
        dataSource={eventDetails.map((item, index) => ({ ...item, key: index }))}
        columns={eventColumns}
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ x: 1600 }}
      />
    </div>
  );

  const inspectionTab = (
    <div className="chart-card">
      <div className="chart-title">核查通过明细报表</div>
      <Table
        dataSource={inspectionDetails.map((item, index) => ({ ...item, key: index }))}
        columns={inspectionColumns}
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ x: 1400 }}
      />
    </div>
  );

  const tabItems = [
    { key: 'ranking', label: '月度排名', children: rankingTab },
    { key: 'workorders', label: '工单时效明细', children: workOrderTab },
    { key: 'events', label: '事件响应明细', children: eventTab },
    { key: 'inspections', label: '核查通过明细', children: inspectionTab },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Tooltip title="选择考核月份">
            <DatePicker
              picker="month"
              value={currentMonth}
              onChange={(date) => date && setCurrentMonth(date)}
              style={{ width: 160 }}
              allowClear={false}
            />
          </Tooltip>
          <Tooltip title="按部门筛选明细报表">
            <Select
              placeholder="选择部门（可选）"
              style={{ width: 200 }}
              allowClear
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              onSelect={() => {}}
            >
              {departmentList.map((dept) => (
                <Option key={dept.department} value={dept.department}>
                  {dept.department} ({dept.userCount}人)
                </Option>
              ))}
            </Select>
          </Tooltip>
          <a onClick={handleFilter} style={{ marginLeft: 8 }}>
            刷新数据
          </a>
        </Space>
        <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
          统计周期：{year}年{month}月，
          共 {summary.workOrders?.total || 0} 个工单，
          {summary.events?.responded || 0} 次响应，
          {summary.inspections?.total || 0} 个巡检任务
        </div>
      </Card>

      <Tabs items={tabItems} defaultActiveKey="ranking" size="large" />
    </div>
  );
};

export default DepartmentPerformance;
