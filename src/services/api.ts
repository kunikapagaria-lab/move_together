const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const token = user?.token;

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // --- Auth ---
  register: async (data: any) => {
    const res = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },
  login: async (data: any) => {
    const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },

  // --- Challenges ---
  getActiveChallenge: async () => {
    const res = await fetch(`${API_URL}/challenges/active`, { headers: getHeaders() });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },
  startChallenge: async (durationDays: number, tasks: any[], invitedFriendIds?: string[]) => {
    const res = await fetch(`${API_URL}/challenges/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ durationDays, tasks, invitedFriendIds })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to start challenge');
    return res.json();
  },
  cancelChallenge: async () => {
    const res = await fetch(`${API_URL}/challenges/cancel`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },
  getAllChallenges: async () => {
    const res = await fetch(`${API_URL}/challenges/all`, { headers: getHeaders() });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },

  // --- Logs ---
  getTodayLog: async (challengeId: string) => {
    const res = await fetch(`${API_URL}/logs/today/${challengeId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },
  toggleTask: async (challengeId: string, taskId: string, isCompleted: boolean) => {
    const res = await fetch(`${API_URL}/logs/toggle-task`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ challengeId, taskId, isCompleted })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },
  updateJournal: async (challengeId: string, journalEntry: string) => {
    const res = await fetch(`${API_URL}/logs/journal`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ challengeId, journalEntry })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },
  getStreak: async (challengeId: string) => {
    const res = await fetch(`${API_URL}/logs/streak/${challengeId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },

  // --- AI Coach ---
  getCoachInsight: async (userId: string) => {
    const res = await fetch(`${API_URL}/coach/insight`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },

  // --- History ---
  getHistory: async (challengeId: string) => {
    const res = await fetch(`${API_URL}/logs/history/${challengeId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },
  getChallengeLogs: async (challengeId: string) => {
    const res = await fetch(`${API_URL}/logs/challenge/${challengeId}/all`, { headers: getHeaders() });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },

  // --- Groups ---
  createGroup: async (name: string, challengeTemplateId: string) => {
    const res = await fetch(`${API_URL}/groups/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, challengeTemplateId })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },
  joinGroup: async (joinCode: string) => {
    const res = await fetch(`${API_URL}/groups/join`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ joinCode })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },
  getMyGroups: async () => {
    const res = await fetch(`${API_URL}/groups/my-groups`, { headers: getHeaders() });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },
  getChallengeGroups: async () => {
    const res = await fetch(`${API_URL}/challenges/groups`, { headers: getHeaders() });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },

  // --- Friends ---
  searchUsers: async (query: string) => {
    const res = await fetch(`${API_URL}/friends/search?q=${encodeURIComponent(query)}`, { headers: getHeaders() });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },
  respondToFriendRequest: async (requestId: string, action: 'accept' | 'reject') => {
    const res = await fetch(`${API_URL}/friends/requests/${requestId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ action })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },

  // --- Notifications ---
  getNotifications: async () => {
    const res = await fetch(`${API_URL}/notifications`, { headers: getHeaders() });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },
  markNotificationRead: async (id: string) => {
    const res = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },
  respondToGroupInvite: async (id: string, action: 'accept' | 'decline') => {
    const res = await fetch(`${API_URL}/notifications/${id}/respond`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },
  sendFriendRequest: async (recipientId: string) => {
    const res = await fetch(`${API_URL}/friends/request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ recipientId })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },
  acceptFriendRequest: async (requestId: string) => {
    const res = await fetch(`${API_URL}/friends/accept/${requestId}`, {
      method: 'PUT',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },
  rejectFriendRequest: async (requestId: string) => {
    const res = await fetch(`${API_URL}/friends/reject/${requestId}`, {
      method: 'PUT',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },
  getMyFriends: async () => {
    const res = await fetch(`${API_URL}/friends/mine`, { headers: getHeaders() });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return res.json();
  },

  // --- Wearables / Integrations ---
  syncWearableData: async (provider: string, distanceKm?: number) => {
    const res = await fetch(`${API_URL}/integrations/sync`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ provider, distanceKm })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Sync Error');
    return res.json();
  }
};
