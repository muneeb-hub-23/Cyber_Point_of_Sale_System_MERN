'use client';
import React from 'react';
import Link from 'next/link'; // Import Link for navigation
import { FaDollarSign, FaShoppingCart, FaUndo, FaChartLine, FaBoxes } from 'react-icons/fa';
import { GiExpense } from "react-icons/gi";
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Menu from '@/components/Menu'
const Page = () => {
  const {user} = useGlobalState()
  if(user && user.permissions.includes("pos")){
  return (
    <Menu>
    <DefaultLayout>

    <div className="min-h-screen bg-gray-900 bg-boxdark flex flex-col items-center justify-center">
      {/* First Row */}
      <div className="flex justify-center space-x-4 animate-fade-in-down">
        <Link href="/pos/sale">
          <p>
            <Box name="Sale" icon={<FaDollarSign />} color="bg-green-500" />
          </p>
        </Link>
        <Link href="/pos/purchase">
          <p>
            <Box name="Purchase" icon={<FaShoppingCart />} color="bg-blue-500" />
          </p>
        </Link>
        <Link href="/pos/refund">
          <p>
            <Box name="Refund" icon={<FaUndo />} color="bg-yellow-500" />
          </p>
        </Link>
      </div>
      {/* Second Row */}
      <div className="flex justify-center space-x-4 mt-6 animate-fade-in-up">
      <Link href="/pos/expense">
          <p>
            <Box name="Expense" icon={<GiExpense />} color="bg-rose-500" />
          </p>
        </Link>
        <Link href="/pos/loss">
          <p>
            <Box name="Loss" icon={<FaChartLine />} color="bg-red-500" />
          </p>
        </Link>
        <Link href="/pos/stockreturn">
          <p>
            <Box name="Stock Return" icon={<FaBoxes />} color="bg-purple-500" />
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
  );
}else{
  return(
    <LoginPage />
  )
}
};

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
