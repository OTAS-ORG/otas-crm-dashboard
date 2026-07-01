import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PreSale from './pages/PreSale';
import PostSale from './pages/PostSale';
import ClientPortal from './pages/ClientPortal';
import PublicFormPage from './pages/PublicFormPage';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Expenses from './pages/Expenses';
import ExpenseDetail from './pages/ExpenseDetail';
import Analytics from './pages/Analytics';
import Salaries from './pages/Salaries';
import SalaryDetail from './pages/SalaryDetail';
import Tickets from './pages/Tickets';
import TicketDetail from './pages/TicketDetail';
import Passwords from './pages/Passwords';
import FormBuilder from './pages/FormBuilder';
import UserManagement from './pages/UserManagement';
import Submissions from './pages/Submissions';
import SubmissionDetail from './pages/SubmissionDetail';
import OnboardingFormPage from './pages/OnboardingFormPage';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
};

const RoleRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user } = useAuth();
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/public/form/:type/:clientId" element={<PublicFormPage />} />
          <Route path="/onboarding/:token" element={<OnboardingFormPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<PreSale />} />
            <Route path="post-sale" element={<PostSale />} />
            <Route path="portal/:id" element={<ClientPortal />} />
            <Route path="invoices" element={<RoleRoute><Invoices /></RoleRoute>} />
            <Route path="invoices/:id" element={<RoleRoute><InvoiceDetail /></RoleRoute>} />
            <Route path="expenses" element={<RoleRoute><Expenses /></RoleRoute>} />
            <Route path="expenses/:id" element={<RoleRoute><ExpenseDetail /></RoleRoute>} />
            <Route path="analytics" element={<RoleRoute><Analytics /></RoleRoute>} />
            <Route path="tickets" element={<RoleRoute><Tickets /></RoleRoute>} />
            <Route path="tickets/:id" element={<RoleRoute><TicketDetail /></RoleRoute>} />
            <Route path="salaries" element={<RoleRoute><Salaries /></RoleRoute>} />
            <Route path="salaries/:id" element={<RoleRoute><SalaryDetail /></RoleRoute>} />
            <Route path="vault" element={<RoleRoute><Passwords /></RoleRoute>} />
            <Route path="admin/form-builder" element={<RoleRoute><FormBuilder /></RoleRoute>} />
            <Route path="admin/users" element={<RoleRoute><UserManagement /></RoleRoute>} />
            <Route path="admin/submissions" element={<RoleRoute><Submissions /></RoleRoute>} />
            <Route path="admin/submissions/:id" element={<RoleRoute><SubmissionDetail /></RoleRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
