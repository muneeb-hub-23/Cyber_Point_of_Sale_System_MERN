"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MainLayout from "@/components/Layouts/DefaultLayout";
import apiaddress from '@/apirequests/apiaddress';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {permissionsList} from "@/apirequests/permissions"
import { fetchShops } from '@/apirequests/getcustomersbyshopid';
import Image from 'next/image';
import Menu from '@/components/Menu'
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";
const ImageUploadPage = () => {
  const {user} = useGlobalState()
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const token = localStorage.getItem("token")
  // User data states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [job, setJob] = useState(''); // New state for job
  const [shops,setShops] = useState([])
  useEffect(()=>{
    fetchShops(token).then(data=>{
      setShops(data)
    })
  },[])
  // Handle image selection through drag-and-drop or file input
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file)); // Create a URL for the image preview
    }
  };

  // Handle drag-and-drop event
  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file)); // Create a URL for the image preview
    }
  };

  // Prevent default drag behaviors
  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Function to handle image upload and user data submission
  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('username', fullName);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('shop', JSON.stringify(selectedShop));
    formData.append('permissions', JSON.stringify(selectedPermissions)); // Send permissions as JSON string
    formData.append('job', job); // Append job to FormData

    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    try {
      setUploading(true);
      const response = await axios.post(apiaddress + '/users/createuser', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          token
        },
      });
      toast.success('User created successfully!');

      // Reset form fields after successful creation
      resetForm();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to create user.');
    } finally {
      setUploading(false);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setSelectedShop('');
    setSelectedPermissions([]);
    setJob(''); // Reset job state
  };

  const handleShopChange = (shop) => {
    setSelectedShop((prev) => 
      prev.includes(shop)
        ? prev.filter((s) => s !== shop) // Remove shop if already selected
        : [...prev, shop] // Add shop if not selected
    );
  };
if(user && user.permissions.includes("createuser")){
  return (
    <Menu>
    <MainLayout>
      <ToastContainer />
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        <h1 className="text-3xl font-bold mb-4">User Registration</h1>
        
        <div className="flex justify-between w-full max-w-4xl mb-6">
          {/* Left Side: User Information */}
          <div className="flex flex-col w-1/2 pr-4">
            <input
              type="text"
              placeholder="Full Name"
              className="mb-4 p-2 border border-gray-300 rounded w-full bg-transparent"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="mb-4 p-2 border border-gray-300 rounded w-full bg-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="mb-4 p-2 border border-gray-300 rounded w-full bg-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Job Title"
              className="mb-4 p-2 border border-gray-300 rounded w-full bg-transparent"
              value={job}
              onChange={(e) => setJob(e.target.value)} // New job input
              required
            />
          </div>

          {/* Right Side: Image Upload */}
          <div className="flex flex-col items-center w-1/2 pl-4">
            <div
              className="border-dashed border-4 border-gray-300 rounded-lg p-8 w-full h-64 flex items-center justify-center mb-4 bg-white shadow-md"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {previewUrl ? (
                <Image height={50} width={50} src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <p className="text-gray-500">Drag & drop an image here, or click to select one</p>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              className="mb-4 border border-gray-300 rounded p-2 bg-transparent"
              onChange={handleImageChange}
            />
          </div>
        </div>

        {/* Shops Selection */}
        <h2 className="text-xl font-semibold mb-2">Allowed Shops</h2>
        <div className="flex flex-wrap mb-4">
        {shops.map((shop, index) => (
        <label key={index} className="flex items-center w-1/5 mb-2">
          <input
            type="checkbox"
            name="shops"
            value={shop} // Use shopName or another unique identifier as value
            className="mr-2"
            checked={selectedShop.includes(shop)}
            onChange={() => handleShopChange(shop)}
          />
          {shop.shopName}
        </label>
      ))}
        </div>

        {/* Permissions Selection */}
        <h2 className="text-xl font-semibold mb-2">Permissions</h2>
        <div className="flex flex-wrap mb-4">
        {permissionsList.map((permission, index) => (
        <label key={index} className="flex items-center w-1/5 mb-2">
          <input
            type="checkbox"
            value={permission.value}
            className="mr-2"
            checked={selectedPermissions.includes(permission.value)}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedPermissions((prev) =>
                prev.includes(value)
                  ? prev.filter((perm) => perm !== value)
                  : [...prev, value]
              );
            }}
          />
          {permission.name}
        </label>
      ))}
        </div>

        <button
          className={`px-6 py-2 font-semibold text-white rounded-lg ${uploading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`} // Fixed the className string
          disabled={uploading}
          onClick={handleUpload}
        >
          {uploading ? 'Uploading...' : 'Create User'}
        </button>
      </div>
    </MainLayout>
    </Menu>
  );
}else{
  return(
    <LoginPage />
  )
}
};

export default ImageUploadPage;
