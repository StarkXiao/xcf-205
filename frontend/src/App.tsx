import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import EventReport from './pages/EventReport';
import EventList from './pages/EventList';
import EventMap from './pages/EventMap';
import WorkOrderList from './pages/WorkOrderList';
import WorkOrderDetail from './pages/WorkOrderDetail';
import UserManage from './pages/UserManage';
import RoleManage from './pages/RoleManage';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="events/report" element={<EventReport />} />
            <Route path="events/list" element={<EventList />} />
            <Route path="events/map" element={<EventMap />} />
            <Route path="workorders" element={<WorkOrderList />} />
            <Route path="workorders/:id" element={<WorkOrderDetail />} />
            <Route path="system/users" element={<UserManage />} />
            <Route path="system/roles" element={<RoleManage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
