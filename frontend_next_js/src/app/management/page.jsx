'use client'
import React from 'react'
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Menu from '@/components/Menu'
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";
import { FaBox, FaWarehouse, FaPlus, FaEdit, FaListAlt, FaCreditCard, FaTags, FaMoneyCheck } from 'react-icons/fa'; // Import necessary icons
import Link from 'next/link';

const Page = () => {
  const {user} = useGlobalState()

  if(user && user.permissions.includes("management")){
  return (
    <Menu>
      <DefaultLayout>
        <div className="min-h-screen bg-gray-900 bg-boxdark flex flex-col items-center justify-center">
          
          {/* First Row */}
          <div className="flex text-center justify-center space-x-4 animate-fade-in-down">
            <Link href="/management/products">
              <p>
                <Box name="Products" icon={<FaBox />} color="bg-green-500" />
              </p>
            </Link>
            <Link href="/management/stock">
              <p>
                <Box name="Stock" icon={<FaWarehouse />} color="bg-blue-500" />
              </p>
            </Link>
            <Link href="/management/addproducts">
              <p>
                <Box name="Add Product" icon={<FaPlus />} color="bg-yellow-500" />
              </p>
            </Link>
            <Link href="/management/modifyproducts">
              <p>
                <Box name="Modify/Delete Products" icon={<FaEdit />} color="bg-orange-500" />
              </p>
            </Link>
          </div>

          {/* Second Row */}
          <div className="flex justify-center text-center space-x-4 mt-6 animate-fade-in-up">
            <Link href="/management/pendingproducts">
              <p>
                <Box name="Pending Products" icon={<FaListAlt />} color="bg-red-500" />
              </p>
            </Link>
            <Link href="/management/paymentmethods">
              <p>
                <Box name="Payment Methods" icon={<FaCreditCard />} color="bg-teal-500" />
              </p>
            </Link>
            <Link href="/management/categories">
              <p>
                <Box name="Categories" icon={<FaTags />} color="bg-purple-500" />
              </p>
            </Link>
            <Link href="/management/saletypes">
              <p>
                <Box name="Sale Types" icon={<FaMoneyCheck />} color="bg-indigo-500" />
              </p>
            </Link>
          </div>


          <style jsx global>{`
            @keyframes fade-in-down {
              0% {
                opacity: 0;
                transform: translateY(-20px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes fade-in-up {
              0% {
                opacity: 0;
                transform: translateY(20px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .animate-fade-in-down {
              animation: fade-in-down 0.8s ease-out;
            }

            .animate-fade-in-up {
              animation: fade-in-up 0.8s ease-out;
            }
          `}</style>
        </div>
      </DefaultLayout>
    </Menu>
  )
}else{
  return(
    <LoginPage />
  )
}
}

const Box = ({ name, icon, color }) => {
  return (
    <div
      className={`relative group w-40 h-40 rounded-lg shadow-lg ${color} flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-110 cursor-pointer`}
    >
      <div className="text-4xl text-white mb-2">{icon}</div>
      <div className="text-xl font-semibold text-white">{name}</div>
      <div
        className="absolute top-0 left-0 w-full h-full bg-white bg-opacity-10 group-hover:bg-opacity-20 rounded-lg pointer-events-none"
      ></div>
    </div>
  );
};

export default Page;
