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

const CategoriesPage = () => {
  const {user} = useGlobalState()
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [deleteCategoryName, setDeleteCategoryName] = useState('');

  // Fetch shops on component mount
  useEffect(() => {
    fetchShops().then((data) => {
      setShops(data);
    });
  }, []);

  // Fetch categories based on the selected shop
  const fetchCategories = async (shopId) => {
    const response = await fetch(`${apiaddress}/management/categories/getcategories?shop=${shopId}`);
    const data = await response.json();
    setCategories(data.categories);
    setFilteredCategories(data.categories);
  };

  // Handle shop selection change
  const handleShopChange = (e) => {
    const shopId = e.target.value;
    setSelectedShop(shopId);
    if (shopId) fetchCategories(shopId);
  };

  // Handle creating a new category
  const handleCreateCategory = async () => {
    const response = await fetch(`${apiaddress}/management/categories/createcategory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newCategoryName, shop: selectedShop, description: newCategoryDesc }),
    });

    const result = await response.json();
    if (result.success) {
      toast.success("Category created successfully!");
      setNewCategoryName('');
      setNewCategoryDesc('');
      fetchCategories(selectedShop); // Refresh categories
    } else {
      toast.error(result.message); // Display error message
    }
  };

  // Handle search input
  const handleSearch = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);
    const filtered = categories.filter((category) =>
      category.name.toLowerCase().includes(searchValue)
    );
    setFilteredCategories(filtered);
  };

  // Handle category modification
  const handleModifyCategory = async () => {
    const response = await fetch(`${apiaddress}/management/categories/modifycategory/${currentCategory._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        name: currentCategory.name, 
        description: currentCategory.description // Send description for modification
      }),
    });

    const result = await response.json();
    if (result.success) {
      toast.success("Category updated successfully!");
      fetchCategories(selectedShop); // Refresh categories
      setIsEditing(false);
      setCurrentCategory(null);
    } else {
      toast.error(result.message);
    }
  };

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (deleteCategoryName !== 'delete') {
      toast.error("Please type 'delete' to confirm deletion.");
      return;
    }

    const response = await fetch(`${apiaddress}/management/categories/deletecategory/${currentCategory._id}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    if (result.success) {
      toast.success("Category deleted successfully!");
      fetchCategories(selectedShop); // Refresh categories
      setCurrentCategory(null);
      setDeleteCategoryName('');
    } else {
      toast.error(result.message);
    }
  };
if(user && user.permissions.includes("categories")){
  return (
    <Menu>
    <DefaultLayout>
      <ToastContainer />
      <div className="mx-auto max-w-270 p-4">
        <h1 className="text-xl font-bold mb-4">Manage Categories</h1>
        
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
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New Category Name"
            className="w-full dark:bg-transparent rounded border-2 border-slate-400 p-3"
          />
          <input
            type="text"
            value={newCategoryDesc}
            onChange={(e) => setNewCategoryDesc(e.target.value)}
            placeholder="New Category Description"
            className="w-full dark:bg-transparent rounded ml-1 border-2 border-slate-400 p-3"
          />
          <button
            onClick={handleCreateCategory}
            className="ml-2 bg-blue-500 text-white rounded p-3"
          >
            Create
          </button>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search Category"
          className="w-full mb-4 dark:bg-transparent rounded border-2 border-slate-400 p-3"
        />

        <table className="w-full">
          <thead className='my-3'>
            <tr className="shadow-3 my-3 bg-graydark text-white">
              <th className="p-3">Category Name</th>
              <th className="p-3">Number of Products</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length > 0 && filteredCategories.map((category) => (
              <tr key={category._id} className="shadow-3 py-3 dark:hover:bg-slate-500 hover:bg-blue-200 dark:bg-indigo-950 bg-white font-bold cursor-pointer">
                <td className="p-3">{category.name}</td>
                <td className="p-3">{category.products}</td>
                <td className="p-3 flex">
                  <button
                    onClick={() => {
                      setCurrentCategory(category);
                      setIsEditing(true);
                    }}
                    className="flex items-center bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-300 mx-2"
                  >
                    <FiEdit className="h-5 w-5 mr-2" /> {/* React icon for modify */}
                    Modify
                  </button>

                  <button
                    onClick={() => {
                      setCurrentCategory(category);
                      setDeleteCategoryName('');
                      // Open delete confirmation popup
                    }}
                    className="flex items-center bg-rose-600 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-300 mx-2"
                  >
                    <FiTrash2 className="h-5 w-5 mr-2" /> {/* React icon for delete */}
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Modify Category Modal */}
        {isEditing && currentCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white shadow-md dark:bg-grey-900 rounded p-4">
            <button onClick={()=>{setIsEditing(false)}} className='bg-rose-600 rounded-md p-1 text-white hover:bg-rose-500'>Close</button>
              <button onClick={() => setIsEditing(false)} className="absolute top-2 right-2 text-gray-600 hover:text-gray-800">X</button>
              <h2 className="font-bold mb-2">Modify Category</h2>
              <input
                type="text"
                value={currentCategory.name}
                onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                className="w-full border p-2 mb-4"
              />
              <input
                type="text"
                value={currentCategory.description}
                onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                placeholder="Category Description"
                className="w-full border p-2 mb-4"
              />
              <button onClick={handleModifyCategory} className="bg-blue-500 text-white rounded p-2">Save Changes</button>
            </div>
          </div>
        )}

        {/* Delete Category Modal */}
        {currentCategory && !isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white shadow-md dark:bg-grey-900 rounded p-4">
            <button onClick={()=>{setCurrentCategory(null)}} className='bg-rose-600 rounded-md p-1 text-white hover:bg-rose-500'>Close</button>
              <button onClick={() => setCurrentCategory(null)} className="absolute top-2 right-2 text-gray-600 hover:text-gray-800">X</button>
              <h2 className="font-bold mb-2">Delete Category</h2>
              <p>Are you sure you want to delete <strong>{currentCategory.name}</strong>{" ? Type 'delete' to confirm."}</p>
              <input
                type="text"
                value={deleteCategoryName}
                onChange={(e) => setDeleteCategoryName(e.target.value)}
                className="border p-2 mb-4"
              />
              <button onClick={handleDeleteCategory} className="bg-rose-600 text-white rounded p-2">Delete</button>
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

export default CategoriesPage;
