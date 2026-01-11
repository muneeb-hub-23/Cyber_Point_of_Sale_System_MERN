"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiaddress from "@/apirequests/apiaddress";
import { ToastContainer, toast } from "react-toastify";
import { fetchShops } from "@/apirequests/getcustomersbyshopid";
import Menu from '@/components/Menu'
import LoginPage from "@/app/authentication/login/page";
import { useGlobalState } from "@/js/globaluser";
import { useParams } from "next/navigation";
import 'react-toastify/dist/ReactToastify.css';

const ModifyDeleteCustomerGroupForm = () => {
  const params = useParams();
  const token = localStorage.getItem("token");
  const { user } = useGlobalState();
  const router = useRouter();
  const { id } = params;
  const [customers, setCustomers] = useState([]);
  const [addedUsers, setAddedUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [customerType, setCustomerType] = useState("both");
  const [searchTerm, setSearchTerm] = useState('');
  const [modifiedGroupName, setModifiedGroupName] = useState("");
  const [modifiedGroupMobile, setModifiedGroupMobile] = useState("");

  // Fetch customer group by ID
  const fetchCustomerGroup = async () => {
    try {
      const response = await fetch(`${apiaddress}/customers/getcustomergroupbyid/${id}`, {
        method: "GET",
        headers: {
          token,
        },
      });
      const data = await response.json();
      if (data.success) {
        setModifiedGroupName(data.data.customerName);
        setModifiedGroupMobile(data.data.customerMobileNumber);
        setAddedUsers(data.data.ids.map(c => c.customerID));
      } else {
        toast.error("Failed to fetch customer group");
      }
    } catch (error) {
      toast.error("Error fetching customer group details");
    }
  };

  // Fetch customers for the selected shop and type
  const fetchCustomers = async (shopId, ctype) => {
    try {
      const response = await fetch(apiaddress + "/customers/retrievecustomers", {
        method: "GET",
        headers: {
          "shopid": shopId,
          "customertype": ctype,
          token,
        },
      });
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      toast.error("Error fetching customers");
    }
  };

  // Fetch shops and initialize the component
  useEffect(() => {
    fetchShops(token).then((data) => {
      setShops(data);
      const savedShopId = localStorage.getItem('selectedshop');
      const defaultShop = savedShopId ? data.find(shop => shop._id === savedShopId) : data[0];
      setSelectedShop(defaultShop?._id);
      fetchCustomers(defaultShop?._id, customerType);
    });
    fetchCustomerGroup(); // Fetch the customer group details
  }, [customerType, id]);

  // Handle search functionality
  const handleSearch = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);
    const filtered = customers.filter(
      (item) =>
        item.customerName.toLowerCase().includes(searchValue) ||
        item.customerMobileNumber.toString().includes(searchValue)
    );
    setCustomers(filtered);
  };

  // Add customer to the group
  const addUserToGroup = (customer) => {
    // Avoid adding users from the same shop
    if (!addedUsers.some(user => user.linkedShop === customer.linkedShop)) {
      setAddedUsers(prev => [...prev, customer]);
    } else {
      toast.error("You can only add one user per shop.");
    }
  };

  // Remove customer from the group
  const removeUserFromGroup = (userId) => {
    setAddedUsers(prev => prev.filter(user => user._id !== userId));
  };

  // Submit the modified user group
  const submitModifiedGroup = async () => {
    try {
      // Prepare the updated data for the group
      const groupData = {
        customerName: modifiedGroupName, // Assuming this is the updated group name
        customerMobileNumber: modifiedGroupMobile, // Assuming this is the updated mobile number
        ids: addedUsers.map(user => ({
          customerID: user._id, // Assuming user._id represents the customer ID
          shopID: user.linkedShop, // Assuming user.linkedShop is the shop ID
          balance: user.balance, // Assuming user.balance is the balance
        }))
      };

      // Make the PUT request to update the customer group
      const response = await fetch(`${apiaddress}/customers/updatecustomergroup/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          token,
        },
        body: JSON.stringify(groupData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Customer group updated successfully");
        router.push("/customers/customergroup"); // Redirect after success
      } else {
        toast.error("Failed to update customer group");
      }
    } catch (error) {
      toast.error("Error occurred while updating the group");
    }
  };

  if (user && user.permissions.includes("customers")) {
    return (
      <Menu>
        <ToastContainer />
        <div className="flex min-h-screen bg-boxdark-2 text-white">
          {/* Left Column: Customer Search */}
          <div className="w-1/2 p-5 border-r-2 border-slate-600">
            <div className="mb-5">
              <select
                name="linkedShop"
                onChange={(e) => {fetchCustomers(e.target.value, customerType); setSelectedShop(e.target.value)}}
                value={selectedShop || ""}
                className="w-full rounded border-2 border-slate-400 p-3 bg-boxdark"
              >
                {shops.map(shop => (
                  <option key={shop._id} value={shop._id}>{shop.shopName}</option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <select
                name="customertype"
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
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
                {customers.map(customer => (
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

          {/* Right Column: Current Users in Group */}
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
                {addedUsers && addedUsers.length > 0 && addedUsers.map(user => {
                  const shopName = shops.find(shop => shop._id === user.linkedShop)?.shopName || 'Unknown';
                  return (
                    <tr key={user._id}>
                      <td className="p-3">{user.customerName}</td>
                      <td className="p-3">{user.customerMobileNumber}</td>
                      <td className="p-3">{user.balance}</td>
                      <td className="p-3">{shopName}</td>
                      <td className="p-3">
                        <button
                          onClick={() => removeUserFromGroup(user._id)}
                          className="bg-red-500 text-white p-1 px-3 rounded"
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
              onClick={submitModifiedGroup}
              className="w-full mt-5 bg-green-500 text-white py-3 rounded"
            >
              Update Group
            </button>
          </div>
        </div>
      </Menu>
    );
  } else {
    return <LoginPage />;
  }
};

export default ModifyDeleteCustomerGroupForm;
