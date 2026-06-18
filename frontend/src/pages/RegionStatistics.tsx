import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Select, Tabs, Space, Progress, Tag } from 'antd';
import { EnvironmentOutlined, TeamOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import {
  getRegionStats,
  getAllStreets,
  getCommunitiesByStreet,
} from '../api/region';
import {
  getEventByStreet,
  getEventByCommunity,
  getEventByGrid,
} from '../api/statistics';
import { getDictionariesByType } from '../api/dictionary';

const { Option } = Select;

const RegionStatistics = () => {
  const [activeTab, setActiveTab] = useState('street');
  const [regionStats, setRegionStats] = useState<any>(null);
  const [streetStats, setStreetStats] = useState<any[]>([]);
  const [communityStats, setCommunityStats] = useState<any[]>([]);
  const [gridStats, setGridStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [streetFilter, setStreetFilter] = useState<string>('');
  const [communityFilter, setCommunityFilter] = useState<string>('');
  const [streetOptions, setStreetOptions] = useState<any[]>([]);
  const [communityOptions, setCommunityOptions] = useState<any[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);

  useEffect(() => {
    loadRegionStats();
    loadStreetOptions();
    loadCategoryOptions();
  }, []);

  useEffect(() => {
    if (activeTab === 'street') {
      loadStreetStats();
    } else if (activeTab === 'community') {
      loadCommunityStats();
    } else if (activeTab === 'grid') {
      loadGridStats();
    }
  }, [activeTab, streetFilter, communityFilter]);

  const loadCategoryOptions = async () => {
    try {
      const data: any = await getDictionariesByType('event_category');
      setCategoryOptions(data);
    } catch (error) {
      console.error('加载事件分类失败:', error);
    }
  };

  const loadRegionStats = async () => {
    try {
      const data: any = await getRegionStats();
      setRegionStats(data);
    } catch (error) {
      console.error('加载区域统计失败:', error);
    }
  };

  const loadStreetOptions = async () => {
    try {
      const data: any = await getAllStreets();
      setStreetOptions(data);
    } catch (error) {
      console.error('加载街道列表失败:', error);
    }
  };

  const loadStreetStats = async () => {
    setLoading(true);
    try {
      const data: any = await getEventByStreet();
      setStreetStats(data);
    } catch (error) {
      console.error('加载街道事件统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommunityStats = async () => {
    setLoading(true);
    try {
      const data: any = await getEventByCommunity(streetFilter || undefined);
      setCommunityStats(data);
    } catch (error) {
      console.error('加载社区事件统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGridStats = async () => {
    setLoading(true);
    try {
      const data: any = await getEventByGrid(communityFilter || undefined);
      setGridStats(data);
    } catch (error) {
      console.error('加载网格事件统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStreetChange = async (streetId: string) => {
    setStreetFilter(streetId);
    setCommunityFilter('');
    if (streetId) {
      try {
        const data: any = await getCommunitiesByStreet(streetId);
        setCommunityOptions(data);
      } catch (error) {
        console.error('加载社区列表失败:', error);
      }
    } else {
      setCommunityOptions([]);
    }
  };

  const tabItems = [
    { key: 'street', label: '按街道统计' },
    { key: 'community', label: '按社区统计' },
    { key: 'grid', label: '按网格统计' },
  ];

  const streetColumns = [
    {
      title: '街道名称',
      dataIndex: 'streetName',
      key: 'streetName',
      width: 150,
      render: (name: string) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#1890ff' }} />
          <span>{name}</span>
        </Space>
      ),
    },
    { title: '事件总数', dataIndex: 'total', key: 'total', width: 100, sorter: (a: any, b: any) => a.total - b.total },
    {
      title: '待处理',
      dataIndex: 'pending',
      key: 'pending',
      width: 100,
      render: (count: number) => <Tag color="orange">{count}</Tag>,
    },
    {
      title: '处理中',
      dataIndex: 'processing',
      key: 'processing',
      width: 100,
      render: (count: number) => <Tag color="blue">{count}</Tag>,
    },
    {
      title: '已解决',
      dataIndex: 'resolved',
      key: 'resolved',
      width: 100,
      render: (count: number) => <Tag color="green">{count}</Tag>,
    },
    {
      title: '已关闭',
      dataIndex: 'closed',
      key: 'closed',
      width: 100,
      render: (count: number) => <Tag color="default">{count}</Tag>,
    },
    {
      title: '解决率',
      key: 'resolveRate',
      width: 200,
      render: (_: any, record: any) => (
        <Progress percent={record.resolveRate} size="small" status={record.resolveRate >= 80 ? 'success' : 'active'} />
      ),
    },
  ];

  const communityColumns = [
    {
      title: '社区名称',
      dataIndex: 'communityName',
      key: 'communityName',
      width: 150,
      render: (name: string) => (
        <Space>
          <TeamOutlined style={{ color: '#52c41a' }} />
          <span>{name}</span>
        </Space>
      ),
    },
    { title: '所属街道', dataIndex: 'streetName', key: 'streetName', width: 120 },
    { title: '事件总数', dataIndex: 'total', key: 'total', width: 100, sorter: (a: any, b: any) => a.total - b.total },
    {
      title: '待处理',
      dataIndex: 'pending',
      key: 'pending',
      width: 100,
      render: (count: number) => <Tag color="orange">{count}</Tag>,
    },
    {
      title: '处理中',
      dataIndex: 'processing',
      key: 'processing',
      width: 100,
      render: (count: number) => <Tag color="blue">{count}</Tag>,
    },
    {
      title: '已解决',
      dataIndex: 'resolved',
      key: 'resolved',
      width: 100,
      render: (count: number) => <Tag color="green">{count}</Tag>,
    },
    {
      title: '解决率',
      key: 'resolveRate',
      width: 200,
      render: (_: any, record: any) => (
        <Progress percent={record.resolveRate} size="small" status={record.resolveRate >= 80 ? 'success' : 'active'} />
      ),
    },
  ];

  const gridColumns = [
    {
      title: '网格名称',
      dataIndex: 'gridName',
      key: 'gridName',
      width: 150,
      render: (name: string) => (
        <Space>
          <FileTextOutlined style={{ color: '#722ed1' }} />
          <span>{name}</span>
        </Space>
      ),
    },
    { title: '所属社区', dataIndex: 'communityName', key: 'communityName', width: 120 },
    { title: '所属街道', dataIndex: 'streetName', key: 'streetName', width: 120 },
    { title: '事件总数', dataIndex: 'total', key: 'total', width: 100, sorter: (a: any, b: any) => a.total - b.total },
    {
      title: '待处理',
      dataIndex: 'pending',
      key: 'pending',
      width: 100,
      render: (count: number) => <Tag color="orange">{count}</Tag>,
    },
    {
      title: '处理中',
      dataIndex: 'processing',
      key: 'processing',
      width: 100,
      render: (count: number) => <Tag color="blue">{count}</Tag>,
    },
    {
      title: '已解决',
      dataIndex: 'resolved',
      key: 'resolved',
      width: 100,
      render: (count: number) => <Tag color="green">{count}</Tag>,
    },
    {
      title: '解决率',
      key: 'resolveRate',
      width: 200,
      render: (_: any, record: any) => (
        <Progress percent={record.resolveRate} size="small" status={record.resolveRate >= 80 ? 'success' : 'active'} />
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">区域统计分析</div>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="街道总数"
              value={regionStats?.total?.streets || 0}
              prefix={<EnvironmentOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="社区总数"
              value={regionStats?.total?.communities || 0}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="网格总数"
              value={regionStats?.total?.grids || 0}
              prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均解决率"
              value={85}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
          tabBarExtraContent={{
            right: activeTab === 'community' ? (
              <Select
                placeholder="选择街道筛选"
                value={streetFilter || undefined}
                onChange={handleStreetChange}
                style={{ width: 180 }}
                allowClear
              >
                {streetOptions.map((s: any) => (
                  <Option key={s._id} value={s._id}>{s.name}</Option>
                ))}
              </Select>
            ) : activeTab === 'grid' ? (
              <Space>
                <Select
                  placeholder="选择街道"
                  value={streetFilter || undefined}
                  onChange={handleStreetChange}
                  style={{ width: 160 }}
                  allowClear
                >
                  {streetOptions.map((s: any) => (
                    <Option key={s._id} value={s._id}>{s.name}</Option>
                  ))}
                </Select>
                <Select
                  placeholder="选择社区"
                  value={communityFilter || undefined}
                  onChange={setCommunityFilter}
                  style={{ width: 160 }}
                  allowClear
                  disabled={!streetFilter}
                >
                  {communityOptions.map((c: any) => (
                    <Option key={c._id} value={c._id}>{c.name}</Option>
                  ))}
                </Select>
              </Space>
            ) : null,
          }}
        />

        {activeTab === 'street' && (
          <Table
            columns={streetColumns}
            dataSource={streetStats}
            rowKey="streetId"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            scroll={{ x: 900 }}
          />
        )}

        {activeTab === 'community' && (
          <Table
            columns={communityColumns}
            dataSource={communityStats}
            rowKey="communityId"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            scroll={{ x: 1000 }}
          />
        )}

        {activeTab === 'grid' && (
          <Table
            columns={gridColumns}
            dataSource={gridStats}
            rowKey="gridId"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            scroll={{ x: 1100 }}
          />
        )}
      </Card>
    </div>
  );
};

export default RegionStatistics;
