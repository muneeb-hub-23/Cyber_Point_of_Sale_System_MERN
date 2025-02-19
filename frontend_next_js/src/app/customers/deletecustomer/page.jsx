"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useEffect, useState } from "react";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apiaddress from "../../../apirequests/apiaddress";
import { fetchShops } from "@/apirequests/getcustomersbyshopid";
import Menu from '@/components/Menu'
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";

const Page = () => {
  const {user} = useGlobalState()
  const token = localStorage.getItem("token")
  const deleteCustomer = async (customerID) => {
    
    let check = prompt("Type delete If You Want to Delete this customer !")
    if (check === "delete"){
      let data = await fetch(apiaddress + "/customers/deletecustomer", {
        method: "DELETE",
        headers: {
          customerID,
          token
        }
      })
      let parsed = await data.json()
      if (parsed) {
        toast('Customer Deleted', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Bounce,
        });
        await fetchCustomers(document.getElementById("selectedshop").value,token)
  
      } else {
        toast.error('Error Occured While Deleting Customer', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Bounce,
        });
      }
    }else{
      alert("Not Deleted")
    }



  }
  const [shops, setShops] = useState(null)
  const [customers,setCustomers] = useState(null)
  const [selectedShop, setSelectedShop] = useState(undefined)
  const [customerType, setCustomerType] = useState("both");
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]); // For filtered data
  const fetchCustomers = async (shop, ctype) => {
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
  const handleSearch = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);

    // Filter customers by name or phone
    const filtered = customers.filter(
      (item) =>
        item.customerName.toLowerCase().includes(searchValue) ||
        item.customerMobileNumber.toString().includes(searchValue)
    );
    setFilteredCustomers(filtered); // Update filtered results
  };
  // Handle shop selection change
  const handleChange = async (e) => {
    if (e.target.value !== "") {
      setSelectedShop(e.target.value)
      fetchCustomers(e.target.value,customerType).then(cdata => {
        setCustomers(cdata);
        setFilteredCustomers(cdata);
      })
    }
  };
  const handleCustomerTypeChange = async (e) => {
    const ctype = e.target.value;
    setCustomerType(ctype);
    const fetchedCustomers = await fetchCustomers(selectedShop, ctype);
    setCustomers(fetchedCustomers);
    setFilteredCustomers(fetchedCustomers); // Initialize filtered list
  };
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
      fetchCustomers(defaultShop._id,customerType).then(cdata => {
        setCustomers(cdata);
        setFilteredCustomers(cdata);
      })
    });
  }, []);
if(user && user.permissions.includes("deletecustomer")){
  return (
    <Menu>
    <DefaultLayout>
      <ToastContainer />
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Delete Customer" />

      </div>
      <div className='min-h-[100vh]'>
      <div className="rounded-sm border mb-5 shadow-lg border-stroke w-full text-center items-center bg-white dark:border-strokedark dark:bg-boxdark">
              <select name="linkedShop"
                onChange={handleChange}
                value={selectedShop}
                type="text"
                id="selectedshop"
                placeholder="Linked Shop"
                className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              >
                {shops && shops.map((shop) => (
                  <option key={shop._id} value={shop._id}>{shop.shopName}</option>
                ))}
              </select>
            </div>
            <div className="flex space-x-3">
              <div className="rounded-sm border mb-5 shadow-lg border-stroke w-1/2 text-center items-center bg-white dark:border-strokedark dark:bg-boxdark">
                <input name="linkedShop"
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Search Customer"
                  className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                </input>
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
            <tr className="shadow-3 my-3 bg-rose-500 text-white">
              <td className="p-3 w-1/5">Customer Name</td>
              <td className="p-3 w-1/5">Customer Mobile Number</td>
              <td className="p-3 w-1/5">Customer Balance</td>
              <td className="p-3 w-1/5">Delete Button</td>
            </tr>
          </thead>
          <tbody className="my-3">
            {filteredCustomers && filteredCustomers.map((customer)=>(
            <tr key={customer._id} className="shadow-3 py-3">
            <td className="p-3 w-1/5">{customer.customerName}</td>
            <td className="p-3 w-1/5">{customer.customerMobileNumber}</td>
            <td className={`p-3 w-1/5 ${customer.balance>0 ? "text-green-600":"text-rose-600"}`}>{customer.balance}</td>
            <td className="p-3 w-1/5"><span onClick={()=>{deleteCustomer(customer._id)}} className="bg-rose-500 cursor-pointer text-white p-3 w-1/5 px-6 text-lg rounded-md shadow-md my-2" href={'/'}>Delete</span></td>
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

