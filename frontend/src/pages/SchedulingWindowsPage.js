import React, { useEffect, useState } from 'react';
import { Table, Button, Select, TimePicker, Popconfirm, message } from 'antd';
import * as api from '../services/api';
import dayjs from 'dayjs';

const WEEKDAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const SchedulingWindowsPage = () => {
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState('');
  const [formState, setFormState] = useState({ weekday: 0, start_time: null, end_time: null });
  const [adding, setAdding] = useState(false);

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

  const handleAdd = async () => {
    if (formState.start_time && formState.end_time) {
      try {
        const payload = {
          weekday: formState.weekday,
          start_time: formState.start_time.format('HH:mm'),
          end_time: formState.end_time.format('HH:mm'),
        };
        await api.post('/scheduling-windows', payload, { withCredentials: true });
        message.success('Scheduling window added');
        setFormState({ weekday: 0, start_time: null, end_time: null });
        setAdding(false);
        fetchWindows();
      } catch (e) {
        message.error(e?.response?.data?.detail || 'Failed to add window');
      }
    } else {
      message.error('Please select weekday, start, and end time');
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
    setFormState({
      weekday: record.weekday,
      start_time: dayjs(record.start_time, 'HH:mm'),
      end_time: dayjs(record.end_time, 'HH:mm'),
    });
  };

  const handleSave = async (id) => {
    try {
      const payload = {
        weekday: formState.weekday,
        start_time: formState.start_time.format('HH:mm'),
        end_time: formState.end_time.format('HH:mm'),
      };
      await api.put(
        `/scheduling-windows/${id}`,
        payload,
        { withCredentials: true },
      );
      message.success('Updated');
      setEditingKey('');
      setFormState({ weekday: 0, start_time: null, end_time: null });
      fetchWindows();
    } catch (e) {
      message.error(e?.response?.data?.detail || 'Failed to update');
    }
  };

  const columns = [
    {
      title: 'Weekday',
      dataIndex: 'weekday',
      key: 'weekday',
      render: (val, record) =>
        editingKey === record.id ? (
          <Select
            value={formState.weekday}
            onChange={v => setFormState(f => ({ ...f, weekday: v }))}
            style={{ width: 120 }}
          >
            {WEEKDAYS.map((d, i) => (
              <Select.Option value={i} key={i}>{d}</Select.Option>
            ))}
          </Select>
        ) : (
          WEEKDAYS[val]
        ),
    },
    {
      title: 'Start Time',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (val, record) =>
        editingKey === record.id ? (
          <TimePicker
            value={formState.start_time}
            onChange={t => setFormState(f => ({ ...f, start_time: t }))}
            format="HH:mm"
          />
        ) : (
          val
        ),
    },
    {
      title: 'End Time',
      dataIndex: 'end_time',
      key: 'end_time',
      render: (val, record) =>
        editingKey === record.id ? (
          <TimePicker
            value={formState.end_time}
            onChange={t => setFormState(f => ({ ...f, end_time: t }))}
            format="HH:mm"
          />
        ) : (
          val
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) =>
        editingKey === record.id ? (
          <>
            <Button type="link" onClick={() => handleSave(record.id)} style={{ marginRight: 8 }}>Save</Button>
            <Button type="link" onClick={() => { setEditingKey(''); setFormState({ weekday: 0, start_time: null, end_time: null }); }}>Cancel</Button>
          </>
        ) : (
          <>
            <Button type="link" onClick={() => handleEdit(record)} style={{ marginRight: 8 }}>Edit</Button>
            <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger>Delete</Button>
            </Popconfirm>
          </>
        ),
    },
  ];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h2>Scheduling Windows</h2>
      <Table
        dataSource={windows}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        style={{ marginBottom: 24 }}
      />
      {adding ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <Select
            value={formState.weekday}
            onChange={v => setFormState(f => ({ ...f, weekday: v }))}
            style={{ width: 120 }}
          >
            {WEEKDAYS.map((d, i) => (
              <Select.Option value={i} key={i}>{d}</Select.Option>
            ))}
          </Select>
          <TimePicker
            value={formState.start_time}
            onChange={t => setFormState(f => ({ ...f, start_time: t }))}
            format="HH:mm"
            placeholder="Start Time"
          />
          <TimePicker
            value={formState.end_time}
            onChange={t => setFormState(f => ({ ...f, end_time: t }))}
            format="HH:mm"
            placeholder="End Time"
          />
          <Button type="primary" onClick={handleAdd}>Add</Button>
          <Button onClick={() => { setAdding(false); setFormState({ weekday: 0, start_time: null, end_time: null }); }}>Cancel</Button>
        </div>
      ) : (
        <Button type="dashed" onClick={() => setAdding(true)} style={{ marginBottom: 16 }}>
          + Add Scheduling Window
        </Button>
      )}
    </div>
  );
};

export default SchedulingWindowsPage; 