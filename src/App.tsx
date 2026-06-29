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
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="expenses/:id" element={<ExpenseDetail />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="tickets/:id" element={<TicketDetail />} />
            <Route path="vault" element={<Passwords />} />
            <Route path="admin/form-builder" element={<FormBuilder />} />
            <Route path="admin/users" element={<UserManagement />} />
            <Route path="admin/submissions" element={<Submissions />} />
            <Route path="admin/submissions/:id" element={<SubmissionDetail />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
