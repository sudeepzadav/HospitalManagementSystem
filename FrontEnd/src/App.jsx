import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
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

const App = () => {
  const location = useLocation();

  const hideNavbarAndFooter = [
    "/signin",
    "/signup",
    "/doctor/complete-profile",
  ].includes(location.pathname);

  return (
    <div>
      {!hideNavbarAndFooter && (
        <>
          <Navbar />
          <NavbarTwo />
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
      </Routes>

      {!hideNavbarAndFooter && (
        <>
          <Footer />
        </>
      )}
    </div>
  );
};

export default App;