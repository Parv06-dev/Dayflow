import { useCallback, useEffect, useState } from 'react';
import apiRequest from './apiService';

const useAttendance = (enabled = true) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshStatus = useCallback(async () => {
    const data = await apiRequest('/attendance/status');
    setStatus(data);
    return data;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    refreshStatus().catch((error) => console.error('Error fetching attendance status:', error));
  }, [enabled, refreshStatus]);

  const punch = useCallback(async (action) => {
    setLoading(true);
    try {
      const response = await apiRequest('/attendance/punch', {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      await refreshStatus();
      return response;
    } finally {
      setLoading(false);
    }
  }, [refreshStatus]);

  return {
    status,
    loading,
    checkIn: () => punch('IN'),
    checkOut: () => punch('OUT'),
    refreshStatus
  };
};

export default useAttendance;
