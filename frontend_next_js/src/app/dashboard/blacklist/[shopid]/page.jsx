"use client"
import React, { useEffect } from 'react'
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useParams } from 'next/navigation';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import apiaddress from "@/apirequests/apiaddress";
import Link from "next/link";
import Menu from '@/components/Menu'
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";

const Page = () => {
  const {user} = useGlobalState()
  const token = localStorage.getItem("token")
  const params = useParams()
  const [customers, setCustomers] = useState([]); // Initial empty array
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]); // For filtered data

  const handleSearch = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);

    // Filter customers by name or phone
    const filtered = customers.filter(
      (item) =>
        item.customer.customerName.toLowerCase().includes(searchValue) ||
        item.customer.customerMobileNumber.toString().includes(searchValue)
    );
    setFilteredCustomers(filtered); // Update filtered results
  };
  const formatDateTimex = (date) => {
    if (!date) return "No Transactions";
    
    try {
      // If it's already a Date object
      if (date instanceof Date) {
        return date.toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
      
      // If it's in YYYYMMDD format
      if (/^\d{8}$/.test(date)) {
        const year = date.substring(0, 4);
        const month = date.substring(4, 6);
        const day = date.substring(6, 8);
        return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
      
      // If it's an ISO string or other date format
      return new Date(date).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };
  
  const getDaysAgo = (date) => {
    if (!date) return 'N/A';
    
    try {
      const transactionDate = date instanceof Date ? date : new Date(date);
      const diffTime = Math.abs(new Date() - transactionDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    } catch (e) {
      return 'N/A';
    }
  };
    useEffect(() => {
      const fetchBlackList = async () =>{
        let data = await fetch(apiaddress+"/customers/getblacklist",{
          method:"GET",
          headers:{
              "shopid":params.shopid,
              token
          }
      })
      let parsed = await data.json()
      setFilteredCustomers(parsed)
      setCustomers(parsed)
      }
      fetchBlackList()
    }, [])

    if(user && user.permissions.includes("blacklist")){
  return (
    <Menu>
    <DefaultLayout>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Blacklist Customers" />
      </div>

      <div className='min-h-[100vh]'>

        <div className="rounded-sm border mb-5 shadow-lg border-stroke w-full text-center items-center bg-white dark:border-strokedark dark:bg-boxdark">
          <input name="linkedShop"
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search Customer"
            className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
          >
          </input>
        </div>
        <div className="rounded-sm border border-stroke w-full text-center items-center bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

          <table className="w-full">
            <thead className="my-3">
              <tr className="shadow-3 my-3 bg-graydark text-white">
                <td className="p-3 w-1/6">Customer Name</td>
                <td className="p-3 w-1/6">Mobile Number</td>
                <td className="p-3 w-1/6">Balance</td>
                <td className="p-3 w-1/6">Last Transaction</td>
                <td className="p-3 w-1/6">Days Since Last Transaction</td>
                <td className="p-3 w-1/6">Status</td>
              </tr>
            </thead>
            <tbody className="my-3">
              {filteredCustomers && filteredCustomers.map((customer) => (
                <tr key={customer.customer._id} className="shadow-3 py-3 dark:hover:bg-slate-500 hover:bg-blue-200 font-bold cursor-pointer">
                  <td className="w-1/6">
                    <Link key={customer.customer._id} href={'/customers/customerkhatadetail/' + customer.customer._id}>
                      <p className="m-3">
                        {customer.customer.customerName}
                      </p>
                    </Link>
                  </td>
                  <td className="p-3 w-1/6">
                    <Link key={customer.customer._id} href={'/customers/customerkhatadetail/' + customer.customer._id}>
                      <p className="m-3">{customer.customer.customerMobileNumber}</p>
                    </Link>
                  </td>
                  <td className={`p-3 w-1/6 ${customer.customer.currentBalance > 0 ? 'text-green-500' : 'text-rose-500'}`}>
                    <Link key={customer.customer._id} href={'/customers/customerkhatadetail/' + customer.customer._id}>
                      <p className="m-3">
                        {customer.customer.currentBalance > 0 
                          ? `Lene Hain: ${customer.customer.currentBalance}`
                          : `Dene Hain: ${Math.abs(customer.customer.currentBalance)}`}
                      </p>
                    </Link>
                  </td>
                  <td className="p-3 w-1/6">
                    <Link key={customer.customer._id} href={'/customers/customerkhatadetail/' + customer.customer._id}>
                      <p className="m-3">
                        {customer.lastTransaction 
                          ? formatDateTimex(customer.lastTransaction.date) 
                          : 'No transactions'}
                      </p>
                    </Link>
                  </td>
                  <td className="p-3 w-1/6">
                    <Link key={customer.customer._id} href={'/customers/customerkhatadetail/' + customer.customer._id}>
                      <p className="m-3">
                        {customer.lastTransactionDate ? getDaysAgo(customer.lastTransactionDate) : 'N/A'}
                      </p>
                    </Link>
                  </td>
                  <td className="p-3 w-1/6">
                    <Link key={customer.customer._id} href={'/customers/customerkhatadetail/' + customer.customer._id}>
                      <span className={`inline-flex rounded-full bg-opacity-10 px-3 py-1 text-sm font-medium ${
                        customer.lastTransactionDate && 
                        (new Date() - new Date(customer.lastTransactionDate)) > (30 * 24 * 60 * 60 * 1000)
                          ? 'bg-rose-500 text-rose-500' 
                          : 'bg-warning text-warning'
                      }`}>
                        {customer.lastTransactionDate && 
                        (new Date() - new Date(customer.lastTransactionDate)) > (30 * 24 * 60 * 60 * 1000)
                          ? 'Overdue' 
                          : 'Active'}
                      </span>
                    </Link>
                  </td>
                </tr>
              ))}

            </tbody>
          </table>

        </div>
      </div>
    </DefaultLayout>
    </Menu>
  )
}else{
  return(
    <LoginPage />
  )
}
}

export default Page

