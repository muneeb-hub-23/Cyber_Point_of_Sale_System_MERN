'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MdVerifiedUser } from "react-icons/md";

const SelectCustomer = ({ setCustomer, customersList, setCustomerSelecting }) => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('');
  const handleKeyPress = (e)=>{
  
    if(e.key === "Escape"){
      setCustomerSelecting(false)
    }
    if(e.key === "Enter"){
      if(filteredCustomers.length>0){
        setCustomer(filteredCustomers[0])
        setCustomerSelecting(false)
      }else{
        router.push("/customers/addcustomer")
      }
    }
  }
  useEffect(()=>{
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  },[])

  // Filter customers based on search term
  const filteredCustomers = customersList && customersList.filter(customer => 
    customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (customer.customerMobileNumber && String(customer.customerMobileNumber).includes(searchTerm))
  );

  return (
    <div onKeyDown={handleKeyPress} className='absolute top-0 left-0 w-full h-screen bg-boxdark z-99999 p-4'>
      {/* Search input */}
      <div className="mb-4">
        <input 
          autoFocus
          type="text" 
          placeholder="Search by name or mobile number" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full p-2 border rounded bg-boxdark text-white text-xl font-bold"
        />
      </div>
      
      {/* Customer List */}
      <div className="bg-transparent text-white p-2 rounded overflow-y-auto h-4/5">
        {filteredCustomers && filteredCustomers.map((customer, idx) => (
          <div 
            key={customer._id || customer.id || idx} 
            className="p-2 border-b cursor-pointer hover:bg-gray-200"
            onClick={() => {
              setCustomer(customer);
              setCustomerSelecting(false);
            }}
          >
            <p className="font-bold flex space-x-3 items-center">{customer.verified && <span className="text-green-600 p-1 text-xl"><MdVerifiedUser /></span>} {customer.customerName}</p>
            <p className="text-sm text-gray-600">{customer.customerMobileNumber}</p>
          </div>
        ))}
      </div>

      <div className="flex space-x-5 justify-center">
      <button 
        onClick={() => setCustomerSelecting(false)} 
        className="mt-4 p-2 text-white bg-rose-700 w-5/12 text-xl hover:scale-110 rounded"
      >
        Close
      </button>
      <button 
        onClick={() => router.push("/customers/addcustomer")} 
        className="mt-4 p-2 text-white bg-green-700 w-5/12 text-xl hover:scale-110 rounded"
      >
        Add New Customer | Supplier
      </button>
      </div>
    </div>
  );
};

export default SelectCustomer;
