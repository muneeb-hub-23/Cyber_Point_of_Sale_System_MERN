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

const SaleTypesPage = () => {
  const {user} = useGlobalState()
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [newSaleTypeName, setNewSaleTypeName] = useState('');
  const [newSaleTypeDesc, setNewSaleTypeDesc] = useState('');
  const [saleTypes, setSaleTypes] = useState([]);
  const [filteredSaleTypes, setFilteredSaleTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentSaleType, setCurrentSaleType] = useState(null);
  const [deleteSaleTypeName, setDeleteSaleTypeName] = useState('');

  // Fetch shops on component mount
  useEffect(() => {
    fetchShops().then((data) => {
      setShops(data);
    });
  }, []);

  // Fetch sale types based on the selected shop
  const fetchSaleTypes = async (shopId) => {
    const response = await fetch(`${apiaddress}/management/saleTypes/getSaleTypes?shop=${shopId}`);
    const data = await response.json();
    setSaleTypes(data.saleTypes);
    setFilteredSaleTypes(data.saleTypes);
  };

  // Handle shop selection change
  const handleShopChange = (e) => {
    const shopId = e.target.value;
    setSelectedShop(shopId);
    if (shopId) fetchSaleTypes(shopId);
  };

  // Handle creating a new sale type
  const handleCreateSaleType = async () => {
    const response = await fetch(`${apiaddress}/management/saleTypes/addsaletype`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newSaleTypeName, shop: selectedShop, description: newSaleTypeDesc }),
    });

    const result = await response.json();
    if (result.success) {
      toast.success("Sale type created successfully!");
      setNewSaleTypeName('');
      setNewSaleTypeDesc('');
      fetchSaleTypes(selectedShop); // Refresh sale types
    } else {
      toast.error(result.message); // Display error message
    }
  };

  // Handle search input
  const handleSearch = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);
    const filtered = saleTypes.filter((saleType) =>
      saleType.name.toLowerCase().includes(searchValue)
    );
    setFilteredSaleTypes(filtered);
  };

  // Handle sale type modification
  const handleModifySaleType = async () => {
    const response = await fetch(`${apiaddress}/management/saleTypes/modifySaleType/${currentSaleType._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        name: currentSaleType.name, 
        description: currentSaleType.description // Send description for modification
      }),
    });

    const result = await response.json();
    if (result.success) {
      toast.success("Sale type updated successfully!");
      fetchSaleTypes(selectedShop); // Refresh sale types
      setIsEditing(false);
      setCurrentSaleType(null);
    } else {
      toast.error(result.message);
    }
  };

  // Handle delete sale type
  const handleDeleteSaleType = async () => {
    if (deleteSaleTypeName !== 'delete') {
      toast.error("Please type 'delete' to confirm deletion.");
      return;
    }

    const response = await fetch(`${apiaddress}/management/saleTypes/deleteSaleType/${currentSaleType._id}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    if (result.success) {
      toast.success("Sale type deleted successfully!");
      fetchSaleTypes(selectedShop); // Refresh sale types
      setCurrentSaleType(null);
      setDeleteSaleTypeName('');
    } else {
      toast.error(result.message);
    }
  };
if(user && user.permissions.includes("saletypes")){
  return (
    <Menu>
    <DefaultLayout>
      <ToastContainer />
      <div className="mx-auto max-w-270 p-4">
        <h1 className="text-xl font-bold mb-4">Manage Sale Types</h1>
        
        <select
          value={selectedShop}
          onChange={handleShopChange}
          className="w-full mb-4 rounded dark:bg-transparent border-2 border-slate-400 p-3"
        >
          <option value="">Select Shop</option>
          {shops.map((shop) => (
            <option key={shop._id} value={shop._id}>{shop.shopName}</option>
          ))}
        </select>

        <div className="flex mb-4">
          <input
            type="text"
            value={newSaleTypeName}
            onChange={(e) => setNewSaleTypeName(e.target.value)}
            placeholder="New Sale Type Name"
            className="w-full dark:bg-transparent rounded border-2 border-slate-400 p-3"
          />
          <input
            type="text"
            value={newSaleTypeDesc}
            onChange={(e) => setNewSaleTypeDesc(e.target.value)}
            placeholder="New Sale Type Description"
            className="w-full dark:bg-transparent rounded ml-1 border-2 border-slate-400 p-3"
          />
          <button
            onClick={handleCreateSaleType}
            className="ml-2 bg-blue-500 text-white rounded p-3"
          >
            Create
          </button>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search Sale Type"
          className="w-full mb-4 dark:bg-transparent rounded border-2 border-slate-400 p-3"
        />

        <table className="w-full">
          <thead className='my-3'>
            <tr className="shadow-3 my-3 bg-graydark text-white">
              <th className="p-3">Sale Type Name</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSaleTypes.length > 0 && filteredSaleTypes.map((saleType) => (
              <tr key={saleType._id} className="shadow-3 py-3 dark:hover:bg-slate-500 hover:bg-blue-200 dark:bg-indigo-950 bg-white font-bold cursor-pointer">
                <td className="p-3 pl-5">{saleType.name}</td>
                <td className="p-3 flex justify-center">
                  <button
                    onClick={() => {
                      setCurrentSaleType(saleType);
                      setIsEditing(true);
                    }}
                    className="flex items-center bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-300 mx-2"
                  >
                    <FiEdit className="h-5 w-5 mr-2" /> {/* React icon for modify */}
                    Modify
                  </button>

                  <button
                    onClick={() => {
                      setCurrentSaleType(saleType);
                      setDeleteSaleTypeName('');
                      // Open delete confirmation popup
                    }}
                    className="flex items-center bg-rose-600 text-white py-2 px-4 rounded-lg hover:bg-rose-600 transition-colors duration-300 mx-2"
                  >
                    <FiTrash2 className="h-5 w-5 mr-2" /> {/* React icon for delete */}
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Modify Sale Type Modal */}
        {isEditing && currentSaleType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white shadow-md dark:bg-grey-900 rounded p-4">
              <button onClick={() => setIsEditing(false)} className="absolute top-2 right-2 text-gray-600 hover:text-gray-800">X</button>
              <h2 className="font-bold mb-2">Modify Sale Type</h2>
              <input
                type="text"
                value={currentSaleType.name}
                onChange={(e) => setCurrentSaleType({ ...currentSaleType, name: e.target.value })}
                className="w-full border p-2 mb-4"
              />
              <input
                type="text"
                value={currentSaleType.description}
                onChange={(e) => setCurrentSaleType({ ...currentSaleType, description: e.target.value })}
                placeholder="Sale Type Description"
                className="w-full border p-2 mb-4"
              />
              <button onClick={handleModifySaleType} className="bg-blue-500 text-white rounded p-2">Save Changes</button>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {currentSaleType && !isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white shadow-md dark:bg-grey-900 rounded p-4">
              <button onClick={() => setCurrentSaleType(null)} className="absolute top-2 right-2 text-gray-600 hover:text-gray-800">X</button>
              <h2 className="font-bold mb-2">Delete Sale Type</h2>
              <p>Are you sure you want to delete <strong>{currentSaleType.name}</strong>?</p>
              <input
                type="text"
                value={deleteSaleTypeName}
                onChange={(e) => setDeleteSaleTypeName(e.target.value)}
                placeholder="Type 'delete' to confirm"
                className="w-full border p-2 mb-4"
              />
              <button onClick={handleDeleteSaleType} className="bg-rose-500 text-white rounded p-2">Delete</button>
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

export default SaleTypesPage;
