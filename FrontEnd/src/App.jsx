import React from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer";
import Home from "./components/Home";
import NavbarTwo from "./components/Navbar/NavbarTwo";
import Departments from "./pages/Departments";
import WhyUs from "./pages/WhyUs";
import Doctors from "./pages/Doctors";
import Appointment from "./pages/Appointment";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import AiChatboat from "./components/AiChatboat";
import Auth from "./components/Auth";
import VerifyEmail from "./pages/verifyEmail";
import DoctorsProfile from "./pages/DoctorsProfile";
import UserDashboard from "./components/Dashboard/UserDashboard";
import AdminDashboard from "./components/Dashboard/AdminDashboard";
import DoctorDashboard from "./components/Dashboard/DoctorDashboard";
import ProfilePage from "./components/Profile";
import Careers from "./pages/Careers";

function AppContent() {
  const location = useLocation();
  const { user } = useAuth();

  const hideNavbarAndFooter = [
    "/signin",
    "/signup",
    "/doctor/complete-profile",
  ].includes(location.pathname);

  if (user?.role === "admin" && location.pathname !== "/admin-dashboard") {
    return <Navigate to="/admin-dashboard" replace />;
  }

  /* DOCTOR Doctor can ONLY access doctor-dashboard */ 
  if (
    user?.role === "doctor"
  ) {
    if (location.pathname !== "/doctor-dashboard") {
      return <Navigate to="/doctor-dashboard" replace />;
    }
  }

  return (
    <div>
      {!hideNavbarAndFooter && (
        <>
          <Navbar />
          {(!user || user?.role === "patient") && <NavbarTwo />}
        </>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/why-us" element={<WhyUs />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/appointment/payment" element={<Payment />} />
        <Route path="/appointment/success" element={<PaymentSuccess />} />
        <Route path="/appointment/failure" element={<PaymentFailure />} />
        <Route path="/signin" element={<Auth type="signin" />} />
        <Route path="/signup" element={<Auth type="signup" />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/doctor/complete-profile" element={<DoctorsProfile />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/careers" element={<Careers />} />
      </Routes>

      {!hideNavbarAndFooter && (
        <>
          <Footer />
          <AiChatboat />
        </>
      )}
    </div>
  );
}

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
