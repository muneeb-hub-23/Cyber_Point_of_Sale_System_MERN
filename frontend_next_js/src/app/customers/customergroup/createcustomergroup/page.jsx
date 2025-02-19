"use client";
import { useEffect, useState } from "react";
import { fetchShops } from "@/apirequests/getcustomersbyshopid";
import apiaddress from "@/apirequests/apiaddress";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Menu from '@/components/Menu'
import LoginPage from "../../../authentication/login/page";
import { useGlobalState } from "@/js/globaluser";

const Page = () => {
  const token = localStorage.getItem("token");
  const { user } = useGlobalState();
  const [customers, setCustomers] = useState([]);
  const [shops, setShops] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedShop, setSelectedShop] = useState(undefined);
  const [customerType, setCustomerType] = useState("both");
  const [addedUsers, setAddedUsers] = useState([]);

  // Fetch customers from the API
  const fetchCustomers = async (shop, ctype, token) => {
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

  // Search functionality
  const handleSearch = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);
    const filtered = customers.filter(
      (item) =>
        item.customerName.toLowerCase().includes(searchValue) ||
        item.customerMobileNumber.toString().includes(searchValue)
    );
    setFilteredCustomers(filtered);
  };

  // Handle shop change
  const handleShopChange = async (e) => {
    const shopId = e.target.value;
    if (shopId !== "") {
      localStorage.setItem('selectedshop', shopId);
      setSelectedShop(shopId);
      const fetchedCustomers = await fetchCustomers(shopId, customerType, token);
      setCustomers(fetchedCustomers);
      setFilteredCustomers(fetchedCustomers);
    }
  };

  // Handle customer type change
  const handleCustomerTypeChange = async (e) => {
    const ctype = e.target.value;
    setCustomerType(ctype);
    const fetchedCustomers = await fetchCustomers(selectedShop, ctype, token);
    setCustomers(fetchedCustomers);
    setFilteredCustomers(fetchedCustomers);
  };

  // Add customer to the group
  const addUserToGroup = (user) => {
    // Check if there's already a user from the same shop in the addedUsers array
    const isShopUserAlreadyAdded = addedUsers.some(u => u.linkedShop === user.linkedShop);
    
    // If no user from the current shop is added yet, add the user
    if (!isShopUserAlreadyAdded) {
        setAddedUsers((prevUsers) => [...prevUsers, user]);
    } else {
        // Optionally, you can show a message or toast indicating that only one user per shop is allowed
        toast.error('You can only add one user from the current shop.');
    }
};


  // Remove customer from the group
  const removeUserFromGroup = (userId) => {
    setAddedUsers((prevUsers) => prevUsers.filter(user => user._id !== userId));
  };

  // Submit user group to the server
  const submitUserGroup = async () => {
    try {
      const response = await fetch(apiaddress + "/customers/createcustomergroup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token,
        },
        body: JSON.stringify({ users: addedUsers }),
      });
  
      const data = await response.json();
      
      if (data.success) {
        // Toast success and clear added users
        toast.success("User Group Created Successfully!");
        setAddedUsers([]);  // Clear the added users array only on success
      } else {
        // Toast error but do not clear the added users
        toast.error("Failed to create User Group");
      }
    } catch (error) {
      // Handle any errors that occur during the request
      toast.error("Error occurred while creating User Group");
    }
  };
  

  // Fetch shops and initialize the component
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
      fetchCustomers(defaultShop._id, customerType, token).then((fetchedCustomers) => {
        setCustomers(fetchedCustomers);
        setFilteredCustomers(fetchedCustomers);
      });
    });
  }, [customerType]);

  if (user && user.permissions.includes("createcustomergroup")) {
    return (
      <Menu>
        <ToastContainer />
        <div className="flex min-h-screen bg-boxdark-2 text-white">
          {/* Left Column */}
          <div className="w-1/2 p-5 border-r-2 border-slate-600">
            <div className="mb-5">
              <select
                name="linkedShop"
                onChange={handleShopChange}
                value={selectedShop || ""}
                className="w-full rounded border-2 border-slate-400 p-3 bg-boxdark"
              >
                {shops && shops.map((shop) => (
                  <option key={shop._id} value={shop._id}>{shop.shopName}</option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <select
                name="customertype"
                value={customerType}
                onChange={handleCustomerTypeChange}
                className="w-full rounded border-2 border-slate-400 p-3 bg-boxdark"
              >
                <option value="both">Both</option>
                <option value="customersOnly">Customers Only</option>
                <option value="suppliersOnly">Suppliers Only</option>
              </select>
            </div>

            <div className="mb-5">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search Customer"
                className="w-full rounded border-2 border-slate-400 p-3 bg-boxdark"
              />
            </div>

            <table className="w-full">
              <thead>
                <tr className="bg-gray-200 text-left bg-boxdark">
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Customer Mobile</th>
                  <th className="p-3">Balance</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer._id}>
                    <td className="p-3">{customer.customerName}</td>
                    <td className="p-3">{customer.customerMobileNumber}</td>
                    <td className="p-3">{customer.balance}</td>
                    <td className="p-3">
                      <button
                        onClick={() => addUserToGroup(customer)}
                        className="bg-blue-500 text-white p-1 px-4 rounded"
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right Column */}
          <div className="w-1/2 p-5">
            <h3 className="mb-3 text-xl font-bold">Added Users</h3>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-200 text-left bg-boxdark">
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Customer Mobile</th>
                  <th className="p-3">Balance</th>
                  <th className="p-3">Shop Name</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {addedUsers.map((user, index) => {
                  const shopName = shops?.find(shop => shop._id === user.linkedShop)?.shopName || 'Unknown';
                  return (
                    <tr key={index}>
                      <td className="p-3">{user.customerName}</td>
                      <td className="p-3">{user.customerMobileNumber}</td>
                      <td className="p-3">{user.balance}</td>
                      <td className="p-3">{shopName}</td>
                      <td className="p-3">
                        <button
                          onClick={() => removeUserFromGroup(user._id)}
                          className="bg-red-500 text-white p-1 px-3 rounded bg-rose-600"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button
              onClick={submitUserGroup}
              className="w-full mt-5 bg-green-500 text-white py-3 rounded"
            >
              Create User Group
            </button>
          </div>
        </div>
      </Menu>
    );
  } else {
    return <LoginPage />;
  }
};

export default Page;
