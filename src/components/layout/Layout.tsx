import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { TopNav } from './TopNav';
import type { AppDispatch, RootState } from '../../store';
import { fetchChallengeData } from '../../store/challengeSlice';
import { fetchMyGroups } from '../../store/groupSlice';
import { fetchFriends } from '../../store/friendSlice';
import { fetchNotifications } from '../../store/notificationSlice';

export const Layout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(fetchChallengeData());
      dispatch(fetchMyGroups());
      dispatch(fetchFriends());
      dispatch(fetchNotifications());
    }
  }, [dispatch, user]);

  return (
    <div className="min-h-screen pt-24 pb-8">
      <TopNav />
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
};
