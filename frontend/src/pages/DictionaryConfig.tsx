import { useState, useEffect } from 'react';
import { Table, Button, Tag, Input, Space, Card, Modal, Form, Switch, message, Select, Tabs, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  getDictionaries,
  createDictionary,
  updateDictionary,
  deleteDictionary,
  DictionaryTypeLabels,
  DictionaryTypeList,
} from '../api/dictionary';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const DictionaryConfig = () => {
  const [activeTab, setActiveTab] = useState('event_category');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result: any = await getDictionaries({ type: activeTab });
      setData(result);
    } catch (error) {
      console.error('加载字典列表失败:', error);
      message.error('加载字典列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalType('create');
    setCurrentItem(null);
    form.resetFields();
    form.setFieldsValue({
      type: activeTab,
      isActive: true,
      sort: 0,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setModalType('edit');
    setCurrentItem(record);
    form.setFieldsValue({
      ...record,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDictionary(id);
      message.success('删除成功');
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleToggleStatus = async (record: any, checked: boolean) => {
    try {
      await updateDictionary(record._id, { isActive: checked });
      message.success(checked ? '已启用' : '已禁用');
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
      loadData();
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (modalType === 'create') {
        await createDictionary(values);
        message.success('创建成功');
      } else {
        await updateDictionary(currentItem._id, values);
        message.success('更新成功');
      }

      setModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const tabItems = DictionaryTypeList.map((item) => ({
    key: item.value,
    label: item.label,
  }));

  const columns = [
    {
      title: '字典编码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
    },
    {
      title: '字典名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '颜色标识',
      dataIndex: 'color',
      key: 'color',
      width: 120,
      render: (color: string) => (
        color ? (
          <Space>
            <span
              style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                borderRadius: 2,
                backgroundColor: color,
              }}
            />
            <span>{color}</span>
          </Space>
        ) : (
          '-'
        )
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: any) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleStatus(record, checked)}
          size="small"
        />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
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
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record._id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">基础字典配置</div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增字典项
        </Button>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
        />

        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={modalType === 'create' ? '新增字典项' : '编辑字典项'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="字典类型"
            name="type"
            rules={[{ required: true, message: '请选择字典类型' }]}
          >
            <Select placeholder="请选择字典类型">
              {DictionaryTypeList.map((item) => (
                <Option key={item.value} value={item.value}>
                  {item.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="字典编码"
            name="code"
            rules={[
              { required: true, message: '请输入字典编码' },
              { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '只能包含字母、数字和下划线，且以字母或下划线开头' },
            ]}
          >
            <Input placeholder="请输入字典编码（英文）" disabled={modalType === 'edit'} />
          </Form.Item>
          <Form.Item
            label="字典名称"
            name="name"
            rules={[{ required: true, message: '请输入字典名称' }]}
          >
            <Input placeholder="请输入字典名称" />
          </Form.Item>
          <Form.Item label="颜色标识" name="color">
            <Input type="color" placeholder="选择颜色" style={{ width: '100%', height: 32 }} />
          </Form.Item>
          <Form.Item label="排序" name="sort">
            <InputNumber style={{ width: '100%' }} placeholder="数字越小越靠前" min={0} />
          </Form.Item>
          <Form.Item label="启用状态" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DictionaryConfig;
