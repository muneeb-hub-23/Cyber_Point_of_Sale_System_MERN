import React, { useState, useRef,useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

const SearchOption = ({ data,setData,type,onChange }) => {
  const router = useRouter( )
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
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [wrapperRef]);

  // Function to filter data by name or phone
  const filteredData = useMemo(() => {
    if (type === 'shop') {
      return data
        ? data.filter((item) =>
            item.shopName.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : [];
    } else if (type === 'customer') {
      return data
        ? data.filter(
            (item) =>
              (item.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
              (item.customerMobileNumber?.toString() || '').includes(searchTerm)
          )
        : [];
    } else if (type === 'category') {
      return data
        ? data.filter((item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : [];
    } else {
      return [];
    }
  }, [data, searchTerm, type]); 

  // Function to handle when a user clicks on an item
  const handleItemClick = async (item) => {
    if(type==='customer'){
      setSearchTerm(item.customerName)
    }else if(type === 'shop'){
      setSearchTerm(item.shopName)
    }else if(type === 'category'){
      setSearchTerm(item.name)
    }
    setIsListVisible(false);
    setData(item)
    onChange(item)

  
  };
  const handleKeyPress = async (e)=>{
    return
  }





if(type === 'customer'){
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
        onChange={(e) =>{
          if(e.target.value.length<1){
            setSearchTerm('')
            onChange(undefined)
          }
          setSearchTerm(e.target.value)
        }} // Update search input state
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
              <p className="mx-8 bg-transparent my-3 mr-24">
                {item.customerName} - {item.customerMobileNumber}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}else if(type === 'shop'){
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
        onChange={(e) =>{
          if(e.target.value.length<1){
            onChange(undefined)
          }
          setSearchTerm(e.target.value)
        }} // Update search input state
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
              <p className="mx-8 bg-transparent my-3 mr-24">
                {item.shopName}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}else if(type === 'category'){
  return (
    <div
      onKeyDown={handleKeyPress}
      className="bg-transparent"
      ref={wrapperRef}
      tabIndex="0"
      style={{ position: "relative" }}
    >
      <input
        type="text"
        className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-white dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
        placeholder="Search Category"
        value={searchTerm}
        onChange={(e) =>{
          if(e.target.value.length<1){
            setSearchTerm('')
            onChange(undefined)
          }
          setSearchTerm(e.target.value)
        }} // Update search input state
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
              <p className="mx-8 bg-transparent my-3 mr-24">
                {item.name}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

};

export default SearchOption;
