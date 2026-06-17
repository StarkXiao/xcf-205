import { useState, useEffect } from 'react';
import { Card, Select, Tag, Badge, Row, Col, Statistic, List } from 'antd';
import { EnvironmentOutlined, AlertOutlined } from '@ant-design/icons';
import { getEventsForMap } from '../api/event';
import dayjs from 'dayjs';

const { Option } = Select;

const EventMap = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterCategory, setFilterCategory] = useState<string | undefined>();

  useEffect(() => {
    loadData();
  }, [filterStatus, filterCategory]);

  const loadData = async () => {
    try {
      const data: any = await getEventsForMap({
        status: filterStatus,
        category: filterCategory,
      });
      setEvents(data);
    } catch (error) {
      console.error('加载地图数据失败:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: '#faad14',
      processing: '#1890ff',
      resolved: '#52c41a',
      closed: '#bfbfbf',
    };
    return colorMap[status] || '#1890ff';
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      road: '#1890ff',
      sanitation: '#52c41a',
      greening: '#73d13d',
      facility: '#faad14',
      noise: '#722ed1',
      water: '#13c2c2',
      electricity: '#fa8c16',
      gas: '#f5222d',
      other: '#8c8c8c',
    };
    return colorMap[category] || '#1890ff';
  };

  const getCategoryName = (category: string) => {
    const categoryMap: Record<string, string> = {
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
    return categoryMap[category] || category;
  };

  const getStatusName = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决',
      closed: '已关闭',
    };
    return statusMap[status] || status;
  };

  const getMarkerPosition = (lng: number, lat: number) => {
    const minLng = 121.4;
    const maxLng = 121.55;
    const minLat = 31.18;
    const maxLat = 31.30;
    
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    
    return {
      left: `${Math.max(5, Math.min(95, x))}%`,
      top: `${Math.max(5, Math.min(95, y))}%`,
    };
  };

  const handleMarkerClick = (event: any) => {
    setSelectedEvent(event);
  };

  const pendingCount = events.filter(e => e.status === 'pending').length;
  const processingCount = events.filter(e => e.status === 'processing').length;
  const resolvedCount = events.filter(e => e.status === 'resolved').length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">事件地图分布</div>
        <div>
          <Select
            placeholder="状态筛选"
            style={{ width: 120, marginRight: 12 }}
            allowClear
            value={filterStatus}
            onChange={setFilterStatus}
          >
            <Option value="pending">待处理</Option>
            <Option value="processing">处理中</Option>
            <Option value="resolved">已解决</Option>
            <Option value="closed">已关闭</Option>
          </Select>
          <Select
            placeholder="分类筛选"
            style={{ width: 120 }}
            allowClear
            value={filterCategory}
            onChange={setFilterCategory}
          >
            <Option value="road">道路设施</Option>
            <Option value="sanitation">环境卫生</Option>
            <Option value="greening">园林绿化</Option>
            <Option value="facility">公共设施</Option>
            <Option value="noise">噪声污染</Option>
            <Option value="water">供排水</Option>
            <Option value="electricity">电力设施</Option>
            <Option value="gas">燃气设施</Option>
          </Select>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={18}>
          <Card bodyStyle={{ padding: 0 }}>
            <div className="map-container">
              <div className="map-background">
                <div style={{
                  position: 'absolute',
                  top: 20,
                  left: 20,
                  background: 'rgba(255,255,255,0.9)',
                  padding: '8px 16px',
                  borderRadius: 4,
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#333',
                  zIndex: 5,
                }}>
                  <EnvironmentOutlined style={{ color: '#1890ff' }} /> 智慧城市管理区域
                </div>
                
                {events.map(event => {
                  const position = getMarkerPosition(event.lng, event.lat);
                  return (
                    <div
                      key={event._id}
                      className="map-marker"
                      style={position}
                      onClick={() => handleMarkerClick(event)}
                    >
                      <div
                        className="map-marker-dot"
                        style={{
                          backgroundColor: getStatusColor(event.status),
                          width: event.priority === 'urgent' ? 20 : event.priority === 'high' ? 18 : 16,
                          height: event.priority === 'urgent' ? 20 : event.priority === 'high' ? 18 : 16,
                        }}
                      />
                      <div className="map-marker-label">
                        {event.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </Col>

        <Col span={6}>
          <Row gutter={[0, 16]} style={{ flexDirection: 'column' }}>
            <Col>
              <Card size="small">
                <Row gutter={8}>
                  <Col span={8}>
                    <Statistic
                      title="待处理"
                      value={pendingCount}
                      valueStyle={{ color: '#faad14', fontSize: 16 }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="处理中"
                      value={processingCount}
                      valueStyle={{ color: '#1890ff', fontSize: 16 }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="已解决"
                      value={resolvedCount}
                      valueStyle={{ color: '#52c41a', fontSize: 16 }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col>
              <Card title="事件详情" size="small">
                {selectedEvent ? (
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <Badge color={getStatusColor(selectedEvent.status)} text={getStatusName(selectedEvent.status)} />
                      <Tag color={getCategoryColor(selectedEvent.category)} style={{ marginLeft: 8 }}>
                        {getCategoryName(selectedEvent.category)}
                      </Tag>
                    </div>
                    <h4 style={{ marginBottom: 8 }}>{selectedEvent.title}</h4>
                    <p style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                      <AlertOutlined /> {selectedEvent.address}
                    </p>
                    <p style={{ fontSize: 12, color: '#666' }}>
                      上报时间：{dayjs(selectedEvent.createdAt).format('MM-DD HH:mm')}
                    </p>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                    点击地图上的标记查看详情
                  </div>
                )}
              </Card>
            </Col>

            <Col>
              <Card title="最新事件" size="small">
                <List
                  size="small"
                  dataSource={events.slice(0, 5)}
                  renderItem={(item: any) => (
                    <List.Item onClick={() => handleMarkerClick(item)} style={{ cursor: 'pointer' }}>
                      <List.Item.Meta
                        avatar={<Badge color={getStatusColor(item.status)} />}
                        title={<span style={{ fontSize: 13 }}>{item.title}</span>}
                        description={<span style={{ fontSize: 11, color: '#999' }}>{getCategoryName(item.category)}</span>}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default EventMap;
