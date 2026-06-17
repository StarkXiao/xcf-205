import { useState, useEffect } from 'react';
import { Card, Button, Steps, Tag, message, Space, Modal, Form, Input, Select, Row, Col, List, Badge, Divider, Statistic, Progress } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, PlayCircleOutlined, StopOutlined, CameraOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getInspectionTask, startInspectionTask, checkin, completeInspectionTask, type InspectionTask, type Checkpoint, type CheckinRecord } from '../api/inspection';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const { Step } = Steps;
const { TextArea } = Input;
const { Option } = Select;

const InspectionCheckin = () => {
  const [task, setTask] = useState<InspectionTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkinModal, setCheckinModal] = useState(false);
  const [exceptionModal, setExceptionModal] = useState(false);
  const [currentCheckpoint, setCurrentCheckpoint] = useState<Checkpoint | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [checkinForm] = Form.useForm();
  const [exceptionForm] = Form.useForm();
  const [checkinRecords, setCheckinRecords] = useState<CheckinRecord[]>([]);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const data: any = await getInspectionTask(id!);
      setTask(data);
      setCheckinRecords(data.checkinRecords || []);
      
      const completedCount = data.checkinRecords?.length || 0;
      setCurrentStep(completedCount);
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载任务详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async () => {
    try {
      await startInspectionTask(id!);
      message.success('巡检任务已开始');
      loadTask();
    } catch (error: any) {
      message.error(error.response?.data?.message || '开始任务失败');
    }
  };

  const handleCheckin = (checkpoint: Checkpoint, index: number) => {
    if (index !== currentStep) {
      message.warning('请按顺序进行打卡');
      return;
    }
    setCurrentCheckpoint(checkpoint);
    checkinForm.resetFields();
    checkinForm.setFieldsValue({
      status: 'normal',
      lng: checkpoint.lng,
      lat: checkpoint.lat,
    });
    setCheckinModal(true);
  };

  const handleCheckinSubmit = async () => {
    try {
      const values = await checkinForm.validateFields();
      const data: Partial<CheckinRecord> = {
        checkpointId: currentCheckpoint!._id!,
        checkpointName: currentCheckpoint!.name,
        checkinTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        lng: values.lng,
        lat: values.lat,
        status: values.status,
        remark: values.remark,
      };
      await checkin(id!, data);
      message.success('打卡成功');
      setCheckinModal(false);
      loadTask();
    } catch (error: any) {
      message.error(error.response?.data?.message || '打卡失败');
    }
  };

  const handleReportException = () => {
    if (!currentCheckpoint) return;
    exceptionForm.resetFields();
    exceptionForm.setFieldsValue({
      title: `[${currentCheckpoint.name}] 巡检异常`,
      address: currentCheckpoint.address,
      lng: currentCheckpoint.lng,
      lat: currentCheckpoint.lat,
      priority: 'medium',
      category: 'road',
    });
    setExceptionModal(true);
  };

  const handleExceptionSubmit = async () => {
    try {
      const values = await exceptionForm.validateFields();
      navigate(`/inspection/tasks/${id}/exception`, {
        state: {
          checkpoint: currentCheckpoint,
          task: task,
          prefill: values,
        },
      });
    } catch (error) {
      message.error('请填写完整信息');
    }
  };

  const handleCompleteTask = async () => {
    Modal.confirm({
      title: '确认完成',
      content: '所有巡检点已打卡完成，确认结束本次巡检任务吗？',
      onOk: async () => {
        try {
          await completeInspectionTask(id!);
          message.success('巡检任务已完成');
          navigate('/inspection');
        } catch (error: any) {
          message.error(error.response?.data?.message || '完成任务失败');
        }
      },
    });
  };

  const getCheckpointStatus = (index: number) => {
    if (index < currentStep) {
      return 'finish';
    }
    if (index === currentStep) {
      return task?.status === 'in_progress' ? 'process' : 'wait';
    }
    return 'wait';
  };

  const getCheckpointIcon = (index: number, checkpoint: Checkpoint) => {
    const record = checkinRecords.find(r => r.checkpointId === checkpoint._id);
    if (record) {
      if (record.status === 'normal') {
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />;
      }
      if (record.status === 'abnormal') {
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />;
      }
      if (record.status === 'skipped') {
        return <ClockCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />;
      }
    }
    return <EnvironmentOutlined style={{ fontSize: 20 }} />;
  };

  const isAllChecked = () => {
    return checkinRecords.length >= (task?.checkpoints?.length || 0);
  };

  const categoryOptions = [
    { value: 'road', label: '道路设施' },
    { value: 'sanitation', label: '环境卫生' },
    { value: 'greening', label: '园林绿化' },
    { value: 'facility', label: '公共设施' },
    { value: 'noise', label: '噪声污染' },
    { value: 'water', label: '供排水' },
    { value: 'electricity', label: '电力设施' },
    { value: 'gas', label: '燃气设施' },
    { value: 'other', label: '其他' },
  ];

  const priorityOptions = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
    { value: 'urgent', label: '紧急' },
  ];

  if (!task) {
    return <div style={{ padding: 24 }}>加载中...</div>;
  }

  const progress = Math.round((checkinRecords.length / (task.checkpoints?.length || 1)) * 100);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inspection')} style={{ marginRight: 16 }} />
          路线打卡 - {task.planName}
        </div>
        <Space>
          {task.status === 'pending' && (
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStartTask}>
              开始巡检
            </Button>
          )}
          {task.status === 'in_progress' && isAllChecked() && (
            <Button type="primary" icon={<StopOutlined />} onClick={handleCompleteTask}>
              完成巡检
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="巡检路线" loading={loading}>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Statistic
                  title="巡检进度"
                  value={`${checkinRecords.length}/${task.checkpoints?.length || 0}`}
                  suffix="个巡检点"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="开始时间"
                  value={task.actualStartTime ? dayjs(task.actualStartTime).format('HH:mm') : '-'}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="预计用时"
                  value={`${task.checkpoints?.length || 0 * 15}分钟`}
                />
              </Col>
            </Row>

            <Progress percent={progress} status={progress === 100 ? 'success' : 'active'} style={{ marginBottom: 24 }} />

            <Steps
              direction="vertical"
              current={currentStep}
              status={task.status === 'completed' ? 'finish' : 'process'}
            >
              {task.checkpoints?.map((checkpoint, index) => {
                const record = checkinRecords.find(r => r.checkpointId === checkpoint._id);
                return (
                  <Step
                    key={checkpoint._id}
                    status={getCheckpointStatus(index)}
                    title={
                      <Space>
                        {getCheckpointIcon(index, checkpoint)}
                        <span>{checkpoint.name}</span>
                        {record && record.status === 'normal' && (
                          <Tag color="green">正常</Tag>
                        )}
                        {record && record.status === 'abnormal' && (
                          <Tag color="red">异常</Tag>
                        )}
                        {record && record.status === 'skipped' && (
                          <Tag color="orange">跳过</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
                          <EnvironmentOutlined /> {checkpoint.address}
                        </div>
                        {record ? (
                          <div>
                            <div style={{ fontSize: 12, color: '#999' }}>
                              打卡时间：{dayjs(record.checkinTime).format('YYYY-MM-DD HH:mm')}
                            </div>
                            {record.remark && (
                              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                备注：{record.remark}
                              </div>
                            )}
                          </div>
                        ) : (
                          task.status === 'in_progress' && index === currentStep && (
                            <Button
                              type="primary"
                              size="small"
                              icon={<EnvironmentOutlined />}
                              onClick={() => handleCheckin(checkpoint, index)}
                              style={{ marginTop: 8 }}
                            >
                              立即打卡
                            </Button>
                          )
                        )}
                      </div>
                    }
                  />
                );
              })}
            </Steps>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="打卡记录">
            {checkinRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <ClockCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>暂无打卡记录</div>
              </div>
            ) : (
              <List
                dataSource={[...checkinRecords].reverse()}
                renderItem={(record) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        record.status === 'normal' ? (
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#52c41a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}>
                            <CheckCircleOutlined />
                          </div>
                        ) : record.status === 'abnormal' ? (
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#ff4d4f',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}>
                            <ExclamationCircleOutlined />
                          </div>
                        ) : (
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#faad14',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}>
                            <ClockCircleOutlined />
                          </div>
                        )
                      }
                      title={record.checkpointName}
                      description={
                        <div>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            {dayjs(record.checkinTime).format('HH:mm:ss')}
                          </div>
                          {record.remark && (
                            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                              {record.remark}
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

          {task.status === 'in_progress' && currentCheckpoint && (
            <Card title="快捷操作" style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  block
                  icon={<EnvironmentOutlined />}
                  onClick={() => handleCheckin(task.checkpoints![currentStep], currentStep)}
                >
                  当前巡检点打卡
                </Button>
                <Button
                  danger
                  block
                  icon={<ExclamationCircleOutlined />}
                  onClick={handleReportException}
                >
                  上报异常
                </Button>
              </Space>
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title="巡检打卡"
        open={checkinModal}
        onCancel={() => setCheckinModal(false)}
        onOk={handleCheckinSubmit}
        width={500}
      >
        <Form form={checkinForm} layout="vertical">
          <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
              <EnvironmentOutlined /> {currentCheckpoint?.name}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>{currentCheckpoint?.address}</div>
          </Card>

          <Form.Item
            label="打卡状态"
            name="status"
            rules={[{ required: true, message: '请选择打卡状态' }]}
          >
            <Select>
              <Option value="normal">正常</Option>
              <Option value="abnormal">异常</Option>
              <Option value="skipped">跳过</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="备注说明"
            name="remark"
          >
            <TextArea rows={3} placeholder="请输入备注说明（可选）" maxLength={200} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="经度"
                name="lng"
                rules={[{ required: true, message: '请输入经度' }]}
              >
                <Input type="number" step="0.0001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="纬度"
                name="lat"
                rules={[{ required: true, message: '请输入纬度' }]}
              >
                <Input type="number" step="0.0001" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="异常上报"
        open={exceptionModal}
        onCancel={() => setExceptionModal(false)}
        onOk={handleExceptionSubmit}
        width={600}
      >
        <Form form={exceptionForm} layout="vertical">
          <Form.Item
            label="异常标题"
            name="title"
            rules={[{ required: true, message: '请输入异常标题' }]}
          >
            <Input placeholder="请简述异常情况" maxLength={100} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="异常分类"
                name="category"
                rules={[{ required: true, message: '请选择异常分类' }]}
              >
                <Select placeholder="请选择异常分类">
                  {categoryOptions.map(item => (
                    <Option key={item.value} value={item.value}>{item.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="优先级"
                name="priority"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select placeholder="请选择优先级">
                  {priorityOptions.map(item => (
                    <Option key={item.value} value={item.value}>{item.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="详细描述"
            name="description"
            rules={[{ required: true, message: '请输入详细描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述异常情况" maxLength={500} />
          </Form.Item>

          <div style={{ padding: '12px', background: '#fff7e6', borderRadius: 4, border: '1px solid #ffd591' }}>
            <div style={{ fontSize: 12, color: '#d46b08' }}>
              <strong>提示：</strong>提交后将跳转至完整的异常上报页面，并自动生成事件工单。
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default InspectionCheckin;
