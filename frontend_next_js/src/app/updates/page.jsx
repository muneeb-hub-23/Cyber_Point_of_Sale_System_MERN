'use client';
import React, { useState, useEffect } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import apiaddress from '@/apirequests/apiaddress';
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";

const Page = () => {
  const { user } = useGlobalState();
  const [message, setMessage] = useState('');
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpdate = async () => {
    setLoading(true);
    setMessage('');
    setProgress(0);

    try {
      const res = await fetch(apiaddress + '/update', {
        method: 'POST',
        headers: {
          token
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let isDone = false;
      let accumulatedMessage = '';

      while (!isDone) {
        const { value, done } = await reader.read();
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          accumulatedMessage += chunk;
          setMessage(accumulatedMessage); // Update UI with live status
        }
        isDone = done;
      }

      // Parse final accumulated message to check success or need for retry
      const finalData = JSON.parse(accumulatedMessage.slice(accumulatedMessage.indexOf('[')));
      const lastMessage = finalData[finalData.length - 1]?.message;

      if (lastMessage && lastMessage.includes('Production Build Created')) {
        setMessage('Software updated successfully.');
      } else {
        throw new Error('Update process incomplete.');
      }
    } catch (error) {
      console.error('Error during update attempt:', error);
      setMessage('An error occurred while updating the software. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const eventSource = new EventSource(apiaddress + '/progress');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data.progress);
      setMessage(data.message);
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      eventSource.close();
      setMessage('Connection to the server was lost. Please refresh the page.');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  if (user && user.permissions.includes("updates")) {
    return (
      <DefaultLayout>
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
          <div className="max-w-lg w-full bg-boxdark p-6 rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-center mb-6">Software Update</h1>
            <p className="text-center mb-6">
              Click the button below to check for and apply the latest software updates.
            </p>
            <button
              onClick={handleUpdate}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold rounded-lg hover:scale-105 transform transition-transform duration-200"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loader border-t-4 border-b-4 border-blue-500 rounded-full w-6 h-6 animate-spin"></div>
                  <span className="ml-2">Updating...</span>
                </div>
              ) : (
                "Update Software"
              )}
            </button>
            {message && (
              <p
                className={`mt-4 text-center font-semibold ${
                  message.includes('successfully') ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {message}
              </p>
            )}
            {loading && (
              <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
                <div
                  className="bg-blue-600 h-4 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </DefaultLayout>
    );
  } else {
    return <LoginPage />;
  }
};

export default Page;