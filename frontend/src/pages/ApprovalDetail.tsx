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
  Steps,
  List,
  Avatar,
  Timeline,
  Row,
  Col,
  message,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  RollbackOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getApprovalInstance,
  getApprovalLogs,
  approveApproval,
  rejectApproval,
  cancelApproval,
} from '../api/approval';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const { TextArea } = Input;

const ApprovalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [instance, setInstance] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: string; visible: boolean }>({ type: '', visible: false });
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadData();
      loadLogs();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const data: any = await getApprovalInstance(id!);
      setInstance(data);
    } catch (error) {
      console.error('加载审批详情失败:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const data: any = await getApprovalLogs(id!);
      setLogs(data);
    } catch (error) {
      console.error('加载审批日志失败:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      extension: '延期申请',
      reassign: '改派申请',
      close_reject: '关闭驳回',
    };
    return map[type] || type;
  };

  const getTypeTag = (type: string) => {
    const map: Record<string, string> = {
      extension: 'orange',
      reassign: 'blue',
      close_reject: 'red',
    };
    return <Tag color={map[type] || 'default'}>{getTypeLabel(type)}</Tag>;
  };

  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      pending: { color: 'processing', text: '审批中' },
      approved: { color: 'success', text: '已通过' },
      rejected: { color: 'error', text: '已驳回' },
      cancelled: { color: 'default', text: '已撤销' },
    };
    const info = map[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getNodeStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      pending: { color: 'processing', text: '待处理' },
      approved: { color: 'success', text: '已通过' },
      rejected: { color: 'error', text: '已驳回' },
    };
    const info = map[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const isCurrentApprover = () => {
    if (!instance || instance.status !== 'pending') return false;
    const currentNode = instance.nodeInstances?.[instance.currentNodeIndex];
    return currentNode?.approverId?.toString() === user._id && currentNode?.status === 'pending';
  };

  const isApplicant = () => {
    return instance?.applicantId?.toString() === user._id;
  };

  const handleAction = (type: string) => {
    setActionModal({ type, visible: true });
    form.resetFields();
  };

  const handleActionSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (actionModal.type === 'approve') {
        await approveApproval(id!, {
          approverId: user._id,
          approverName: user.realName,
          comment: values.comment || '同意',
        });
        message.success('审批通过');
      } else if (actionModal.type === 'reject') {
        await rejectApproval(id!, {
          approverId: user._id,
          approverName: user.realName,
          comment: values.comment,
        });
        message.success('已驳回');
      } else if (actionModal.type === 'cancel') {
        await cancelApproval(id!, {
          operatorId: user._id,
          operatorName: user.realName,
        });
        message.success('已撤销');
      }

      setActionModal({ type: '', visible: false });
      loadData();
      loadLogs();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const renderActionButtons = () => {
    if (!instance) return null;

    return (
      <Space>
        {isCurrentApprover() && (
          <>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleAction('approve')}
            >
              通过
            </Button>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleAction('reject')}
            >
              驳回
            </Button>
          </>
        )}
        {isApplicant() && instance.status === 'pending' && (
          <Popconfirm
            title="确定要撤销此申请？"
            onConfirm={async () => {
              try {
                await cancelApproval(id!, {
                  operatorId: user._id,
                  operatorName: user.realName,
                });
                message.success('已撤销');
                loadData();
                loadLogs();
              } catch (error: any) {
                message.error(error.response?.data?.message || '撤销失败');
              }
            }}
          >
            <Button icon={<RollbackOutlined />}>撤销</Button>
          </Popconfirm>
        )}
      </Space>
    );
  };

  const renderNodeSteps = () => {
    if (!instance?.nodeInstances) return null;

    return (
      <Steps
        current={instance.currentNodeIndex}
        direction="vertical"
        items={instance.nodeInstances.map((node: any, index: number) => ({
          title: (
            <Space>
              <span>{node.nodeName}</span>
              {getNodeStatusTag(node.status)}
              {index === instance.currentNodeIndex && instance.status === 'pending' && (
                <Tag color="blue" icon={<ClockCircleOutlined />}>当前</Tag>
              )}
            </Space>
          ),
          description: (
            <div style={{ fontSize: 12, color: '#666' }}>
              {node.approverName && <div>审批人：{node.approverName}</div>}
              {node.comment && <div>意见：{node.comment}</div>}
              {node.operateTime && (
                <div>时间：{dayjs(node.operateTime).format('YYYY-MM-DD HH:mm:ss')}</div>
              )}
            </div>
          ),
          status: node.status === 'approved'
            ? 'finish'
            : node.status === 'rejected'
            ? 'error'
            : 'process',
        }))}
      />
    );
  };

  const renderTimeline = () => {
    if (!logs.length) return <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>暂无日志</div>;

    return (
      <Timeline
        items={logs.map((log: any) => ({
          color: log.action.includes('驳回') ? 'red' : log.action.includes('通过') || log.action.includes('完成') ? 'green' : 'blue',
          children: (
            <div>
              <div>
                <Space>
                  <strong>{log.operatorName}</strong>
                  <Tag color={log.action.includes('驳回') ? 'error' : log.action.includes('通过') || log.action.includes('完成') ? 'success' : 'processing'}>
                    {log.action}
                  </Tag>
                  <span style={{ fontSize: 12, color: '#999' }}>
                    {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                  </span>
                </Space>
              </div>
              {log.description && (
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{log.description}</div>
              )}
            </div>
          ),
        }))}
      />
    );
  };

  if (!instance) {
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
            title="审批详情"
            extra={renderActionButtons()}
          >
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="申请标题" span={2}>{instance.title}</Descriptions.Item>
              <Descriptions.Item label="申请类型">{getTypeTag(instance.type)}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(instance.status)}</Descriptions.Item>
              <Descriptions.Item label="申请人">{instance.applicantName}</Descriptions.Item>
              <Descriptions.Item label="关联工单">{instance.relatedNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="申请时间" span={2}>
                {dayjs(instance.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="申请原因" span={2}>{instance.reason}</Descriptions.Item>
              {instance.extraData?.extensionDays && (
                <Descriptions.Item label="延期天数" span={2}>
                  {instance.extraData.extensionDays} 天
                </Descriptions.Item>
              )}
              {instance.extraData?.newDeadline && (
                <Descriptions.Item label="延期后截止时间" span={2}>
                  {dayjs(instance.extraData.newDeadline).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}
              {instance.extraData?.newHandlerName && (
                <Descriptions.Item label="改派处理人" span={2}>
                  {instance.extraData.newHandlerName}
                </Descriptions.Item>
              )}
              {instance.extraData?.rejectReason && (
                <Descriptions.Item label="驳回原因" span={2}>
                  {instance.extraData.rejectReason}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="审批流程" style={{ marginTop: 16 }}>
            {renderNodeSteps()}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="日志追踪">
            {renderTimeline()}
          </Card>
        </Col>
      </Row>

      <Modal
        title={actionModal.type === 'approve' ? '审批通过' : '审批驳回'}
        open={actionModal.visible}
        onCancel={() => setActionModal({ type: '', visible: false })}
        onOk={handleActionSubmit}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="审批意见"
            name="comment"
            rules={actionModal.type === 'reject' ? [{ required: true, message: '请填写驳回原因' }] : []}
          >
            <TextArea
              rows={4}
              placeholder={actionModal.type === 'approve' ? '请填写审批意见（选填）' : '请填写驳回原因'}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ApprovalDetail;
