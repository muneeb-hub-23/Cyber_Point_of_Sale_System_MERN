"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useEffect, useState } from "react";
import { fetchShops } from "@/apirequests/getcustomersbyshopid";
import apiaddress from "@/apirequests/apiaddress";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatDateTime } from "@/apirequests/getcustomersbyshopid";
import Link from "next/link";
import Menu from '@/components/Menu'
import LoginPage from "../authentication/login/page";
import { useGlobalState } from "@/js/globaluser";

const Page = () => {
  const token = localStorage.getItem("token")
  const {user} = useGlobalState()
  const [customers, setCustomers] = useState([]); // Initial empty array
  const [shops, setShops] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]); // For filtered data
  const [selectedShop, setSelectedShop] = useState(undefined);
  const [customerType, setCustomerType] = useState("both");

  // Fetch customers by shop and customer type
  const fetchCustomers = async (shop, ctype,token) => {
    let data = await fetch(apiaddress + "/customers/retrievecustomers", {
      method: "GET",
      headers: {
        "shopid": shop,
        "customertype": ctype,
        token
      },
    });
    let parsed = await data.json();
    return parsed;
  };

  // Handle search input
  const handleSearch = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);

    // Filter customers by name or phone
    const filtered = customers.filter(
      (item) =>
        (item.customerName || '').toLowerCase().includes(searchValue) ||
        (item.customerMobileNumber != null ? String(item.customerMobileNumber) : '').includes(searchValue)
    );
    setFilteredCustomers(filtered); // Update filtered results
  };

  // Handle shop selection change
  const handleShopChange = async (e) => {
    const shopId = e.target.value;
    if (shopId !== "") {
      localStorage.setItem('selectedshop', shopId);
      setSelectedShop(shopId);
      const fetchedCustomers = await fetchCustomers(shopId, customerType);
      setCustomers(fetchedCustomers);
      setFilteredCustomers(fetchedCustomers); // Initialize filtered list
    }
  };

  // Handle customer type change
  const handleCustomerTypeChange = async (e) => {
    const ctype = e.target.value;
    setCustomerType(ctype);
    const fetchedCustomers = await fetchCustomers(selectedShop, ctype);
    setCustomers(fetchedCustomers);
    setFilteredCustomers(fetchedCustomers); // Initialize filtered list
  };

  // Fetch shops and initialize selected shop and customers on component mount
  useEffect(() => {
    fetchShops(token).then((data) => {
      setShops(data);
      let defaultShop;
      const savedShopId = localStorage.getItem('selectedshop');
      if (savedShopId) {
        const existingShop = data.find((shop) => shop._id === savedShopId);
        defaultShop = existingShop ? existingShop : data[0];
      } else {
        defaultShop = data[0];
      }

      setSelectedShop(defaultShop._id);
      fetchCustomers(defaultShop._id, customerType).then((fetchedCustomers) => {
        setCustomers(fetchedCustomers);
        setFilteredCustomers(fetchedCustomers); // Initialize filtered list
      });
    });
  }, [customerType]); // Re-fetch data when customerType changes
if(user && user.permissions.includes("customers")){
  return (
    <Menu>
      <DefaultLayout>
        <ToastContainer />
        <div className="mx-auto max-w-270">
          <Breadcrumb pageName="Customers List" />
        </div>
        <div className='min-h-screen'>
          <div className="rounded-sm border mb-5 shadow-lg border-stroke w-full text-center items-center bg-white dark:border-strokedark dark:bg-boxdark">
            <select
              name="linkedShop"
              onChange={handleShopChange}
              value={selectedShop || ""}
              type="text"
              id="selectedshop"
              className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            >
              {shops && shops.map((shop) => (
                <option key={shop._id} value={shop._id}>{shop.shopName}</option>
              ))}
            </select>
          </div>
          <div className="flex w-full space-x-3">
            <div className="rounded-sm border mb-5 shadow-lg border-stroke w-1/2 text-center items-center bg-white dark:border-strokedark dark:bg-boxdark">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search Customer"
                className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              />
            </div>
            <div className="rounded-sm border mb-5 shadow-lg border-stroke w-1/2 text-center items-center bg-white dark:border-strokedark dark:bg-boxdark">
              <select
                name="customertype"
                value={customerType}
                onChange={handleCustomerTypeChange}
                className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              >
                <option value="both">Both</option>
                <option value="customersOnly">Customers Only</option>
                <option value="suppliersOnly">Suppliers Only</option>
              </select>
            </div>
          </div>
          <div className="rounded-sm border border-stroke w-full text-center items-center bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <table className="w-full">
              <thead className="my-3">
                <tr className="shadow-3 my-3 bg-graydark text-white">
                  <td className="p-3 w-1/5">Customer Name</td>
                  <td className="p-3 w-1/5">Customer Mobile Number</td>
                  <td className="p-3 w-2/5">Customer Balance</td>
                  <td className="p-3 w-1/5">Date Created</td>
                </tr>
              </thead>
              <tbody className="my-3">
                {filteredCustomers && filteredCustomers.map((customer) => (
                  <tr key={customer._id} className="shadow-3 py-3 dark:hover:bg-slate-500 hover:bg-blue-200 font-bold cursor-pointer">
                    <td className="w-1/5">
                      <Link href={'/customers/customerkhatadetail/' + customer._id}>
                        <p className="m-3">{customer.customerName}</p>
                      </Link>
                    </td>
                    <td className="p-3 w-1/5">
                      <Link href={'/customers/customerkhatadetail/' + customer._id}>
                        <p className="m-3">{customer.customerMobileNumber}</p>
                      </Link>
                    </td>
                    <td className="p-3 w-1/5 text-green-500">
                      <Link href={'/customers/customerkhatadetail/' + customer._id}>
                        <p className={`m-3 ${customer.balance > 0 ? 'text-green-600' : 'text-rose-600'}`}>{customer.balance}</p>
                      </Link>
                    </td>
                    <td className="p-3 w-1/5">
                      <Link href={'/customers/customerkhatadetail/' + customer._id}>
                        <p className="m-3">{formatDateTime(customer.createdAt)}</p>
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
  );
}else{
  return(
    <LoginPage />
  )
}
};

export default Page;
