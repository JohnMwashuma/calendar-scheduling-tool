import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Typography, DatePicker, List, Alert, Spin, Button, Empty, Form, Input, message } from 'antd';
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
  const [questions, setQuestions] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form] = Form.useForm();

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
          setQuestions(response.data.questions || []);
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
    setSelectedTime(null);
  };

  const handleTimeClick = (time) => {
    setSelectedTime(time);
    setBooking(true);
  };

  const handleFinish = async (values) => {
    if (!selectedDate || !selectedTime) return;
    const timeStr = `${selectedDate}T${selectedTime}`;
    setLoading(true);
    try {
      const payload = {
        time: dayjs(timeStr).toISOString(),
        email: values.email,
        linkedin: values.linkedin,
        answers: questions.map((q, i) => values[`question_${i}`] || ''),
      };
      const response = await api.post(`/schedule/${link_id}/book`, payload);
      if (response.data.success) {
        setSuccess(true);
        message.success('Booking confirmed!');
      } else {
        message.error(response.data.message || 'Booking failed.');
      }
    } catch (e) {
      message.error(e?.response?.data?.detail || 'Booking failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 16 }}>Book a Meeting</Title>
        {loading ? (
          <Spin style={{ display: 'block', margin: '40px auto' }} />
        ) : error ? (
          <Alert type="error" message={error} showIcon style={{ margin: '32px 0' }} />
        ) : success ? (
          <Alert type="success" message="Booking confirmed! Check your email for details." showIcon style={{ margin: '32px 0' }} />
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Text strong>Advisor:</Text> {advisor}<br />
              <Text strong>Meeting Length:</Text> {meetingLength} minutes
            </div>
            {dates.length === 0 ? (
              <Empty description="No available slots." style={{ margin: '32px 0' }} />
            ) : booking && selectedTime ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                style={{ marginTop: 24 }}
                initialValues={{ email: '', linkedin: '' }}
              >
                <Alert
                  type="info"
                  message={`Booking for ${selectedDate} at ${selectedTime}`}
                  showIcon
                  style={{ marginBottom: 24 }}
                />
                <Form.Item
                  label="Email Address"
                  name="email"
                  rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
                >
                  <Input placeholder="Enter your email" />
                </Form.Item>
                <Form.Item
                  label="LinkedIn Username or URL"
                  name="linkedin"
                  rules={[{ required: false }]}
                >
                  <Input placeholder="Enter your LinkedIn username or URL" />
                </Form.Item>
                {questions.map((q, i) => (
                  <Form.Item
                    key={i}
                    label={q}
                    name={`question_${i}`}
                    rules={[{ required: true, message: 'This question is required' }]}
                  >
                    <Input.TextArea placeholder="Your answer..." autoSize={{ minRows: 2, maxRows: 4 }} />
                  </Form.Item>
                ))}
                <Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading}>
                    Confirm Booking
                  </Button>
                  <Button style={{ marginTop: 8 }} block onClick={() => setBooking(false)}>
                    Back
                  </Button>
                </Form.Item>
              </Form>
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
                          <Button type="primary" block onClick={() => handleTimeClick(time)}>{time}</Button>
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