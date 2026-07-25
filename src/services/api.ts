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

const safeFetch = async (url: string, options: RequestInit = {}, retries = 2): Promise<any> => {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        let errorMsg = 'API Request Failed';
        try {
          const errData = await res.json();
          errorMsg = errData.error || errData.message || errorMsg;
        } catch (_) {}
        throw new Error(errorMsg);
      }
      return await res.json();
    } catch (err: any) {
      if (i < retries && (err.name === 'TypeError' || err.message?.includes('fetch'))) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        continue;
      }
      if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
        throw new Error('Server is waking up on cloud host. Please wait 5 seconds and retry!');
      }
      throw err;
    }
  }
};

export const api = {
  // --- Auth ---
  register: async (data: any) => {
    return safeFetch(`${API_URL}/auth/register`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
  },
  login: async (data: any) => {
    return safeFetch(`${API_URL}/auth/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
  },

  // --- Challenges ---
  getActiveChallenge: async () => {
    return safeFetch(`${API_URL}/challenges/active`, { headers: getHeaders() });
  },
  startChallenge: async (durationDays: number, tasks: any[], invitedFriendIds?: string[]) => {
    return safeFetch(`${API_URL}/challenges/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ durationDays, tasks, invitedFriendIds })
    });
  },
  cancelChallenge: async () => {
    return safeFetch(`${API_URL}/challenges/cancel`, {
      method: 'POST',
      headers: getHeaders()
    });
  },
  getAllChallenges: async () => {
    return safeFetch(`${API_URL}/challenges/all`, { headers: getHeaders() });
  },

  // --- Logs ---
  getTodayLog: async (challengeId: string) => {
    return safeFetch(`${API_URL}/logs/today/${challengeId}`, { headers: getHeaders() });
  },
  toggleTask: async (challengeId: string, taskId: string, isCompleted: boolean) => {
    return safeFetch(`${API_URL}/logs/toggle-task`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ challengeId, taskId, isCompleted })
    });
  },
  updateJournal: async (challengeId: string, journalEntry: string) => {
    return safeFetch(`${API_URL}/logs/journal`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ challengeId, journalEntry })
    });
  },
  getStreak: async (challengeId: string) => {
    return safeFetch(`${API_URL}/logs/streak/${challengeId}`, { headers: getHeaders() });
  },

  // --- AI Coach ---
  getCoachInsight: async (userId: string) => {
    return safeFetch(`${API_URL}/coach/insight`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId })
    });
  },

  // --- History ---
  getHistory: async (challengeId: string) => {
    return safeFetch(`${API_URL}/logs/history/${challengeId}`, { headers: getHeaders() });
  },
  getChallengeLogs: async (challengeId: string) => {
    return safeFetch(`${API_URL}/logs/challenge/${challengeId}/all`, { headers: getHeaders() });
  },

  // --- Groups ---
  createGroup: async (name: string, challengeTemplateId: string) => {
    return safeFetch(`${API_URL}/groups/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, challengeTemplateId })
    });
  },
  joinGroup: async (joinCode: string) => {
    return safeFetch(`${API_URL}/groups/join`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ joinCode })
    });
  },
  getMyGroups: async () => {
    return safeFetch(`${API_URL}/groups/my-groups`, { headers: getHeaders() });
  },
  getChallengeGroups: async () => {
    return safeFetch(`${API_URL}/challenges/groups`, { headers: getHeaders() });
  },

  // --- Friends ---
  searchUsers: async (query: string) => {
    return safeFetch(`${API_URL}/friends/search?q=${encodeURIComponent(query)}`, { headers: getHeaders() });
  },
  respondToFriendRequest: async (requestId: string, action: 'accept' | 'reject') => {
    return safeFetch(`${API_URL}/friends/requests/${requestId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ action })
    });
  },

  // --- Notifications ---
  getNotifications: async () => {
    return safeFetch(`${API_URL}/notifications`, { headers: getHeaders() });
  },
  markNotificationRead: async (id: string) => {
    return safeFetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders()
    });
  },
  respondToGroupInvite: async (id: string, action: 'accept' | 'decline') => {
    return safeFetch(`${API_URL}/notifications/${id}/respond`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action })
    });
  },
  sendFriendRequest: async (recipientId: string) => {
    return safeFetch(`${API_URL}/friends/request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ recipientId })
    });
  },
  acceptFriendRequest: async (requestId: string) => {
    return safeFetch(`${API_URL}/friends/accept/${requestId}`, {
      method: 'PUT',
      headers: getHeaders()
    });
  },
  rejectFriendRequest: async (requestId: string) => {
    return safeFetch(`${API_URL}/friends/reject/${requestId}`, {
      method: 'PUT',
      headers: getHeaders()
    });
  },
  getMyFriends: async () => {
    return safeFetch(`${API_URL}/friends/mine`, { headers: getHeaders() });
  },

  // --- Wearables / Integrations ---
  syncWearableData: async (provider: string, distanceKm?: number) => {
    return safeFetch(`${API_URL}/integrations/sync`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ provider, distanceKm })
    });
  }
};
