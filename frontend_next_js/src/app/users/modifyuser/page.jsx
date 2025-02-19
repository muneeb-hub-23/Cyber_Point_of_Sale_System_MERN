"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiEdit } from 'react-icons/fi'; // Importing the edit icon
import Link from 'next/link'; // Link for navigation
import apiaddress from '@/apirequests/apiaddress';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Image from 'next/image';
import Menu from '@/components/Menu'
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";
const ModifyUserPage = () => {
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
if(user && user.permissions.includes("modifyuser")){
  return (
    <Menu>
    <DefaultLayout>
      <div className="container mx-auto p-4 bg-transparent">
        <div className="grid grid-cols-1 gap-6 bg-transparent">
          {users.length > 0 ? (
            users.map((user) => (
              <Link key={user._id} href={`/users/modifyuser/modifyuserform/${user._id}`}>
                <div className="flex items-center p-4 bg-white dark:bg-boxdark shadow rounded-lg cursor-pointer hover:scale-105 transition-all">
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
                  <FiEdit
                    className="ml-auto text-blue-500 cursor-pointer"
                    size={24}
                  />
                </div>
              </Link>
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

export default ModifyUserPage;
