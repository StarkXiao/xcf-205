import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Space } from 'antd';
import {
  FileTextOutlined,
  FormOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import {
  getOverview,
  getEventCategoryStats,
  getTrend,
  getDepartmentStats,
  getHandlerRanking,
  getPriorityStats,
} from '../api/statistics';
import dayjs from 'dayjs';

const Dashboard = () => {
  const [overview, setOverview] = useState<any>({});
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);
  const [handlerRanking, setHandlerRanking] = useState<any[]>([]);
  const [priorityStats, setPriorityStats] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overviewData, categoryData, trendDataRes, deptData, handlerData, priorityData] = await Promise.all([
        getOverview(),
        getEventCategoryStats(),
        getTrend(30),
        getDepartmentStats(),
        getHandlerRanking(),
        getPriorityStats(),
      ]);

      setOverview(overviewData);
      setCategoryStats(categoryData);
      setTrendData(trendDataRes);
      setDepartmentStats(deptData);
      setHandlerRanking(handlerData);
      setPriorityStats(priorityData);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const getTrendChartOption = () => {
    const dates = trendData.map(item => item.date);
    const events = trendData.map(item => item.events);
    const workOrders = trendData.map(item => item.workOrders);
    const completed = trendData.map(item => item.completed);

    return {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['上报事件', '创建工单', '完成工单'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '上报事件',
          type: 'line',
          smooth: true,
          data: events,
          itemStyle: { color: '#1890ff' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
              ],
            },
          },
        },
        {
          name: '创建工单',
          type: 'line',
          smooth: true,
          data: workOrders,
          itemStyle: { color: '#52c41a' },
        },
        {
          name: '完成工单',
          type: 'line',
          smooth: true,
          data: completed,
          itemStyle: { color: '#faad14' },
        },
      ],
    };
  };

  const getCategoryChartOption = () => {
    const categories = categoryStats.map(item => item.categoryName);
    const counts = categoryStats.map(item => item.count);
    const resolved = categoryStats.map(item => item.resolved);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['事件总数', '已解决'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          rotate: 30,
          fontSize: 12,
        },
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '事件总数',
          type: 'bar',
          data: counts,
          itemStyle: { color: '#1890ff' },
          barWidth: '30%',
        },
        {
          name: '已解决',
          type: 'bar',
          data: resolved,
          itemStyle: { color: '#52c41a' },
          barWidth: '30%',
        },
      ],
    };
  };

  const getPriorityChartOption = () => {
    const data = priorityStats.map(item => ({
      value: item.events,
      name: item.priorityName,
    }));

    const colors = ['#52c41a', '#1890ff', '#faad14', '#f5222d'];

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          data: data,
          color: colors,
        },
      ],
    };
  };

  const getDeptChartOption = () => {
    const depts = departmentStats.map(item => item.department);
    const completed = departmentStats.map(item => item.completed);
    const processing = departmentStats.map(item => item.processing);
    const pending = departmentStats.map(item => item.pending);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['已完成', '处理中', '待处理'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
      },
      yAxis: {
        type: 'category',
        data: depts,
      },
      series: [
        {
          name: '待处理',
          type: 'bar',
          stack: 'total',
          data: pending,
          itemStyle: { color: '#faad14' },
        },
        {
          name: '处理中',
          type: 'bar',
          stack: 'total',
          data: processing,
          itemStyle: { color: '#1890ff' },
        },
        {
          name: '已完成',
          type: 'bar',
          stack: 'total',
          data: completed,
          itemStyle: { color: '#52c41a' },
        },
      ],
    };
  };

  const handlerColumns = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => {
        if (index < 3) {
          const colors = ['#f5222d', '#fa8c16', '#faad14'];
          return <span style={{ color: colors[index], fontWeight: 'bold' }}>{index + 1}</span>;
        }
        return index + 1;
      },
    },
    {
      title: '处理人员',
      dataIndex: 'handlerName',
      key: 'handlerName',
    },
    {
      title: '总工单数',
      dataIndex: 'total',
      key: 'total',
    },
    {
      title: '已完成',
      dataIndex: 'completed',
      key: 'completed',
    },
    {
      title: '完成率',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => (
        <Tag color={rate >= 80 ? 'green' : rate >= 60 ? 'orange' : 'red'}>
          {rate}%
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="事件总数"
              value={overview.events?.total || 0}
              prefix={<FormOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              <Space>
                <span>今日新增 {overview.events?.today || 0}</span>
                <RiseOutlined style={{ color: '#52c41a' }} />
              </Space>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="工单总数"
              value={overview.workOrders?.total || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              <Space>
                <span>今日新增 {overview.workOrders?.today || 0}</span>
                <RiseOutlined style={{ color: '#52c41a' }} />
              </Space>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="处理中事件"
              value={overview.events?.processing || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              处理率: {overview.events?.resolveRate || 0}%
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="注册用户"
              value={overview.users?.total || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              工作人员: {Math.max(0, (overview.users?.total || 0) - 3)} 人
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <div className="chart-card">
            <div className="chart-title">事件/工单趋势（近30天）</div>
            <ReactECharts option={getTrendChartOption()} style={{ height: 300 }} />
          </div>
        </Col>
        <Col span={8}>
          <div className="chart-card">
            <div className="chart-title">事件优先级分布</div>
            <ReactECharts option={getPriorityChartOption()} style={{ height: 300 }} />
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <div className="chart-card">
            <div className="chart-title">事件分类统计</div>
            <ReactECharts option={getCategoryChartOption()} style={{ height: 320 }} />
          </div>
        </Col>
        <Col span={8}>
          <div className="chart-card">
            <div className="chart-title">处理人员排行</div>
            <Table
              dataSource={handlerRanking.map((item, index) => ({ ...item, key: index }))}
              columns={handlerColumns}
              pagination={false}
              size="small"
            />
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div className="chart-card">
            <div className="chart-title">各部门工单统计</div>
            <ReactECharts option={getDeptChartOption()} style={{ height: 280 }} />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
