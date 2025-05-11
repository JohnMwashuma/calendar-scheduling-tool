import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Typography, DatePicker, List, Alert, Spin, Button, Empty } from 'antd';
import dayjs from 'dayjs';
import * as api from '../services/api';

const { Title, Text } = Typography;

const PublicSchedulePage = () => {
  const { link_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [advisor, setAdvisor] = useState(null);
  const [meetingLength, setMeetingLength] = useState(null);
  const [availableSlots, setAvailableSlots] = useState({});
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/schedule/${link_id}`);
        if (response.data.error) {
          setError(response.data.error);
        } else {
          setAdvisor(response.data.advisor_name);
          setMeetingLength(response.data.meeting_length);
          setAvailableSlots(response.data.available_slots);
          const dateKeys = Object.keys(response.data.available_slots);
          setDates(dateKeys);
          setSelectedDate(dateKeys[0] || null);
        }
      } catch (e) {
        setError('Could not load scheduling link.');
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [link_id]);

  const handleDateChange = (date) => {
    setSelectedDate(date ? date.format('YYYY-MM-DD') : null);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 16 }}>Book a Meeting</Title>
        {loading ? (
          <Spin style={{ display: 'block', margin: '40px auto' }} />
        ) : error ? (
          <Alert type="error" message={error} showIcon style={{ margin: '32px 0' }} />
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Text strong>Advisor:</Text> {advisor}<br />
              <Text strong>Meeting Length:</Text> {meetingLength} minutes
            </div>
            {dates.length === 0 ? (
              <Empty description="No available slots." style={{ margin: '32px 0' }} />
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <Text strong>Select a date:</Text><br />
                  <DatePicker
                    value={selectedDate ? dayjs(selectedDate) : null}
                    onChange={handleDateChange}
                    disabledDate={d => !dates.includes(d.format('YYYY-MM-DD'))}
                    style={{ marginTop: 8 }}
                  />
                </div>
                <Card title={selectedDate ? `Available Times for ${dayjs(selectedDate).format('dddd, MMM D, YYYY')}` : 'Select a date'}>
                  {selectedDate && availableSlots[selectedDate] && availableSlots[selectedDate].length > 0 ? (
                    <List
                      dataSource={availableSlots[selectedDate]}
                      renderItem={time => (
                        <List.Item>
                          <Button type="primary" block>{time}</Button>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="No available times for this date." />
                  )}
                </Card>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default PublicSchedulePage; 