import { useState, useEffect } from 'react';
import { Tabs, Table, Button, Input, Space, Card, Modal, Form, Switch, message, Select, InputNumber, Row, Col, Tree } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import {
  getStreets,
  createStreet,
  updateStreet,
  deleteStreet,
  getCommunities,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  getGrids,
  createGrid,
  updateGrid,
  deleteGrid,
  getAllStreets,
  getCommunitiesByStreet,
  getGridsByCommunity,
  getRegionTree,
  type Street,
  type Community,
  type Grid,
} from '../api/region';
import { getUsers } from '../api/user';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const RegionManage = () => {
  const [activeTab, setActiveTab] = useState('street');
  const [streetData, setStreetData] = useState<any[]>([]);
  const [communityData, setCommunityData] = useState<any[]>([]);
  const [gridData, setGridData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [streetLoading, setStreetLoading] = useState(false);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [gridLoading, setGridLoading] = useState(false);

  const [streetModal, setStreetModal] = useState(false);
  const [communityModal, setCommunityModal] = useState(false);
  const [gridModal, setGridModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [currentItem, setCurrentItem] = useState<any>(null);

  const [streetForm] = Form.useForm();
  const [communityForm] = Form.useForm();
  const [gridForm] = Form.useForm();

  const [streetKeyword, setStreetKeyword] = useState('');
  const [communityKeyword, setCommunityKeyword] = useState('');
  const [communityStreetFilter, setCommunityStreetFilter] = useState<string>('');
  const [gridKeyword, setGridKeyword] = useState('');
  const [gridStreetFilter, setGridStreetFilter] = useState<string>('');
  const [gridCommunityFilter, setGridCommunityFilter] = useState<string>('');

  const [streetOptions, setStreetOptions] = useState<any[]>([]);
  const [communityOptions, setCommunityOptions] = useState<any[]>([]);
  const [gridOptions, setGridOptions] = useState<any[]>([]);
  const [userOptions, setUserOptions] = useState<any[]>([]);
  const [regionTree, setRegionTree] = useState<any[]>([]);

  const [streetPagination, setStreetPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [communityPagination, setCommunityPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [gridPagination, setGridPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    loadStreetOptions();
    loadRegionTree();
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'street') {
      loadStreets();
    } else if (activeTab === 'community') {
      loadCommunities();
    } else if (activeTab === 'grid') {
      loadGrids();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      const result: any = await getUsers({ pageSize: 200 });
      setUserOptions(result.list || []);
    } catch (error) {
      console.error('加载用户列表失败:', error);
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

  const loadRegionTree = async () => {
    try {
      const data: any = await getRegionTree();
      setRegionTree(data);
    } catch (error) {
      console.error('加载区域树失败:', error);
    }
  };

  const loadStreets = async (page = 1, pageSize = 10) => {
    setStreetLoading(true);
    try {
      const result: any = await getStreets({ page, pageSize, keyword: streetKeyword });
      setStreetData(result.list);
      setStreetPagination({ current: result.page, pageSize: result.pageSize, total: result.total });
    } catch (error) {
      console.error('加载街道列表失败:', error);
      message.error('加载街道列表失败');
    } finally {
      setStreetLoading(false);
    }
  };

  const loadCommunities = async (page = 1, pageSize = 10) => {
    setCommunityLoading(true);
    try {
      const params: any = { page, pageSize, keyword: communityKeyword };
      if (communityStreetFilter) params.streetId = communityStreetFilter;
      const result: any = await getCommunities(params);
      setCommunityData(result.list);
      setCommunityPagination({ current: result.page, pageSize: result.pageSize, total: result.total });
    } catch (error) {
      console.error('加载社区列表失败:', error);
      message.error('加载社区列表失败');
    } finally {
      setCommunityLoading(false);
    }
  };

  const loadGrids = async (page = 1, pageSize = 10) => {
    setGridLoading(true);
    try {
      const params: any = { page, pageSize, keyword: gridKeyword };
      if (gridStreetFilter) params.streetId = gridStreetFilter;
      if (gridCommunityFilter) params.communityId = gridCommunityFilter;
      const result: any = await getGrids(params);
      setGridData(result.list);
      setGridPagination({ current: result.page, pageSize: result.pageSize, total: result.total });
    } catch (error) {
      console.error('加载网格列表失败:', error);
      message.error('加载网格列表失败');
    } finally {
      setGridLoading(false);
    }
  };

  const handleStreetChange = async (streetId: string, type: 'community' | 'grid') => {
    if (type === 'community') {
      setCommunityStreetFilter(streetId);
    } else {
      setGridStreetFilter(streetId);
      setGridCommunityFilter('');
    }
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

  const handleCommunityChange = async (communityId: string) => {
    setGridCommunityFilter(communityId);
    if (communityId) {
      try {
        const data: any = await getGridsByCommunity(communityId);
        setGridOptions(data);
      } catch (error) {
        console.error('加载网格列表失败:', error);
      }
    } else {
      setGridOptions([]);
    }
  };

  const handleCreateStreet = () => {
    setModalType('create');
    setCurrentItem(null);
    streetForm.resetFields();
    streetForm.setFieldsValue({ isActive: true, sort: 0 });
    setStreetModal(true);
  };

  const handleEditStreet = (record: any) => {
    setModalType('edit');
    setCurrentItem(record);
    streetForm.setFieldsValue(record);
    setStreetModal(true);
  };

  const handleDeleteStreet = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该街道吗？删除后将无法恢复。',
      onOk: async () => {
        try {
          await deleteStreet(id);
          message.success('删除成功');
          loadStreets(streetPagination.current, streetPagination.pageSize);
          loadStreetOptions();
          loadRegionTree();
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败');
        }
      },
    });
  };

  const handleSubmitStreet = async () => {
    try {
      const values = await streetForm.validateFields();
      if (modalType === 'create') {
        await createStreet(values);
        message.success('创建成功');
      } else {
        await updateStreet(currentItem._id, values);
        message.success('更新成功');
      }
      setStreetModal(false);
      loadStreets(streetPagination.current, streetPagination.pageSize);
      loadStreetOptions();
      loadRegionTree();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleCreateCommunity = () => {
    setModalType('create');
    setCurrentItem(null);
    communityForm.resetFields();
    communityForm.setFieldsValue({ isActive: true, sort: 0 });
    setCommunityModal(true);
  };

  const handleEditCommunity = (record: any) => {
    setModalType('edit');
    setCurrentItem(record);
    communityForm.setFieldsValue(record);
    setCommunityModal(true);
  };

  const handleDeleteCommunity = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该社区吗？删除后将无法恢复。',
      onOk: async () => {
        try {
          await deleteCommunity(id);
          message.success('删除成功');
          loadCommunities(communityPagination.current, communityPagination.pageSize);
          loadRegionTree();
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败');
        }
      },
    });
  };

  const handleSubmitCommunity = async () => {
    try {
      const values = await communityForm.validateFields();
      if (modalType === 'create') {
        await createCommunity(values);
        message.success('创建成功');
      } else {
        await updateCommunity(currentItem._id, values);
        message.success('更新成功');
      }
      setCommunityModal(false);
      loadCommunities(communityPagination.current, communityPagination.pageSize);
      loadRegionTree();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleCreateGrid = () => {
    setModalType('create');
    setCurrentItem(null);
    gridForm.resetFields();
    gridForm.setFieldsValue({ isActive: true, sort: 0 });
    setGridModal(true);
  };

  const handleEditGrid = (record: any) => {
    setModalType('edit');
    setCurrentItem(record);
    gridForm.setFieldsValue(record);
    setGridModal(true);
  };

  const handleDeleteGrid = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该网格吗？删除后将无法恢复。',
      onOk: async () => {
        try {
          await deleteGrid(id);
          message.success('删除成功');
          loadGrids(gridPagination.current, gridPagination.pageSize);
          loadRegionTree();
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败');
        }
      },
    });
  };

  const handleSubmitGrid = async () => {
    try {
      const values = await gridForm.validateFields();
      if (values.gridMemberIds && values.gridMemberIds.length > 0) {
        values.gridMemberNames = values.gridMemberIds.map((uid: string) => {
          const u = userOptions.find((x: any) => x._id === uid);
          return u?.realName || '';
        }).filter(Boolean);
      }
      if (values.gridLeaderId) {
        const leader = userOptions.find((u: any) => u._id === values.gridLeaderId);
        values.gridLeaderName = leader?.realName || '';
      }
      if (modalType === 'create') {
        await createGrid(values);
        message.success('创建成功');
      } else {
        await updateGrid(currentItem._id, values);
        message.success('更新成功');
      }
      setGridModal(false);
      loadGrids(gridPagination.current, gridPagination.pageSize);
      loadRegionTree();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleToggleStreetStatus = async (record: any, checked: boolean) => {
    try {
      await updateStreet(record._id, { isActive: checked });
      message.success(checked ? '已启用' : '已禁用');
      loadStreets(streetPagination.current, streetPagination.pageSize);
      loadStreetOptions();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleToggleCommunityStatus = async (record: any, checked: boolean) => {
    try {
      await updateCommunity(record._id, { isActive: checked });
      message.success(checked ? '已启用' : '已禁用');
      loadCommunities(communityPagination.current, communityPagination.pageSize);
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleToggleGridStatus = async (record: any, checked: boolean) => {
    try {
      await updateGrid(record._id, { isActive: checked });
      message.success(checked ? '已启用' : '已禁用');
      loadGrids(gridPagination.current, gridPagination.pageSize);
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const streetColumns = [
    { title: '街道编码', dataIndex: 'code', key: 'code', width: 120 },
    { title: '街道名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: any) => (
        <Switch checked={isActive} onChange={(checked) => handleToggleStreetStatus(record, checked)} size="small" />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditStreet(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteStreet(record._id)}>删除</Button>
        </Space>
      ),
    },
  ];

  const communityColumns = [
    { title: '社区编码', dataIndex: 'code', key: 'code', width: 120 },
    { title: '社区名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '所属街道', dataIndex: 'streetName', key: 'streetName', width: 120 },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: any) => (
        <Switch checked={isActive} onChange={(checked) => handleToggleCommunityStatus(record, checked)} size="small" />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditCommunity(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCommunity(record._id)}>删除</Button>
        </Space>
      ),
    },
  ];

  const gridColumns = [
    { title: '网格编码', dataIndex: 'code', key: 'code', width: 120 },
    { title: '网格名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '所属街道', dataIndex: 'streetName', key: 'streetName', width: 120 },
    { title: '所属社区', dataIndex: 'communityName', key: 'communityName', width: 120 },
    { title: '网格长', dataIndex: 'gridLeaderName', key: 'gridLeaderName', width: 100 },
    {
      title: '网格员数量',
      key: 'memberCount',
      width: 100,
      render: (_: any, record: any) => record.gridMemberNames?.length || 0,
    },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: any) => (
        <Switch checked={isActive} onChange={(checked) => handleToggleGridStatus(record, checked)} size="small" />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditGrid(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteGrid(record._id)}>删除</Button>
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'street', label: '街道管理' },
    { key: 'community', label: '社区管理' },
    { key: 'grid', label: '网格管理' },
  ];

  const renderTreeTitle = (node: any, level: number) => {
    const icon = level === 0 ? '🏙️' : level === 1 ? '🏘️' : '📍';
    return (
      <span>
        {icon} {node.name}
        <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>({node.code})</span>
      </span>
    );
  };

  const transformTreeData = (data: any[], level = 0): any[] => {
    return data.map(item => ({
      key: item._id,
      title: renderTreeTitle(item, level),
      children: item.children ? transformTreeData(item.children, level + 1) : undefined,
    }));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">区域管理</div>
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card title="区域树结构" style={{ height: '100%' }}>
            <Tree
              showLine
              defaultExpandAll
              treeData={transformTreeData(regionTree)}
            />
          </Card>
        </Col>
        <Col span={18}>
          <Card>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              type="card"
              tabBarExtraContent={{
                right: activeTab === 'street' ? (
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateStreet}>新增街道</Button>
                ) : activeTab === 'community' ? (
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateCommunity}>新增社区</Button>
                ) : (
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateGrid}>新增网格</Button>
                ),
              }}
            />

            {activeTab === 'street' && (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Input
                    placeholder="搜索街道名称/编码"
                    prefix={<SearchOutlined />}
                    value={streetKeyword}
                    onChange={(e) => setStreetKeyword(e.target.value)}
                    onPressEnter={() => loadStreets(1, streetPagination.pageSize)}
                    style={{ width: 240 }}
                    allowClear
                  />
                  <Button type="primary" onClick={() => loadStreets(1, streetPagination.pageSize)}>搜索</Button>
                </Space>
                <Table
                  columns={streetColumns}
                  dataSource={streetData}
                  rowKey="_id"
                  loading={streetLoading}
                  pagination={{
                    ...streetPagination,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条`,
                    onChange: (page, pageSize) => loadStreets(page, pageSize),
                  }}
                  scroll={{ x: 900 }}
                />
              </>
            )}

            {activeTab === 'community' && (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Select
                    placeholder="选择街道"
                    value={communityStreetFilter || undefined}
                    onChange={(val) => handleStreetChange(val, 'community')}
                    style={{ width: 160 }}
                    allowClear
                  >
                    {streetOptions.map((s: any) => (
                      <Option key={s._id} value={s._id}>{s.name}</Option>
                    ))}
                  </Select>
                  <Input
                    placeholder="搜索社区名称/编码"
                    prefix={<SearchOutlined />}
                    value={communityKeyword}
                    onChange={(e) => setCommunityKeyword(e.target.value)}
                    onPressEnter={() => loadCommunities(1, communityPagination.pageSize)}
                    style={{ width: 240 }}
                    allowClear
                  />
                  <Button type="primary" onClick={() => loadCommunities(1, communityPagination.pageSize)}>搜索</Button>
                </Space>
                <Table
                  columns={communityColumns}
                  dataSource={communityData}
                  rowKey="_id"
                  loading={communityLoading}
                  pagination={{
                    ...communityPagination,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条`,
                    onChange: (page, pageSize) => loadCommunities(page, pageSize),
                  }}
                  scroll={{ x: 1000 }}
                />
              </>
            )}

            {activeTab === 'grid' && (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Select
                    placeholder="选择街道"
                    value={gridStreetFilter || undefined}
                    onChange={(val) => handleStreetChange(val, 'grid')}
                    style={{ width: 140 }}
                    allowClear
                  >
                    {streetOptions.map((s: any) => (
                      <Option key={s._id} value={s._id}>{s.name}</Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="选择社区"
                    value={gridCommunityFilter || undefined}
                    onChange={handleCommunityChange}
                    style={{ width: 140 }}
                    allowClear
                    disabled={!gridStreetFilter}
                  >
                    {communityOptions.map((c: any) => (
                      <Option key={c._id} value={c._id}>{c.name}</Option>
                    ))}
                  </Select>
                  <Input
                    placeholder="搜索网格名称/编码"
                    prefix={<SearchOutlined />}
                    value={gridKeyword}
                    onChange={(e) => setGridKeyword(e.target.value)}
                    onPressEnter={() => loadGrids(1, gridPagination.pageSize)}
                    style={{ width: 220 }}
                    allowClear
                  />
                  <Button type="primary" onClick={() => loadGrids(1, gridPagination.pageSize)}>搜索</Button>
                </Space>
                <Table
                  columns={gridColumns}
                  dataSource={gridData}
                  rowKey="_id"
                  loading={gridLoading}
                  pagination={{
                    ...gridPagination,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条`,
                    onChange: (page, pageSize) => loadGrids(page, pageSize),
                  }}
                  scroll={{ x: 1200 }}
                />
              </>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={modalType === 'create' ? '新增街道' : '编辑街道'}
        open={streetModal}
        onCancel={() => setStreetModal(false)}
        onOk={handleSubmitStreet}
        width={600}
        destroyOnClose
      >
        <Form form={streetForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="街道编码" name="code" rules={[{ required: true, message: '请输入街道编码' }]}>
                <Input placeholder="请输入街道编码（英文）" disabled={modalType === 'edit'} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="街道名称" name="name" rules={[{ required: true, message: '请输入街道名称' }]}>
                <Input placeholder="请输入街道名称" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="街道描述" name="description">
            <TextArea rows={2} placeholder="请输入街道描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="中心经度" name="lng">
                <Input type="number" step="0.0001" placeholder="请输入中心经度" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="中心纬度" name="lat">
                <Input type="number" step="0.0001" placeholder="请输入中心纬度" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="排序" name="sort">
                <InputNumber style={{ width: '100%' }} placeholder="数字越小越靠前" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="启用状态" name="isActive" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="备注" name="remark">
            <TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={modalType === 'create' ? '新增社区' : '编辑社区'}
        open={communityModal}
        onCancel={() => setCommunityModal(false)}
        onOk={handleSubmitCommunity}
        width={600}
        destroyOnClose
      >
        <Form form={communityForm} layout="vertical">
          <Form.Item label="所属街道" name="streetId" rules={[{ required: true, message: '请选择所属街道' }]}>
            <Select placeholder="请选择所属街道">
              {streetOptions.map((s: any) => (
                <Option key={s._id} value={s._id}>{s.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="社区编码" name="code" rules={[{ required: true, message: '请输入社区编码' }]}>
                <Input placeholder="请输入社区编码（英文）" disabled={modalType === 'edit'} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="社区名称" name="name" rules={[{ required: true, message: '请输入社区名称' }]}>
                <Input placeholder="请输入社区名称" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="社区描述" name="description">
            <TextArea rows={2} placeholder="请输入社区描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="中心经度" name="lng">
                <Input type="number" step="0.0001" placeholder="请输入中心经度" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="中心纬度" name="lat">
                <Input type="number" step="0.0001" placeholder="请输入中心纬度" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="排序" name="sort">
                <InputNumber style={{ width: '100%' }} placeholder="数字越小越靠前" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="启用状态" name="isActive" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="备注" name="remark">
            <TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={modalType === 'create' ? '新增网格' : '编辑网格'}
        open={gridModal}
        onCancel={() => setGridModal(false)}
        onOk={handleSubmitGrid}
        width={700}
        destroyOnClose
      >
        <Form form={gridForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="所属街道" name="streetId" rules={[{ required: true, message: '请选择所属街道' }]}>
                <Select
                  placeholder="请选择所属街道"
                  onChange={(val) => {
                    gridForm.setFieldsValue({ communityId: undefined });
                    handleStreetChange(val, 'grid');
                  }}
                >
                  {streetOptions.map((s: any) => (
                    <Option key={s._id} value={s._id}>{s.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="所属社区" name="communityId" rules={[{ required: true, message: '请选择所属社区' }]}>
                <Select placeholder="请选择所属社区">
                  {communityOptions.map((c: any) => (
                    <Option key={c._id} value={c._id}>{c.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="网格编码" name="code" rules={[{ required: true, message: '请输入网格编码' }]}>
                <Input placeholder="请输入网格编码（英文）" disabled={modalType === 'edit'} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="网格名称" name="name" rules={[{ required: true, message: '请输入网格名称' }]}>
                <Input placeholder="请输入网格名称" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="网格长" name="gridLeaderId">
            <Select placeholder="请选择网格长" allowClear showSearch optionFilterProp="children">
              {userOptions.map((u: any) => (
                <Option key={u._id} value={u._id}>{u.realName}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="网格员" name="gridMemberIds">
            <Select mode="multiple" placeholder="请选择网格员" allowClear showSearch optionFilterProp="children">
              {userOptions.map((u: any) => (
                <Option key={u._id} value={u._id}>{u.realName}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="网格描述" name="description">
            <TextArea rows={2} placeholder="请输入网格描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="中心经度" name="lng">
                <Input type="number" step="0.0001" placeholder="请输入中心经度" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="中心纬度" name="lat">
                <Input type="number" step="0.0001" placeholder="请输入中心纬度" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="排序" name="sort">
                <InputNumber style={{ width: '100%' }} placeholder="数字越小越靠前" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="启用状态" name="isActive" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="备注" name="remark">
            <TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RegionManage;
