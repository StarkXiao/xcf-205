import { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, DatePicker, TimePicker, List, Modal, message, Space, Divider } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, EnvironmentOutlined, OrderedListOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { createInspectionPlan, updateInspectionPlan, getInspectionPlan, type Checkpoint, type InspectionPlan } from '../api/inspection';
import { getUsers } from '../api/user';
import { getDictionariesByType } from '../api/dictionary';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const InspectionPlanForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [checkpointModal, setCheckpointModal] = useState(false);
  const [editingCheckpoint, setEditingCheckpoint] = useState<Checkpoint | null>(null);
  const [checkpointForm] = Form.useForm();
  const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isEdit = id && id !== 'new';

  useEffect(() => {
    loadUsers();
    loadDepartments();
    if (isEdit) {
      loadPlan();
    }
  }, [id]);

  const loadUsers = async () => {
    try {
      const result: any = await getUsers({ pageSize: 100 });
      setUsers(result.list || []);
    } catch (error) {
      console.error('加载用户列表失败:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const data: any = await getDictionariesByType('department');
      setDepartmentOptions(data);
    } catch (error) {
      console.error('加载部门列表失败:', error);
    }
  };

  const getDepartmentName = (code: string) => {
    const dept = departmentOptions.find((d: any) => d.code === code);
    return dept ? dept.name : code;
  };

  const loadPlan = async () => {
    setLoading(true);
    try {
      const data: any = await getInspectionPlan(id!);
      setCheckpoints(data.checkpoints || []);
      form.setFieldsValue({
        ...data,
        dateRange: data.startDate && (data.endDate ? [dayjs(data.startDate), dayjs(data.endDate)] : [dayjs(data.startDate)]),
        timeRange: [dayjs(data.startTime, 'HH:mm'), dayjs(data.endTime, 'HH:mm')],
      });
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载计划详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCheckpoint = () => {
    setEditingCheckpoint(null);
    checkpointForm.resetFields();
    checkpointForm.setFieldsValue({
      order: checkpoints.length + 1,
      radius: 100,
      lng: 121.4737 + Math.random() * 0.1 - 0.05,
      lat: 31.2304 + Math.random() * 0.1 - 0.05,
    });
    setCheckpointModal(true);
  };

  const handleEditCheckpoint = (cp: Checkpoint, index: number) => {
    setEditingCheckpoint({ ...cp, order: index + 1 });
    checkpointForm.setFieldsValue({
      ...cp,
      order: index + 1,
    });
    setCheckpointModal(true);
  };

  const handleDeleteCheckpoint = (index: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该巡检点吗？',
      onOk: () => {
        const newCheckpoints = checkpoints.filter((_, i) => i !== index);
        setCheckpoints(newCheckpoints.map((cp, i) => ({ ...cp, order: i + 1 })));
      },
    });
  };

  const handleSaveCheckpoint = async () => {
    try {
      const values = await checkpointForm.validateFields();
      const newCheckpoint: Checkpoint = {
        ...values,
        order: parseInt(values.order),
      };

      if (editingCheckpoint) {
        const index = checkpoints.findIndex(cp => cp._id === editingCheckpoint._id);
        if (index !== -1) {
          const newCheckpoints = [...checkpoints];
          newCheckpoints[index] = { ...newCheckpoints[index], ...newCheckpoint };
          setCheckpoints(newCheckpoints);
        }
      } else {
        setCheckpoints([...checkpoints, newCheckpoint]);
      }
      setCheckpointModal(false);
      message.success('巡检点保存成功');
    } catch (error: any) {
      message.error(error.response?.data?.message || '保存失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (checkpoints.length === 0) {
        message.error('请至少添加一个巡检点');
        return;
      }

      if (!values.assigneeIds || values.assigneeIds.length === 0) {
        message.error('请至少选择一个负责人');
        return;
      }

      setLoading(true);

      const assigneeNames = values.assigneeIds.map((uid: string) => {
        const u = users.find(x => x._id === uid);
        return u?.realName || '';
      }).filter(Boolean);

      const data: Partial<InspectionPlan> = {
        name: values.name,
        description: values.description,
        type: values.type,
        frequency: values.frequency,
        checkpoints: checkpoints,
        assigneeIds: values.assigneeIds,
        assigneeNames,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1] ? values.dateRange[1].format('YYYY-MM-DD') : undefined,
        startTime: values.timeRange[0].format('HH:mm'),
        endTime: values.timeRange[1].format('HH:mm'),
        status: values.status || 'active',
        createdBy: user._id,
        createdByName: user.realName,
      };

      if (isEdit) {
        await updateInspectionPlan(id!, data);
        message.success('巡检计划更新成功');
      } else {
        await createInspectionPlan(data);
        message.success('巡检计划创建成功');
      }
      navigate('/inspection');
    } catch (error: any) {
      message.error(error.response?.data?.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: 'daily', label: '每日巡检' },
    { value: 'weekly', label: '每周巡检' },
    { value: 'monthly', label: '每月巡检' },
    { value: 'temporary', label: '临时任务' },
  ];

  const frequencyOptions = [
    { value: 'once', label: '一次' },
    { value: 'morning', label: '每日上午' },
    { value: 'afternoon', label: '每日下午' },
    { value: 'weekday', label: '工作日' },
    { value: 'weekend', label: '周末' },
  ];

  const moveCheckpoint = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= checkpoints.length) return;
    const newCheckpoints = [...checkpoints];
    const [removed] = newCheckpoints.splice(fromIndex, 1);
    newCheckpoints.splice(toIndex, 0, removed);
    setCheckpoints(newCheckpoints.map((cp, i) => ({ ...cp, order: i + 1 })));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inspection')} style={{ marginRight: 16 }} />
          {isEdit ? '编辑巡检计划' : '创建巡检计划'}
        </div>
        <Space>
          <Button onClick={() => navigate('/inspection')}>取消</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            {isEdit ? '保存修改' : '创建计划'}
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="基本信息" loading={loading}>
            <Form form={form} layout="vertical" initialValues={{ type: 'daily', status: 'active' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="计划名称"
                    name="name"
                    rules={[{ required: true, message: '请输入计划名称' }]}
                  >
                    <Input placeholder="请输入计划名称" maxLength={100} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="计划类型"
                    name="type"
                    rules={[{ required: true, message: '请选择计划类型' }]}
                  >
                    <Select placeholder="请选择计划类型">
                      {typeOptions.map(item => (
                        <Option key={item.value} value={item.value}>{item.label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="巡检频率"
                    name="frequency"
                  >
                    <Select placeholder="请选择巡检频率">
                      {frequencyOptions.map(item => (
                        <Option key={item.value} value={item.value}>{item.label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="计划状态"
                    name="status"
                    rules={[{ required: true, message: '请选择计划状态' }]}
                  >
                    <Select placeholder="请选择状态">
                      <Option value="draft">草稿</Option>
                      <Option value="active">启用</Option>
                      <Option value="cancelled">取消</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="有效日期"
                    name="dateRange"
                    rules={[{ required: true, message: '请选择有效日期' }]}
                  >
                    <RangePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="巡检时段"
                    name="timeRange"
                    rules={[{ required: true, message: '请选择巡检时段' }]}
                  >
                    <TimePicker.RangePicker style={{ width: '100%' }} format="HH:mm" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="计划描述"
                name="description"
              >
                <TextArea rows={3} placeholder="请输入计划描述" maxLength={500} />
              </Form.Item>

              <Form.Item
                label="负责人员"
                name="assigneeIds"
                rules={[{ required: true, message: '请选择负责人员' }]}
              >
                <Select mode="multiple" placeholder="请选择负责人员" allowClear>
                  {users.map(u => (
                    <Option key={u._id} value={u._id}>
                      {u.realName} - {u.department ? getDepartmentName(u.department) : '未分配部门'}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title={
              <Space>
                <OrderedListOutlined />
                巡检路线
                <span style={{ color: '#999', fontSize: 14, fontWeight: 'normal' }}>
                  ({checkpoints.length} 个巡检点)
                </span>
              </Space>
            }
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddCheckpoint}>
                添加巡检点
              </Button>
            }
          >
            {checkpoints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <EnvironmentOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>暂无巡检点</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>点击上方按钮添加巡检点</div>
              </div>
            ) : (
              <List
                dataSource={checkpoints}
                renderItem={(item, index) => (
                  <List.Item
                    actions={[
                      <Button type="link" size="small" onClick={() => moveCheckpoint(index, index - 1)} disabled={index === 0}>
                        上移
                      </Button>,
                      <Button type="link" size="small" onClick={() => moveCheckpoint(index, index + 1)} disabled={index === checkpoints.length - 1}>
                        下移
                      </Button>,
                      <Button type="link" size="small" onClick={() => handleEditCheckpoint(item, index)}>
                        编辑
                      </Button>,
                      <Button type="link" size="small" danger onClick={() => handleDeleteCheckpoint(index)}>
                        删除
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#1890ff',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}>
                          {index + 1}
                        </div>
                      }
                      title={item.name}
                      description={
                        <div>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            <EnvironmentOutlined /> {item.address}
                          </div>
                          {item.radius && (
                            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                              打卡范围: {item.radius}米
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingCheckpoint ? '编辑巡检点' : '添加巡检点'}
        open={checkpointModal}
        onCancel={() => setCheckpointModal(false)}
        onOk={handleSaveCheckpoint}
        width={600}
      >
        <Form form={checkpointForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="巡检点名称"
                name="name"
                rules={[{ required: true, message: '请输入巡检点名称' }]}
              >
                <Input placeholder="请输入巡检点名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="打卡顺序"
                name="order"
                rules={[{ required: true, message: '请输入打卡顺序' }]}
              >
                <Input type="number" min={1} placeholder="请输入打卡顺序" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="详细地址"
            name="address"
            rules={[{ required: true, message: '请输入详细地址' }]}
          >
            <Input placeholder="请输入详细地址" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="经度"
                name="lng"
                rules={[{ required: true, message: '请输入经度' }]}
              >
                <Input type="number" step="0.0001" placeholder="请输入经度" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="纬度"
                name="lat"
                rules={[{ required: true, message: '请输入纬度' }]}
              >
                <Input type="number" step="0.0001" placeholder="请输入纬度" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="打卡范围（米）"
            name="radius"
            rules={[{ required: true, message: '请输入打卡范围' }]}
          >
            <Input type="number" min={10} max={1000} placeholder="请输入打卡范围，默认100米" />
          </Form.Item>

          <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: 4 }}>
            <div style={{ fontSize: 12, color: '#666' }}>
              <strong>提示：</strong>巡检人员需要进入打卡范围内才能完成打卡。
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default InspectionPlanForm;
