import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Select, TimePicker, Popconfirm, message, Card, Row, Col, Divider, Typography, Tag, Empty, Space, Tooltip, Alert } from 'antd';
import dayjs from 'dayjs';
import * as api from '../services/api';
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const WEEKDAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const SchedulingWindowsPage = () => {
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState('');
  const [form] = Form.useForm();
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchWindows = async () => {
    setLoading(true);
    try {
      const response = await api.get('/scheduling-windows', { withCredentials: true });
      setWindows(response.data);
    } catch (e) {
      message.error('Failed to fetch scheduling windows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWindows();
  }, []);

  const handleAdd = async (values) => {
    try {
      const payload = {
        weekday: values.weekday,
        start_time: values.start_time.format('HH:mm'),
        end_time: values.end_time.format('HH:mm'),
      };
      await api.post('/scheduling-windows', payload, { withCredentials: true });
      message.success('Scheduling window added');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
      form.resetFields();
      setAdding(false);
      fetchWindows();
    } catch (e) {
      message.error(e?.response?.data?.detail || 'Failed to add window');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.del(`/scheduling-windows/${id}`, { withCredentials: true });
      message.success('Deleted');
      fetchWindows();
    } catch (e) {
      message.error('Failed to delete');
    }
  };

  const handleEdit = (record) => {
    setEditingKey(record.id);
    form.setFieldsValue({
      weekday: record.weekday,
      start_time: dayjs(record.start_time, 'HH:mm'),
      end_time: dayjs(record.end_time, 'HH:mm'),
    });
  };

  const handleSave = async (id) => {
    try {
      const values = await form.validateFields();
      const payload = {
        weekday: values.weekday,
        start_time: values.start_time.format('HH:mm'),
        end_time: values.end_time.format('HH:mm'),
      };
      await api.put(`/scheduling-windows/${id}`, payload, { withCredentials: true });
      message.success('Updated');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
      setEditingKey('');
      form.resetFields();
      fetchWindows();
    } catch (e) {
      message.error(e?.response?.data?.detail || 'Failed to update');
    }
  };

  const handleCancel = () => {
    setEditingKey('');
    form.resetFields();
  };

  const columns = [
    {
      title: 'Weekday',
      dataIndex: 'weekday',
      key: 'weekday',
      render: (val) => WEEKDAYS[val],
    },
    {
      title: 'Start Time',
      dataIndex: 'start_time',
      key: 'start_time',
    },
    {
      title: 'End Time',
      dataIndex: 'end_time',
      key: 'end_time',
    },
    {
      title: 'Status',
      key: 'status',
      render: () => <Tag color="green">Active</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) =>
        editingKey === record.id ? (
          <Space>
            <Tooltip title="Save">
              <Button icon={<CheckOutlined />} type="link" onClick={() => handleSave(record.id)} />
            </Tooltip>
            <Tooltip title="Cancel">
              <Button icon={<CloseOutlined />} type="link" onClick={handleCancel} />
            </Tooltip>
          </Space>
        ) : (
          <Space>
            <Tooltip title="Edit">
              <Button icon={<EditOutlined />} type="link" onClick={() => handleEdit(record)} />
            </Tooltip>
            <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)}>
              <Tooltip title="Delete">
                <Button icon={<DeleteOutlined />} type="link" danger />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
    },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <Card style={{ marginBottom: 32 }}>
        <Typography.Title level={3}>{editingKey ? 'Edit Scheduling Window' : 'Add Scheduling Window'}</Typography.Title>
        {success && (
          <div style={{ marginBottom: 16 }}>
            <Alert message={editingKey ? 'Scheduling window updated!' : 'Scheduling window added!'} type="success" showIcon />
          </div>
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={adding ? handleAdd : undefined}
          style={{ maxWidth: 700 }}
        >
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Weekday"
                name="weekday"
                rules={[{ required: true, message: 'Please select a weekday' }]}
              >
                <Select placeholder="Select weekday">
                  {WEEKDAYS.map((d, i) => (
                    <Select.Option value={i} key={i}>{d}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Start Time"
                name="start_time"
                rules={[{ required: true, message: 'Please select start time' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="End Time"
                name="end_time"
                rules={[{ required: true, message: 'Please select end time' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Divider />
          {adding ? (
            <Button type="primary" htmlType="submit" block>
              Add
            </Button>
          ) : editingKey ? null : (
            <Button type="dashed" block onClick={() => { setAdding(true); form.resetFields(); }}>
              + Add Scheduling Window
            </Button>
          )}
        </Form>
        {editingKey && (
          <Button style={{ marginTop: 16 }} block onClick={handleCancel}>
            Cancel Edit
          </Button>
        )}
      </Card>
      <Card title="Your Scheduling Windows">
        <Table
          dataSource={windows}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: <Empty description="No scheduling windows yet." /> }}
          scroll={{ x: true }}
          style={{ marginTop: 16 }}
        />
      </Card>
    </div>
  );
};

export default SchedulingWindowsPage; 