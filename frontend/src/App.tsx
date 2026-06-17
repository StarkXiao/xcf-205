import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
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
import InspectionList from './pages/InspectionList';
import InspectionPlanForm from './pages/InspectionPlanForm';
import InspectionCheckin from './pages/InspectionCheckin';
import InspectionExceptionReport from './pages/InspectionExceptionReport';
import NotificationCenter from './components/NotificationCenter';
import KnowledgeBase from './pages/KnowledgeBase';
import DepartmentPerformance from './pages/DepartmentPerformance';
import ApprovalList from './pages/ApprovalList';
import ApprovalConfig from './pages/ApprovalConfig';
import ApprovalDetail from './pages/ApprovalDetail';
import AttachmentList from './pages/AttachmentList';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="notifications" element={<NotificationCenter />} />
              <Route path="events/report" element={<EventReport />} />
              <Route path="events/list" element={<EventList />} />
              <Route path="events/map" element={<EventMap />} />
              <Route path="workorders" element={<WorkOrderList />} />
              <Route path="workorders/:id" element={<WorkOrderDetail />} />
              <Route path="inspection" element={<InspectionList />} />
              <Route path="inspection/plans/new" element={<InspectionPlanForm />} />
              <Route path="inspection/plans/:id/edit" element={<InspectionPlanForm />} />
              <Route path="inspection/tasks/:id/checkin" element={<InspectionCheckin />} />
              <Route path="inspection/tasks/:id/exception" element={<InspectionExceptionReport />} />
              <Route path="system/users" element={<UserManage />} />
              <Route path="system/roles" element={<RoleManage />} />
              <Route path="knowledge" element={<KnowledgeBase />} />
              <Route path="performance" element={<DepartmentPerformance />} />
              <Route path="approvals" element={<ApprovalList />} />
              <Route path="approvals/config" element={<ApprovalConfig />} />
              <Route path="approvals/:id" element={<ApprovalDetail />} />
              <Route path="attachments" element={<AttachmentList />} />
            </Route>
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
