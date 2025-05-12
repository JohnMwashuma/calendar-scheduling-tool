import React, { useEffect, useState } from 'react';
import { Table, Card, Typography, Spin, Alert, Tag, Button, Space } from 'antd';
import * as api from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const MeetingsPage = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/meetings', { withCredentials: true });
        setMeetings(response.data);
      } catch (e) {
        setError('Failed to fetch meetings.');
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const handleRowClick = async (record) => {
    setDetailLoading(true);
    setDetailError(null);
    setSelectedMeeting(null);
    try {
      const response = await api.get(`/meetings/${record.id}`, { withCredentials: true });
      setSelectedMeeting(response.data);
    } catch (e) {
      setDetailError('Failed to fetch meeting details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (val) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: 'Time',
      dataIndex: 'start_time',
      key: 'time',
      render: (val) => dayjs(val).format('HH:mm'),
    },
    {
      title: 'Client Email',
      dataIndex: 'client_email',
      key: 'client_email',
    },
    {
      title: 'LinkedIn',
      dataIndex: 'client_linkedin',
      key: 'client_linkedin',
      render: (val) => val ? <a href={val} target="_blank" rel="noopener noreferrer">{val}</a> : <Tag color="default">N/A</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => handleRowClick(record)}>
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <Title level={3}>Your Scheduled Meetings</Title>
      {loading ? (
        <Spin style={{ display: 'block', margin: '40px auto' }} />
      ) : error ? (
        <Alert type="error" message={error} showIcon style={{ margin: '32px 0' }} />
      ) : (
        <Table
          dataSource={meetings}
          columns={columns}
          rowKey="id"
          pagination={false}
          onRow={record => ({ onClick: () => handleRowClick(record) })}
          style={{ marginBottom: 32 }}
        />
      )}
      {detailLoading && <Spin style={{ display: 'block', margin: '40px auto' }} />}
      {detailError && <Alert type="error" message={detailError} showIcon style={{ margin: '32px 0' }} />}
      {selectedMeeting && !detailLoading && !detailError && (
        <Card title={`Meeting Details`} style={{ marginTop: 32 }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>Date:</Text> {dayjs(selectedMeeting.start_time).format('YYYY-MM-DD')}<br />
              <Text strong>Time:</Text> {dayjs(selectedMeeting.start_time).format('HH:mm')} - {dayjs(selectedMeeting.end_time).format('HH:mm')}<br />
              <Text strong>Client Email:</Text> {selectedMeeting.client_email}<br />
              <Text strong>LinkedIn:</Text> {selectedMeeting.client_linkedin ? <a href={selectedMeeting.client_linkedin} target="_blank" rel="noopener noreferrer">{selectedMeeting.client_linkedin}</a> : <Tag color="default">N/A</Tag>}
            </div>
            <div>
              <Text strong>Client Answers:</Text>
              <ul>
                {selectedMeeting.answers && selectedMeeting.answers.length > 0 ? (
                  selectedMeeting.answers.map((a, i) => <li key={i}>{a}</li>)
                ) : <li>No answers provided.</li>}
              </ul>
            </div>
            {selectedMeeting.augmented_notes && (
              <div>
                <Text strong>Augmented Notes:</Text>
                <div style={{ background: '#f6f6f6', padding: 12, borderRadius: 6 }}>{selectedMeeting.augmented_notes}</div>
              </div>
            )}
            {selectedMeeting.linkedin_summary && (
              <div>
                <Text strong>LinkedIn Summary:</Text>
                <div style={{ background: '#f6f6f6', padding: 12, borderRadius: 6 }}>{selectedMeeting.linkedin_summary}</div>
              </div>
            )}
          </Space>
        </Card>
      )}
    </div>
  );
};

export default MeetingsPage; 