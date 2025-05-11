import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import { Typography, Spin, Empty, Collapse, List, Tag } from 'antd';
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const CalendarEventsPage = () => {
  const [accountsEvents, setAccountsEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      setLoading(true);
      try {
        const response = await api.get('/events', { withCredentials: true });
        if (response.status === 200) {
          setAccountsEvents(response.data);
        } else {
          setError('Failed to fetch calendar events.');
        }
      } catch (error) {
        setError('Error fetching calendar events.');
      } finally {
        setLoading(false);
      }
    };
    fetchCalendarEvents();
  }, []);

  if (loading) return <Spin tip="Loading calendar events..." style={{ display: 'block', margin: '100px auto' }} />;
  if (error) return <Empty description={error} style={{ margin: '100px auto' }} />;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
        <CalendarOutlined style={{ marginRight: 8 }} />
        Your Calendar Events
      </Title>
      {accountsEvents.length === 0 ? (
        <Empty description="No connected calendars found." style={{ margin: '60px 0' }} />
      ) : (
        <Collapse accordion>
          {accountsEvents.map(account => (
            <Panel
              header={
                <span>
                  <Tag color="blue">{account.email || account.google_account_id}</Tag>
                </span>
              }
              key={account.google_account_id}
            >
              <List
                dataSource={account.events}
                locale={{ emptyText: <Empty description="No events found for this calendar." /> }}
                renderItem={event => (
                  <List.Item>
                    <List.Item.Meta
                      title={<b>{event.summary}</b>}
                      description={
                        <span>
                          {event.start?.dateTime && (
                            <span style={{ marginRight: 12 }}>
                              <ClockCircleOutlined />{' '}
                              {new Date(event.start.dateTime).toLocaleString()}
                            </span>
                          )}
                          {event.description && (
                            <Text type="secondary">{event.description}</Text>
                          )}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            </Panel>
          ))}
        </Collapse>
      )}
    </div>
  );
};

export default CalendarEventsPage;