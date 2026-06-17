import { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  List,
  Avatar,
  Steps,
  Row,
  Col,
  message,
  InputNumber,
  DatePicker,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  SwapOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getWorkOrder,
  getWorkOrderLogs,
  startWorkOrder,
  completeWorkOrder,
  verifyWorkOrder,
  closeWorkOrder,
  assignWorkOrder,
} from '../api/workorder';
import { getUsersByRole } from '../api/user';
import { submitApproval } from '../api/approval';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const { Option } = Select;
const { Step } = Steps;
const { TextArea } = Input;

const WorkOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: string; visible: boolean }>({ type: '', visible: false });
  const [form] = Form.useForm();
  const [handlers, setHandlers] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      loadData();
      loadLogs();
      loadHandlers();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const data: any = await getWorkOrder(id!);
      setWorkOrder(data);
    } catch (error) {
      console.error('加载工单详情失败:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const data: any = await getWorkOrderLogs(id!);
      setLogs(data);
    } catch (error) {
      console.error('加载工单日志失败:', error);
    }
  };

  const loadHandlers = async () => {
    try {
      const data: any = await getUsersByRole('handler');
      setHandlers(data);
    } catch (error) {
      console.error('加载处理人员失败:', error);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待分派' },
      assigned: { color: 'blue', text: '已分派' },
      processing: { color: 'cyan', text: '处理中' },
      completed: { color: 'green', text: '已完成' },
      verified: { color: 'purple', text: '已核查' },
      closed: { color: 'default', text: '已关闭' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getPriorityTag = (priority: string) => {
    const priorityMap: Record<string, { color: string; text: string }> = {
      low: { color: 'green', text: '低' },
      medium: { color: 'blue', text: '中' },
      high: { color: 'orange', text: '高' },
      urgent: { color: 'red', text: '紧急' },
    };
    const info = priorityMap[priority] || { color: 'default', text: priority };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getSteps = () => {
    const statusOrder = ['pending', 'assigned', 'processing', 'completed', 'verified', 'closed'];
    const currentIndex = statusOrder.indexOf(workOrder?.status || 'pending');
    
    return [
      { title: '创建工单', status: currentIndex >= 0 ? 'finish' : 'wait' },
      { title: '已分派', status: currentIndex >= 1 ? 'finish' : 'wait' },
      { title: '处理中', status: currentIndex >= 2 ? 'finish' : 'wait' },
      { title: '已完成', status: currentIndex >= 3 ? 'finish' : 'wait' },
      { title: '已核查', status: currentIndex >= 4 ? 'finish' : 'wait' },
      { title: '已关闭', status: currentIndex >= 5 ? 'finish' : 'wait' },
    ];
  };

  const handleAction = (type: string) => {
    setActionModal({ type, visible: true });
    form.resetFields();
  };

  const handleActionSubmit = async () => {
    try {
      const values = await form.validateFields();
      const { type } = actionModal;

      switch (type) {
        case 'assign': {
          const handler = handlers.find(h => h._id === values.handlerId);
          await assignWorkOrder(id!, {
            handlerId: values.handlerId,
            handlerName: handler?.realName,
            department: handler?.department,
            assignerId: user._id,
            assignerName: user.realName,
          });
          message.success('派单成功');
          break;
        }
        case 'start':
          await startWorkOrder(id!, {
            handlerId: user._id,
            handlerName: user.realName,
          });
          message.success('已开始处理');
          break;
        case 'complete':
          await completeWorkOrder(id!, {
            handlerId: user._id,
            handlerName: user.realName,
            handleResult: values.handleResult,
          });
          message.success('工单已完成');
          break;
        case 'verify':
          await verifyWorkOrder(id!, {
            verifierId: user._id,
            verifierName: user.realName,
            verifyResult: values.verifyResult,
            verifyRemark: values.verifyRemark,
          });
          message.success('核查完成');
          break;
        case 'close':
          await closeWorkOrder(id!, {
            operatorId: user._id,
            operatorName: user.realName,
            reason: values.reason,
          });
          message.success('工单已关闭');
          break;
        case 'extension': {
          const extensionDays = values.extensionDays;
          const newDeadline = workOrder.deadline
            ? dayjs(workOrder.deadline).add(extensionDays, 'day').toISOString()
            : dayjs().add(extensionDays, 'day').toISOString();
          await submitApproval({
            type: 'extension',
            title: `延期申请 - ${workOrder.orderNo}`,
            reason: values.reason,
            relatedId: workOrder._id,
            relatedNo: workOrder.orderNo,
            applicantId: user._id,
            applicantName: user.realName,
            extraData: {
              extensionDays,
              newDeadline,
              originalDeadline: workOrder.deadline,
            },
          });
          message.success('延期申请已提交，等待审批');
          break;
        }
        case 'reassign': {
          const newHandler = handlers.find(h => h._id === values.newHandlerId);
          await submitApproval({
            type: 'reassign',
            title: `改派申请 - ${workOrder.orderNo}`,
            reason: values.reason,
            relatedId: workOrder._id,
            relatedNo: workOrder.orderNo,
            applicantId: user._id,
            applicantName: user.realName,
            extraData: {
              newHandlerId: values.newHandlerId,
              newHandlerName: newHandler?.realName,
              newHandlerDepartment: newHandler?.department,
              originalHandlerId: workOrder.handlerId,
              originalHandlerName: workOrder.handlerName,
            },
          });
          message.success('改派申请已提交，等待审批');
          break;
        }
        case 'close_reject': {
          await submitApproval({
            type: 'close_reject',
            title: `关闭驳回申请 - ${workOrder.orderNo}`,
            reason: values.reason,
            relatedId: workOrder._id,
            relatedNo: workOrder.orderNo,
            applicantId: user._id,
            applicantName: user.realName,
            extraData: {
              rejectReason: values.reason,
              originalStatus: workOrder.status,
            },
          });
          message.success('关闭驳回申请已提交，等待审批');
          break;
        }
      }

      setActionModal({ type: '', visible: false });
      loadData();
      loadLogs();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const renderActionButtons = () => {
    if (!workOrder) return null;
    const status = workOrder.status;
    const canApplyExtension = ['assigned', 'processing'].includes(status) && workOrder.deadline;
    const canApplyReassign = ['assigned', 'processing'].includes(status);
    const canApplyCloseReject = ['verified'].includes(status);

    return (
      <Space>
        {status === 'pending' && (
          <Button type="primary" onClick={() => handleAction('assign')}>
            派单
          </Button>
        )}
        {status === 'assigned' && (
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => handleAction('start')}>
            开始处理
          </Button>
        )}
        {status === 'processing' && (
          <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleAction('complete')}>
            处理完成
          </Button>
        )}
        {status === 'completed' && (
          <Button type="primary" onClick={() => handleAction('verify')}>
            核查
          </Button>
        )}
        {(status === 'verified' || status === 'completed') && (
          <Button icon={<CloseCircleOutlined />} onClick={() => handleAction('close')}>
            关闭工单
          </Button>
        )}
        {canApplyExtension && (
          <Button icon={<ClockCircleOutlined />} onClick={() => handleAction('extension')}>
            延期申请
          </Button>
        )}
        {canApplyReassign && (
          <Button icon={<SwapOutlined />} onClick={() => handleAction('reassign')}>
            改派申请
          </Button>
        )}
        {canApplyCloseReject && (
          <Button danger icon={<AuditOutlined />} onClick={() => handleAction('close_reject')}>
            关闭驳回
          </Button>
        )}
      </Space>
    );
  };

  const renderActionModal = () => {
    const { type, visible } = actionModal;
    let title = '';

    switch (type) {
      case 'assign': title = '派单'; break;
      case 'start': title = '开始处理'; break;
      case 'complete': title = '处理完成'; break;
      case 'verify': title = '核查结果'; break;
      case 'close': title = '关闭工单'; break;
      case 'extension': title = '延期申请'; break;
      case 'reassign': title = '改派申请'; break;
      case 'close_reject': title = '关闭驳回申请'; break;
    }

    return (
      <Modal
        title={title}
        open={visible}
        onCancel={() => setActionModal({ type: '', visible: false })}
        onOk={handleActionSubmit}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          {type === 'assign' && (
            <Form.Item
              label="选择处理人"
              name="handlerId"
              rules={[{ required: true, message: '请选择处理人' }]}
            >
              <Select placeholder="请选择处理人员">
                {handlers.map(h => (
                  <Option key={h._id} value={h._id}>
                    {h.realName} - {h.department}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {type === 'complete' && (
            <Form.Item
              label="处理结果"
              name="handleResult"
              rules={[{ required: true, message: '请填写处理结果' }]}
            >
              <TextArea rows={4} placeholder="请描述处理结果..." />
            </Form.Item>
          )}

          {type === 'verify' && (
            <>
              <Form.Item
                label="核查结果"
                name="verifyResult"
                rules={[{ required: true, message: '请选择核查结果' }]}
              >
                <Select placeholder="请选择核查结果">
                  <Option value="pass">核查通过</Option>
                  <Option value="fail">核查不通过</Option>
                </Select>
              </Form.Item>
              <Form.Item label="核查备注" name="verifyRemark">
                <TextArea rows={3} placeholder="请填写核查备注..." />
              </Form.Item>
            </>
          )}

          {type === 'close' && (
            <Form.Item label="关闭原因" name="reason">
              <TextArea rows={3} placeholder="请填写关闭原因..." />
            </Form.Item>
          )}

          {type === 'extension' && (
            <>
              <Form.Item
                label="延期天数"
                name="extensionDays"
                rules={[{ required: true, message: '请输入延期天数' }]}
              >
                <InputNumber min={1} max={90} style={{ width: '100%' }} placeholder="请输入延期天数" />
              </Form.Item>
              <Form.Item
                label="延期原因"
                name="reason"
                rules={[{ required: true, message: '请填写延期原因' }]}
              >
                <TextArea rows={4} placeholder="请详细说明延期原因..." />
              </Form.Item>
            </>
          )}

          {type === 'reassign' && (
            <>
              <Form.Item
                label="改派处理人"
                name="newHandlerId"
                rules={[{ required: true, message: '请选择改派处理人' }]}
              >
                <Select placeholder="请选择改派处理人员">
                  {handlers.filter(h => h._id !== workOrder?.handlerId).map(h => (
                    <Option key={h._id} value={h._id}>
                      {h.realName} - {h.department}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                label="改派原因"
                name="reason"
                rules={[{ required: true, message: '请填写改派原因' }]}
              >
                <TextArea rows={4} placeholder="请详细说明改派原因..." />
              </Form.Item>
            </>
          )}

          {type === 'close_reject' && (
            <>
              <Form.Item
                label="驳回原因"
                name="reason"
                rules={[{ required: true, message: '请填写驳回原因' }]}
              >
                <TextArea rows={4} placeholder="请详细说明关闭驳回原因..." />
              </Form.Item>
            </>
          )}

          {type === 'start' && (
            <p>确定要开始处理此工单吗？</p>
          )}
        </Form>
      </Modal>
    );
  };

  if (!workOrder) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card
            title="工单详情"
            extra={renderActionButtons()}
          >
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="工单编号" span={2}>{workOrder.orderNo}</Descriptions.Item>
              <Descriptions.Item label="工单标题" span={2}>{workOrder.title}</Descriptions.Item>
              <Descriptions.Item label="优先级">{getPriorityTag(workOrder.priority)}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(workOrder.status)}</Descriptions.Item>
              <Descriptions.Item label="创建人">{workOrder.assignerName || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理人">{workOrder.handlerName || '-'}</Descriptions.Item>
              <Descriptions.Item label="所属部门">{workOrder.department || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(workOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="工单描述" span={2}>{workOrder.description || '-'}</Descriptions.Item>
              {workOrder.handleResult && (
                <Descriptions.Item label="处理结果" span={2}>{workOrder.handleResult}</Descriptions.Item>
              )}
              {workOrder.handleTime && (
                <Descriptions.Item label="处理时间">{dayjs(workOrder.handleTime).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              )}
              {workOrder.verifyTime && (
                <Descriptions.Item label="核查时间">{dayjs(workOrder.verifyTime).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              )}
              {workOrder.verifyRemark && (
                <Descriptions.Item label="核查备注" span={2}>{workOrder.verifyRemark}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="处理流程" style={{ marginTop: 16 }}>
            <Steps current={getSteps().findIndex(s => s.status === 'wait') > -1 ? getSteps().findIndex(s => s.status === 'wait') : 6}>
              <Step title="创建工单" />
              <Step title="已分派" />
              <Step title="处理中" />
              <Step title="已完成" />
              <Step title="已核查" />
              <Step title="已关闭" />
            </Steps>
          </Card>

          <Card title="操作日志" style={{ marginTop: 16 }}>
            <List
              itemLayout="horizontal"
              dataSource={logs}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <Space>
                        <span>{item.operatorName}</span>
                        <Tag color="blue">{item.action}</Tag>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                        </span>
                      </Space>
                    }
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card title="关联事件">
            {workOrder.eventId ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="事件标题">{workOrder.eventId.title}</Descriptions.Item>
                <Descriptions.Item label="事件分类">{workOrder.eventId.category}</Descriptions.Item>
                <Descriptions.Item label="事发地点">{workOrder.eventId.address}</Descriptions.Item>
                <Descriptions.Item label="上报人">{workOrder.eventId.reporterName}</Descriptions.Item>
                <Descriptions.Item label="联系电话">{workOrder.eventId.reporterPhone}</Descriptions.Item>
                <Descriptions.Item label="事件描述">{workOrder.eventId.description}</Descriptions.Item>
              </Descriptions>
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                无关联事件
              </div>
            )}
          </Card>

          <Card title="处理时限" style={{ marginTop: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>剩余处理时间</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: workOrder.priority === 'urgent' ? '#f5222d' : '#1890ff' }}>
                {workOrder.deadline
                  ? dayjs(workOrder.deadline).diff(dayjs(), 'hour') + ' 小时'
                  : '无时限'
                }
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {renderActionModal()}
    </div>
  );
};

export default WorkOrderDetail;
