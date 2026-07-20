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
import AiChatboat from "./components/AiChatboat";
import Auth from "./components/Auth";
import VerifyEmail from "./pages/verifyEmail";

const App = () => {
  const location = useLocation();

  const hideNavbarAndFooter = ["/signin", "/signup"].includes(
    location.pathname,
  );

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
        <Route path="/signin" element={<Auth type="signin" />} />
        <Route path="/signup" element={<Auth type="signup" />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
      </Routes>

      {!hideNavbarAndFooter && (
        <>
          <Footer />
          <AiChatboat />
        </>
      )}
    </div>
  );
};

export default App;
