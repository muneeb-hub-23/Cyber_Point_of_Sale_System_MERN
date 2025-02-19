"use client"; // Ensure this is a client component
import React, { useEffect, useState } from 'react';
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchShops } from "@/apirequests/getcustomersbyshopid"; // Adjust this based on your actual file structure
import apiaddress from "@/apirequests/apiaddress"; // Adjust this based on your actual file structure
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import Menu from '@/components/Menu'
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";

const PaymentMethodsPage = () => {
  const {user} = useGlobalState()
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [newPaymentMethodName, setNewPaymentMethodName] = useState('');
  const [newPaymentMethodDesc, setNewPaymentMethodDesc] = useState('');
  const [newPaymentMethodEnabled, setNewPaymentMethodEnabled] = useState(true); // Default enabled
  const [newPaymentMethodCustomerRequired, setNewPaymentMethodCustomerRequired] = useState(false); // Default not required
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [filteredPaymentMethods, setFilteredPaymentMethods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState(null);
  const [deletePaymentMethodName, setDeletePaymentMethodName] = useState('');

  // Fetch shops on component mount
  useEffect(() => {
    const loadShops = async () => {
      try {
        const data = await fetchShops();
        setShops(data);
      } catch (error) {
        toast.error("Error fetching shops.");
      }
    };
    loadShops();
  }, []);

  // Fetch payment methods based on the selected shop
  const fetchPaymentMethods = async (shopId) => {
    try {
      const response = await fetch(`${apiaddress}/management/paymentmethods/getpaymentmethods/${shopId}`);
      const data = await response.json();
      if (response.ok) {
        setPaymentMethods(data.paymentMethods);
        setFilteredPaymentMethods(data.paymentMethods);
      } else {
        toast.error(data.message || "Error fetching payment methods.");
      }
    } catch (error) {
      toast.error("Network error while fetching payment methods.");
    }
  };

  // Handle shop selection change
  const handleShopChange = (e) => {
    const shopId = e.target.value;
    setSelectedShop(shopId);
    if (shopId) fetchPaymentMethods(shopId);
    setFilteredPaymentMethods([]); // Clear filtered payment methods
  };

  // Handle creating a new payment method
  const handleCreatePaymentMethod = async () => {
    try {
      const response = await fetch(`${apiaddress}/management/paymentmethods/addpaymentmethod`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPaymentMethodName,
          shop: selectedShop,
          description: newPaymentMethodDesc,
          enabled: newPaymentMethodEnabled,
          iscustomerrequired: newPaymentMethodCustomerRequired,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Payment method created successfully!");
        resetForm();
        fetchPaymentMethods(selectedShop); // Refresh payment methods
      } else {
        toast.error(result.message || "Failed to create payment method.");
      }
    } catch (error) {
      toast.error("Network error while creating payment method.");
    }
  };

  // Reset form state
  const resetForm = () => {
    setNewPaymentMethodName('');
    setNewPaymentMethodDesc('');
    setNewPaymentMethodEnabled(true);
    setNewPaymentMethodCustomerRequired(false);
  };

  // Handle search input
  const handleSearch = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);
    const filtered = paymentMethods.filter((method) =>
      method.name.toLowerCase().includes(searchValue)
    );
    setFilteredPaymentMethods(filtered);
  };

  // Handle payment method modification
  const handleModifyPaymentMethod = async () => {
    try {
      const response = await fetch(`${apiaddress}/management/paymentmethods/modifypaymentmethod/${currentPaymentMethod._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPaymentMethodName,
          description: newPaymentMethodDesc,
          enabled: newPaymentMethodEnabled,
          iscustomerrequired: newPaymentMethodCustomerRequired,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Payment method updated successfully!");
        fetchPaymentMethods(selectedShop); // Refresh payment methods
        resetEditingState();
      } else {
        toast.error(result.message || "Failed to update payment method.");
      }
    } catch (error) {
      toast.error("Network error while updating payment method.");
    }
  };

  // Reset editing state
  const resetEditingState = () => {
    setIsEditing(false);
    setCurrentPaymentMethod(null);
    resetForm();
  };

  // Handle delete payment method
  const handleDeletePaymentMethod = async () => {
    if (deletePaymentMethodName !== 'delete') {
      toast.error("Please type 'delete' to confirm deletion.");
      return;
    }

    try {
      const response = await fetch(`${apiaddress}/management/paymentmethods/deletepaymentmethod/${currentPaymentMethod._id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Payment method deleted successfully!");
        fetchPaymentMethods(selectedShop); // Refresh payment methods
        resetDeleteState();
      } else {
        toast.error(result.message || "Failed to delete payment method.");
      }
    } catch (error) {
      toast.error("Network error while deleting payment method.");
    }
  };

  // Reset delete state
  const resetDeleteState = () => {
    setCurrentPaymentMethod(null);
    setIsDeleting(false);
    setDeletePaymentMethodName('');
  };
if(user && user.permissions.includes("paymentmethods")){
  return (
    <Menu>
    <DefaultLayout>
      <ToastContainer />
      <div className="mx-auto max-w-270 p-4">
        <h1 className="text-xl font-bold mb-4">Manage Payment Methods</h1>

        <select
          value={selectedShop}
          onChange={handleShopChange}
          className="w-full mb-4 rounded dark:bg-transparent border-2 border-slate-400 p-3"
        >
          {shops.map((shop) => (
            <option key={shop._id} value={shop._id}>{shop.shopName}</option>
          ))}
        </select>

        <div className="flex mb-4">
          <input
            type="text"
            value={newPaymentMethodName}
            onChange={(e) => setNewPaymentMethodName(e.target.value)}
            placeholder="New Payment Method Name"
            className="dark:bg-transparent w-1/2 rounded border-2 border-slate-400 p-3"
          />
          <input
            type="text"
            value={newPaymentMethodDesc}
            onChange={(e) => setNewPaymentMethodDesc(e.target.value)}
            placeholder="New Payment Method Description"
            className="w-1/2 dark:bg-transparent rounded ml-1 border-2 border-slate-400 p-3"
          />
          <div className="flex items-center ml-2">
            <label className="mr-2">Is Enabled</label>
            <input
              type="checkbox"
              checked={newPaymentMethodEnabled}
              onChange={() => setNewPaymentMethodEnabled((prev) => !prev)}
              className="form-checkbox"
            />
          </div>
          <div className="flex items-center ml-2">
            <label className="mr-2">Is Customer Required</label>
            <input
              type="checkbox"
              checked={newPaymentMethodCustomerRequired}
              onChange={() => setNewPaymentMethodCustomerRequired((prev) => !prev)}
              className="form-checkbox"
            />
          </div>
          <button
            onClick={handleCreatePaymentMethod}
            className="ml-2 bg-blue-500 text-white rounded p-3"
          >
            Create
          </button>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search Payment Method"
          className="w-full mb-4 dark:bg-transparent rounded border-2 border-slate-400 p-3"
        />

        <table className="w-full">
          <thead className='my-3'>
            <tr className="shadow-3 my-3 bg-graydark text-white">
              <th>Name</th>
              <th>Description</th>
              <th>Enabled</th>
              <th>Customer Required</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPaymentMethods.map((method) => (
              <tr key={method._id} className="hover:bg-gray-100 bg-white text-black text-center">
                <td>{method.name}</td>
                <td>{method.description}</td>
                <td>{method.enabled ? "Yes" : "No"}</td>
                <td>{method.iscustomerrequired ? "Yes" : "No"}</td>
                <td className="flex space-x-2">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setCurrentPaymentMethod(method);
                      setNewPaymentMethodName(method.name);
                      setNewPaymentMethodDesc(method.description);
                      setNewPaymentMethodEnabled(method.enabled);
                      setNewPaymentMethodCustomerRequired(method.iscustomerrequired);
                    }}
                    className="text-green-500"
                  >
                    <FiEdit />
                  </button>
                  <button
                    onClick={() => {
                      setIsDeleting(true);
                      setCurrentPaymentMethod(method);
                    }}
                    className="text-red-500"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isEditing && currentPaymentMethod && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded p-4 shadow-lg">
              <h2 className="text-lg font-bold">Editing: {currentPaymentMethod.name}</h2>
              <div className="flex flex-col mt-2">
                <input
                  type="text"
                  value={newPaymentMethodName}
                  onChange={(e) => setNewPaymentMethodName(e.target.value)}
                  placeholder="Payment Method Name"
                  className="border rounded p-2"
                />
                <input
                  type="text"
                  value={newPaymentMethodDesc}
                  onChange={(e) => setNewPaymentMethodDesc(e.target.value)}
                  placeholder="Payment Method Description"
                  className="border rounded p-2 mt-2"
                />
                <div className="flex items-center mt-2">
                  <label className="mr-2">Is Enabled</label>
                  <input
                    type="checkbox"
                    checked={newPaymentMethodEnabled}
                    onChange={() => setNewPaymentMethodEnabled((prev) => !prev)}
                    className="form-checkbox"
                  />
                </div>
                <div className="flex items-center mt-2">
                  <label className="mr-2">Is Customer Required</label>
                  <input
                    type="checkbox"
                    checked={newPaymentMethodCustomerRequired}
                    onChange={() => setNewPaymentMethodCustomerRequired((prev) => !prev)}
                    className="form-checkbox"
                  />
                </div>
              </div>
              <div className="flex mt-4">
                <button onClick={handleModifyPaymentMethod} className="bg-yellow-500 text-white rounded p-2">Save Changes</button>
                <button onClick={resetEditingState} className="bg-gray-500 text-white rounded p-2 ml-2">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {isDeleting && currentPaymentMethod && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded p-4 shadow-lg">
              <button className='text-rose-500' onClick={()=>{setIsDeleting(false)}}>Close</button>
              <h2 className="text-lg font-bold">Confirm Deletion of: {currentPaymentMethod.name}</h2>
              <input
                type="text"
                value={deletePaymentMethodName}
                onChange={(e) => setDeletePaymentMethodName(e.target.value)}
                placeholder="Type 'delete' to confirm"
                className="border-2 border-red-500 p-2 mt-2"
              />
              <div className="flex mt-4">
                <button onClick={handleDeletePaymentMethod} className="bg-rose-500 text-white rounded p-2">Delete</button>
                <button onClick={resetDeleteState} className="bg-gray-500 text-white rounded p-2 ml-2">Cancel</button>
              </div>
            </div>
          </div>
        )}
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

export default PaymentMethodsPage;
