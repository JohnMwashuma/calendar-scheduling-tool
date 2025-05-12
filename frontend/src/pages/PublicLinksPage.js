import React, { useEffect, useState, useMemo } from 'react';
import { Card, Typography, Tag, Space, Spin, Alert, Empty, Row, Col, Input, Avatar, Button, Tooltip, message } from 'antd';
import { CalendarOutlined, UserOutlined, LinkOutlined, SearchOutlined } from '@ant-design/icons';
import * as api from '../services/api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

function stringToColor(str) {
  // Simple hash to color
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    color += ('00' + ((hash >> (i * 8)) & 0xff).toString(16)).slice(-2);
  }
  return color;
}

const PublicLinksPage = () => {
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLinks = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/public/scheduling-links');
        setAdvisors(response.data);
      } catch (e) {
        setError('Failed to load scheduling links.');
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, []);

  const filteredAdvisors = useMemo(() => {
    if (!search) return advisors;
    return advisors.filter(a =>
      a.advisor_name.toLowerCase().includes(search.toLowerCase()) ||
      a.advisor_email.toLowerCase().includes(search.toLowerCase())
    );
  }, [advisors, search]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(90deg, #e3f0ff 0%, #f9f9f9 100%)',
        borderRadius: 16,
        padding: '32px 24px',
        marginBottom: 40,
        textAlign: 'center',
      }}>
        <Title level={2} style={{ marginBottom: 8 }}>Book a Meeting with Our Advisors</Title>
        <Paragraph style={{ fontSize: 18, color: '#555', marginBottom: 0 }}>
          Find the right advisor and schedule a meeting in just a few clicks.
        </Paragraph>
      </div>
      {/* Search Bar */}
      <div style={{ maxWidth: 400, margin: '0 auto 32px auto' }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search advisors by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          size="large"
        />
      </div>
      {/* Main Content */}
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {loading ? (
          <Spin style={{ display: 'block', margin: '40px auto' }} />
        ) : error ? (
          <Alert type="error" message={error} showIcon style={{ margin: '32px 0' }} />
        ) : filteredAdvisors.length === 0 ? (
          <Empty description="No advisors or scheduling links found." style={{ margin: '32px 0' }} />
        ) : (
          <Row gutter={[32, 32]} justify="center">
            {filteredAdvisors.map(advisor => {
              const initials = advisor.advisor_name
                .split(' ')
                .map(w => w[0])
                .join('')
                .toUpperCase();
              return (
                <Col span={24} key={advisor.advisor_email}>
                  <Card
                    bordered
                    style={{ width: '100%', minWidth: 0, maxWidth: '100%', margin: '0 auto', borderRadius: 12, boxShadow: '0 2px 8px #f0f1f2' }}
                    bodyStyle={{ padding: 40 }}
                    title={
                      <Space>
                        <Avatar
                          style={{ backgroundColor: stringToColor(advisor.advisor_email), verticalAlign: 'middle' }}
                          size={48}
                          icon={<UserOutlined />}
                        >
                          {initials}
                        </Avatar>
                        <div style={{ textAlign: 'left' }}>
                          <Text strong style={{ fontSize: 18 }}>{advisor.advisor_name}</Text><br />
                          <Text type="secondary" style={{ fontSize: 14 }}>{advisor.advisor_email}</Text>
                        </div>
                      </Space>
                    }
                  >
                    {advisor.links.length === 0 ? (
                      <Empty description="No scheduling links." style={{ margin: '24px 0' }} />
                    ) : (
                      <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        {advisor.links.map(link => {
                          const expired = link.expiration_date && dayjs(link.expiration_date).isBefore(dayjs());
                          return (
                            <Card
                              key={link.link_id}
                              size="small"
                              style={{ borderRadius: 8, background: '#f7faff', border: '1px solid #e6f0ff' }}
                              bodyStyle={{ padding: 16 }}
                            >
                              <Space direction="vertical" style={{ width: '100%' }}>
                                <Space wrap>
                                  <Tooltip title="Open scheduling link">
                                    <Button
                                      type="primary"
                                      icon={<CalendarOutlined />}
                                      href={`/book/${link.link_id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      size="large"
                                      disabled={expired}
                                    >
                                      Book Meeting
                                    </Button>
                                  </Tooltip>
                                  <Tag color={expired ? 'red' : 'green'}>
                                    {expired ? 'Expired' : 'Active'}
                                  </Tag>
                                  <Tag color="blue">{link.meeting_length} min</Tag>
                                  <Tag color="purple">Advance: {link.advance_schedule_days}d</Tag>
                                  {link.usage_limit !== undefined && (
                                    <Tag color="gold">Limit: {link.usage_limit}</Tag>
                                  )}
                                  {link.expiration_date && (
                                  <Text type="secondary" style={{ fontSize: 13 }}>
                                    Expires: {dayjs(link.expiration_date).format('YYYY-MM-DD HH:mm')}
                                  </Text>
                                )}
                                </Space>
                                <div style={{ marginTop: 8 }}>
                                  <Tooltip title="Copy link">
                                    <Button
                                      icon={<LinkOutlined />}
                                      size="small"
                                      onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/book/${link.link_id}`);
                                        message.success('Link copied!');
                                      }}
                                    >
                                      Copy Link
                                    </Button>
                                  </Tooltip>
                                  <span style={{ marginLeft: 8, color: '#888', fontSize: 13 }}>
                                    {window.location.origin}/book/{link.link_id}
                                  </span>
                                </div>
                              </Space>
                            </Card>
                          );
                        })}
                      </Space>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>
    </div>
  );
};

export default PublicLinksPage; 