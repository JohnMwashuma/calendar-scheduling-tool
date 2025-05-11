import React, { useEffect, useState } from 'react';
import { Table, Button, Form, InputNumber, DatePicker, Input, Space, message, Popconfirm, Card, Row, Col, Divider, Typography, Tag, Empty, Tooltip, Alert } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import * as api from '../services/api';
import dayjs from 'dayjs';

const SchedulingLinksPage = () => {
  const [form] = Form.useForm();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(['']);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/scheduling-links', { withCredentials: true });
      setLinks(response.data);
    } catch (e) {
      message.error('Failed to fetch scheduling links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleAddQuestion = () => {
    setQuestions([...questions, '']);
  };

  const handleRemoveQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx, value) => {
    setQuestions(questions.map((q, i) => (i === idx ? value : q)));
  };

  const handleFinish = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        expiration_date: values.expiration_date.format(),
        questions: questions.filter(q => q.trim() !== ''),
      };
      await api.post('/scheduling-links', payload, { withCredentials: true });
      message.success('Scheduling link created');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
      form.resetFields();
      setQuestions(['']);
      fetchLinks();
    } catch (e) {
      message.error(e?.response?.data?.detail || 'Failed to create scheduling link');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Link URL',
      dataIndex: 'link_id',
      key: 'link_id',
      render: (val) => (
        <Space>
          <a href={`${window.location.origin}/book/${val}`} target="_blank" rel="noopener noreferrer">
            {window.location.origin}/book/{val}
          </a>
          <Tooltip title="Copy link">
            <Button
              icon={<CopyOutlined />}
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/book/${val}`);
                message.success('Link copied!');
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Usage Limit',
      dataIndex: 'usage_limit',
      key: 'usage_limit',
    },
    {
      title: 'Expiration',
      dataIndex: 'expiration_date',
      key: 'expiration_date',
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Meeting Length (min)',
      dataIndex: 'meeting_length',
      key: 'meeting_length',
    },
    {
      title: 'Advance Days',
      dataIndex: 'advance_schedule_days',
      key: 'advance_schedule_days',
    },
    {
      title: 'Questions',
      dataIndex: 'questions',
      key: 'questions',
      render: (val) => (
        <ul style={{ margin: 0, paddingLeft: 16 }}>{val && val.map((q, i) => <li key={i}>{q}</li>)}</ul>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={dayjs(record.expiration_date).isBefore(dayjs()) ? 'red' : 'green'}>
          {dayjs(record.expiration_date).isBefore(dayjs()) ? 'Expired' : 'Active'}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 32 }}>
      <Card style={{ marginBottom: 32 }}>
        <Typography.Title level={3}>Create Scheduling Link</Typography.Title>
        {success && (
          <div style={{ marginBottom: 16 }}>
            <Alert message="Scheduling link created successfully!" type="success" showIcon />
          </div>
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ usage_limit: 1, meeting_length: 30, advance_schedule_days: 0 }}
          style={{ maxWidth: 800 }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Usage Limit" name="usage_limit" rules={[{ required: true, type: 'number', min: 1 }]}> 
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Meeting Length (minutes)" name="meeting_length" rules={[{ required: true, type: 'number', min: 1 }]}> 
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Advance Scheduling Limit (days)" name="advance_schedule_days" rules={[{ required: true, type: 'number', min: 0 }]}> 
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Expiration Date" name="expiration_date" rules={[{ required: true }]}> 
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Custom Questions">
                {questions.map((q, idx) => (
                  <Space key={idx} style={{ display: 'flex', marginBottom: 8 }} align="start">
                    <Input
                      value={q}
                      onChange={e => handleQuestionChange(idx, e.target.value)}
                      placeholder={`Question ${idx + 1}`}
                      style={{ width: 300 }}
                    />
                    {questions.length > 1 && (
                      <Popconfirm title="Remove this question?" onConfirm={() => handleRemoveQuestion(idx)}>
                        <Button danger type="link">Remove</Button>
                      </Popconfirm>
                    )}
                  </Space>
                ))}
                <Button type="dashed" onClick={handleAddQuestion} style={{ marginTop: 8 }}>
                  + Add Question
                </Button>
              </Form.Item>
            </Col>
          </Row>
          <Divider />
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Create Link
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <Card title="Your Scheduling Links">
        <Table
          dataSource={links}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: <Empty description="No scheduling links yet." /> }}
          scroll={{ x: true }}
          style={{ marginTop: 16 }}
        />
      </Card>
    </div>
  );
};

export default SchedulingLinksPage; 