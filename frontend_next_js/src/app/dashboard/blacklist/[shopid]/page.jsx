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
  const formatDateTimex = (value) => {
    if (!value) {
      return "No Transactions"; // Return this if value is null or undefined
    }
  
    // Check if the input is in the format YYYYMMDD
    if (/^\d{8}$/.test(value)) {
      const year = value.substring(0, 4);
      const monthNumber = value.substring(4, 6);
      const day = value.substring(6, 8);
  
      // Define an array to map month numbers to month names
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
  
      const month = monthNames[parseInt(monthNumber, 10) - 1]; // Get the month name
  
      return `${day}-${month}-${year}`; // Return the formatted date
    }
  
    return "Invalid Date Format"; // Return this if the format is not YYYYMMDD
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
                <td className="p-3 w-1/5">Customer Name</td>
                <td className="p-3 w-1/5">Customer Mobile Number</td>
                <td className="p-3 w-1/5">Total Lene Hain</td>
                <td className="p-3 w-1/5">Total Dene Hain</td>
                <td className="p-3 w-1/5">Date Created</td>
              </tr>
            </thead>
            <tbody className="my-3">
              {filteredCustomers && filteredCustomers.map((customer) => (
                <tr key={customer.customer._id} className="shadow-3 py-3 dark:hover:bg-slate-500 hover:bg-blue-200 font-bold cursor-pointer">
                  <td className="w-1/5">
                    <Link key={customer.customer._id} href={'/customers/customerkhatadetail/' + customer.customer._id}>
                      <p className="m-3">
                        {customer.customer.customerName}
                      </p>
                    </Link>
                  </td>
                  <td className="p-3 w-1/5">
                    <Link key={customer.customer._id} href={'/customers/customerkhatadetail/' + customer.customer._id}>
                      <p className="m-3">
                        {customer.customer.customerMobileNumber}</p></Link></td>
                  <td className="p-3 w-1/5 text-green-500">
                    <Link key={customer._id} href={'/customers/customerkhatadetail/' + customer.customer._id}>
                      <p className="m-3">{customer.customer.leneHain}</p></Link></td>
                  <td className="p-3 w-1/5 text-rose-500">
                    <Link key={customer.customer._id} href={'/customers/customerkhatadetail/' + customer.customer._id}>
                      <p className="m-3">{customer.customer.deneHain}</p></Link></td>
                  <td className="p-3 w-1/5">
                    <Link key={customer.customer._id} href={'/customers/customerkhatadetail/' + customer.customer._id}>
                      <p className="m-3">{formatDateTimex(customer.lastTransaction.date)}</p></Link></td>
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

