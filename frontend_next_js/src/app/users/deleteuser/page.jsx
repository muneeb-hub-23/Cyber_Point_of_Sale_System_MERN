"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiTrash2 } from 'react-icons/fi'; // Importing the delete icon
import apiaddress from '@/apirequests/apiaddress';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Image from 'next/image';
import Menu from '@/components/Menu'
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";
const UserListPage = () => {
  const {user} = useGlobalState()
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem("token")
  // Fetch users from the API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(apiaddress + '/users/getusers',{
          method:"GET",
          headers:{
            token
          }
        }); // Fetch user data
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Handle user deletion
  const handleDelete = async (userId) => {
    const confirmation = prompt('Type "delete" to confirm user deletion:');
    if (confirmation === 'delete') {
      try {
        await axios.delete(`${apiaddress}/users/deleteuser/${userId}`,{
          headers:{
            token
          }
        });
        setUsers(users.filter((user) => user._id !== userId)); // Update UI after deletion
        alert('User deleted successfully.');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user.');
      }
    } else {
      alert('User not deleted. Please type "delete" correctly.');
    }
  };
if(user && user.permissions.includes("deleteuser")){
  return (
    <Menu>
    <DefaultLayout>
      <div className="container mx-auto p-4 bg-transparent">
        <div className="grid grid-cols-1 gap-6 bg-transparent">
          {users.length > 0 ? (
            users.map((user) => (
              <div key={user._id} className="flex items-center p-4 bg-white dark:bg-boxdark shadow rounded-lg cursor-pointer hover:scale-105 transition-all">
                <Image
                  height={50}
                  width={50}
                  src={apiaddress + user.profilepicture}
                  alt={user.username}
                  className="w-16 h-16 rounded-full mr-4 object-cover"
                />
                <div>
                  <h2 className="text-lg font-semibold">{user.username}</h2>
                  <p className="text-gray-600">{user.email}</p>
                </div>
                <FiTrash2
                  className="ml-auto text-red-500 cursor-pointer"
                  size={24}
                  onClick={() => handleDelete(user._id)}
                />
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No users found.</p>
          )}
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

export default UserListPage;
