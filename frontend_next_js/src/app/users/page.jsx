"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import apiaddress from '@/apirequests/apiaddress';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Image from 'next/image';
import Menu from '@/components/Menu'
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";
const UserListPage = () => {
  const {user} = useGlobalState()
  const token = localStorage.getItem("token")
  const [users, setUsers] = useState([]);

  // Fetch users from the API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(apiaddress+'/users/getusers',{
          headers:{
            token
          }
        });
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);
if(user && user.permissions.includes("users")){
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
                src={apiaddress+user.profilepicture}
                alt={user.username}
                className="w-16 h-16 rounded-full mr-4 object-cover"
              />
              <div>
                <h2 className="text-lg font-semibold">{user.username}</h2>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-gray-600">{user.job}</p>
              </div>
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
