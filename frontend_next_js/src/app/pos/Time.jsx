import React, { useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { FiCalendar } from 'react-icons/fi'; // Import a calendar icon from react-icons
import 'react-datepicker/dist/react-datepicker.css'; // Import the CSS for the date picker
import CameraCapture from '../test/CameraModule';

const DateTimeComponent = ({ selectedDate, setSelectedDate, currentTime,setCurrentTime,user }) => {
  // Function to update the current time every second
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Cleanup on component unmount
    return () => clearInterval(timerId);
  }, []);

  // Format the selected date and current time
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
    });
  };

  return (
    <div className="flex items-center justify-between w-full">
    <div className="flex flex-col items-start bg-transparent p-4 rounded-lg shadow-lg">
      <div className="flex items-center mb-2">
        <FiCalendar className="text-2xl mr-2" />
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)} // Update the selected date
          dateFormat="MMMM d, yyyy" // Format for the date display
          className="border-none bg-transparent cursor-pointer text-lg"
        />
      </div>
      <h3 className="text-lg text-white">{formatTime(currentTime)}</h3>
      <h3 className="text-lg text-white">{user.username}</h3>
    </div>
    <div className='w-1/2 pr-2 overflow-clip'>
      {/* <CameraCapture /> */}
    </div>
    </div>
  );
};

export default DateTimeComponent;
