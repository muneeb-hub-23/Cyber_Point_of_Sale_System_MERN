import React, { useState, useRef, useEffect } from "react";
import { MdVerifiedUser } from "react-icons/md";

const SearchOption = ({ data, setCurrentCustomer, currentCustomer }) => {
  const [searchTerm, setSearchTerm] = useState(""); // State for search input
  const [isListVisible, setIsListVisible] = useState(false); // State for list visibility
  const wrapperRef = useRef(null); // Ref for detecting click outside

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsListVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // Function to filter data by name or phone
  const filteredData = data && searchTerm
    ? data.filter(
        (item) =>
          (item.customerName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.customerMobileNumber?.toString().includes(searchTerm))
      )
    : data || [];

  // Function to handle when a user clicks on an item
  const handleItemClick = (item) => {
    setSearchTerm(`${item.customerName} - ${item.customerMobileNumber}`); // Set selected item in input field
    setIsListVisible(false); // Hide the list
    setCurrentCustomer(item); // Update the current customer
    setSearchTerm(""); // Clear search input
  };

  return (
    <div
      className="bg-transparent"
      ref={wrapperRef}
      tabIndex="0"
      style={{ position: "relative" }}
    >
      <input
        type="text"
        className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-white dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
        placeholder="Search by name or phone"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)} // Update search input state
        onFocus={() => setIsListVisible(true)} // Show list when input is focused
      />

      {isListVisible && filteredData.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            background:"none",
            left: 0,
            width: "100%",
            zIndex: 1000,
            border: "1px solid #ccc",
          }}
        >
          {filteredData.map((item) => (
            <li
              key={item._id}
              className="bg-graydark text-white cursor-pointer w-full border border-b-2 font-bold"
              onClick={() => handleItemClick(item)}
            >
              <p className="mx-8 bg-transparent my-3 mr-24 flex space-x-3 items-center">
               {item.verified && <span className="text-green-600 p-1 text-xl"><MdVerifiedUser /></span>} {item.customerName} - {item.customerMobileNumber}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchOption;
