import { useState } from 'react';
import { Form, Input, Select, Button, Card, message, Row, Col, InputNumber, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../api/event';

const { TextArea } = Input;
const { Option } = Select;

const EventReport = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        lng: 121.4737 + Math.random() * 0.1 - 0.05,
        lat: 31.2304 + Math.random() * 0.1 - 0.05,
        source: '市民上报',
      };
      await createEvent(data);
      message.success('事件上报成功');
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || '上报失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">事件上报</div>
        <Button onClick={() => navigate('/events/list')}>查看列表</Button>
      </div>

      <Card title="上报信息">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ priority: 'medium', category: 'road' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="事件标题"
                name="title"
                rules={[{ required: true, message: '请输入事件标题' }]}
              >
                <Input placeholder="请简述事件情况" maxLength={100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="事件分类"
                name="category"
                rules={[{ required: true, message: '请选择事件分类' }]}
              >
                <Select placeholder="请选择事件分类">
                  {categoryOptions.map(item => (
                    <Option key={item.value} value={item.value}>{item.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
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
            <Col span={12}>
              <Form.Item
                label="事发地点"
                name="address"
                rules={[{ required: true, message: '请输入事发地点' }]}
              >
                <Input placeholder="请输入详细地址" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="详细描述"
            name="description"
            rules={[{ required: true, message: '请输入详细描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述事件情况" maxLength={500} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="上报人姓名" name="reporterName">
                <Input placeholder="请输入上报人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="联系电话" name="reporterPhone">
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="现场照片">
            <Upload
              listType="picture"
              maxCount={5}
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />}>上传照片</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              提交上报
            </Button>
            <Button style={{ marginLeft: 16 }} onClick={() => form.resetFields()}>
              重置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EventReport;
