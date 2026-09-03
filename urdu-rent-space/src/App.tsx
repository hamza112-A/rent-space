import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CategoryPage from "./pages/CategoryPage";
import Dashboard from "./pages/Dashboard";
import ListingDetail from "./pages/ListingDetail";
import CreateListing from "./pages/CreateListing";
import VerifyOTP from "./pages/VerifyOTP";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import Subscription from "./pages/Subscription";
import UserProfile from "./pages/UserProfile";
import Storefront from "./pages/Storefront";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <TooltipProvider>
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/category/:categoryId" element={<CategoryPage />} />
              <Route path="/listings" element={<CategoryPage />} />
              <Route path="/listing/:listingId" element={<ListingDetail />} />
              <Route path="/create-listing" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
              <Route path="/edit-listing/:listingId" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
              <Route path="/payment/checkout" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/failed" element={<PaymentFailed />} />
              <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/store/:slug" element={<Storefront />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
