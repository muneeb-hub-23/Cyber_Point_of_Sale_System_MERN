'use client';
import flatpickr from 'flatpickr';
import { useEffect } from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md'; // React Icons for arrows

const DatePickerOne = ({ setWarningDate }) => {
  useEffect(() => {
    // Initialize flatpickr without static mode for responsiveness
    flatpickr(".form-datepicker", {
      mode: "single",
      dateFormat: "M j, Y",
      prevArrow: <MdChevronLeft />,  // React icon for previous arrow
      nextArrow: <MdChevronRight />, // React icon for next arrow
    });
  }, []);

  const handleChange = (e) => {
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };
    setWarningDate(formatDate(e.target.value));
  };

  return (
    <div className="relative w-full max-w-lg">
      <input
        className="form-datepicker w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-normal outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
        placeholder="mm/dd/yyyy"
        data-class="flatpickr-right"
        id="date"
        onInput={handleChange}
      />

      {/* Datepicker icons for previous and next */}
      <div className="pointer-events-none absolute inset-0 left-auto right-5 flex items-center">
        <MdChevronLeft className="text-gray-500" size={24} />
      </div>
      <div className="pointer-events-none absolute inset-0 left-auto right-0 flex items-center">
        <MdChevronRight className="text-gray-500" size={24} />
      </div>
    </div>
  );
};

export default DatePickerOne;
