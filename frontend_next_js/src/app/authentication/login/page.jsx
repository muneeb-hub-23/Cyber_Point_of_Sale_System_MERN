"use client";
import React, { useState } from "react";
import axios from "axios";
import { FaUserShield } from "react-icons/fa";
import apiaddress from "@/apirequests/apiaddress";
import { motion } from "framer-motion"; // For animation effects
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useGlobalState } from '@/js/globaluser';

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, setUser } = useGlobalState(); // Access the global state
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Track login process
  const [fallDown, setFallDown] = useState(false); // For "unstick and fall down" effect

  
  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const response = await axios.post(`${apiaddress}/authentication/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

      // Save token to localStorage and user in useState
      localStorage.setItem("token", token);
      
      // Trigger animation effect
      setFallDown(true);
      setTimeout(() => {
        setUser(user);
      }, 1000);
    } catch (error) {
      console.error("Error logging in:", error);
      toast.error("Failed to login. Please check your credentials.");
    } finally {
      setIsLoggingIn(false);
    }
  };
  return (
    <div className="flex h-screen bg-gray-100">
      <ToastContainer />
      {/* Left side: Image */}
      <motion.div
        className="hidden md:flex md:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/login_bg.jpg')" }}
        initial={{ opacity: 1, y: 0 }}
        animate={fallDown ? { opacity: 0, y: -1000 } : { opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      ></motion.div>

      {/* Right side: Login form */}
      <motion.div
        className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 bg-white"
        initial={{ opacity: 1, y: 0 }}
        animate={fallDown ? { opacity: 0, y: 1000 } : {}}
        transition={{ duration: 1 }}
      >
        <h1 className="text-4xl font-bold mb-8">Login</h1>


       <form onSubmit={handleLogin} className="w-full max-w-md">
          <div className="mb-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 border border-gray-300 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 border border-gray-300 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className={`w-full p-3 text-white rounded-lg ${
              isLoggingIn ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? "Logging in..." : "Login"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
