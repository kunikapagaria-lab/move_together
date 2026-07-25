import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';

export interface UserSnippet {
  _id: string;
  displayName: string;
  email: string;
}

export interface Friendship {
  _id: string;
  requester: UserSnippet;
  recipient: UserSnippet;
  status: 'pending' | 'accepted' | 'rejected';
}

interface FriendState {
  friends: Friendship[];
  searchResults: UserSnippet[];
  isLoading: boolean;
  isSearching: boolean;
  isError: boolean;
  message: string;
}

const initialState: FriendState = {
  friends: [],
  searchResults: [],
  isLoading: false,
  isSearching: false,
  isError: false,
  message: ''
};

export const fetchFriends = createAsyncThunk(
  'friend/fetchFriends',
  async (_, thunkAPI) => {
    try {
      return await api.getMyFriends();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const searchUsers = createAsyncThunk(
  'friend/searchUsers',
  async (query: string, thunkAPI) => {
    try {
      return await api.searchUsers(query);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const sendFriendRequest = createAsyncThunk(
  'friend/sendFriendRequest',
  async (recipientId: string, thunkAPI) => {
    try {
      return await api.sendFriendRequest(recipientId);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const acceptFriendRequest = createAsyncThunk(
  'friend/acceptFriendRequest',
  async (requestId: string, thunkAPI) => {
    try {
      return await api.acceptFriendRequest(requestId);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const rejectFriendRequest = createAsyncThunk(
  'friend/rejectFriendRequest',
  async (requestId: string, thunkAPI) => {
    try {
      return await api.rejectFriendRequest(requestId);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const friendSlice = createSlice({
  name: 'friend',
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFriends.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.isLoading = false;
        state.friends = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      .addCase(searchUsers.pending, (state) => {
        state.isSearching = true;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload;
      })
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        state.friends.push(action.payload);
      })
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        const index = state.friends.findIndex(f => f._id === action.payload._id);
        if (index !== -1) {
          state.friends[index] = action.payload;
        }
      })
      .addCase(rejectFriendRequest.fulfilled, (state, action) => {
        const index = state.friends.findIndex(f => f._id === action.payload._id);
        if (index !== -1) {
          state.friends[index] = action.payload;
        }
      });
  }
});

export const { clearSearchResults } = friendSlice.actions;
export default friendSlice.reducer;
