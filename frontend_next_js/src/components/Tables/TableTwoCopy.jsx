"use client";
import { formatDateTime, formatDateTime2 } from "@/apirequests/getcustomersbyshopid";
import Image from "next/image";
import InfiniteScroll from 'react-infinite-scroll-component';
import { handleDeleteTransaction } from "@/apirequests/getcustomersbyshopid";
import { useState } from "react";

const TableTwoCopy = ({ transactions, toast, next, hasMore,fetchmoredata, setCount }) => {
  const [deletingId, setDeletingId] = useState(null)

  const handleDelete = async (tid) => {
    if (deletingId) return
    setDeletingId(tid)
    try {
      await handleDeleteTransaction(tid, toast, next)
      setCount && setCount(Math.random())
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="px-4 py-6 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Entries
        </h4>
      </div>

      <div className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Customer Name</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Date</p>
        </div>
        <div className="col-span-1 hidden items-center sm:flex">
          <p className="font-medium">Entry Type</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Value</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Old Balance</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">New Balance</p>
        </div>
        <div className="col-span-1 mx-auto flex items-center">
          <p className="font-medium">Delete Entry</p>
        </div>
      </div>

      {/* Infinite Scroll */}
      <InfiniteScroll
        dataLength={transactions ? transactions.length : 0} // This is important field to render the next data
        next={fetchmoredata} // This will be the function passed from props to fetch more data
        hasMore={hasMore} // If there is more data to load, it will trigger the next fetch
        loader={
          <div className="flex justify-center items-center w-full h-full">
          <h4 className="text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-white to-yellow-500 animate-gradient">
            Loading...
          </h4>
        </div>
        }
        endMessage={
          <p style={{ textAlign: 'center' }}>
            <b>Yay! You have seen it all</b>
          </p>
        }
      >
        {transactions && transactions.map((transaction, key) => (
          <div
            className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
            key={key}
          >
            <div className="col-span-2 flex items-center">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <p className="text-sm text-black dark:text-white">
                  {transaction.currentCustomer.customerName}
                </p>
              </div>
            </div>
            <div className="col-span-1 flex items-center">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <p className="text-sm text-black dark:text-white">
                  {transaction.date && transaction.date
                    ? formatDateTime2(transaction.date.toString())
                    : formatDateTime(transaction.updatedAt)}
                </p>
              </div>
            </div>
            <div className="col-span-1 hidden items-center sm:flex">
              <p className="text-sm text-black dark:text-white">
                {transaction.transactionType}
              </p>
            </div>
            <div className="col-span-1 flex items-center">
              <p className="text-sm text-black dark:text-white">
                {transaction.amount}
              </p>
            </div>
            <div className="col-span-1 flex items-center">
              <p className={`text-sm ${transaction.oldBalance > 0 ? 'text-green-600' : 'text-red-600'} font-bold`}>
                {transaction.oldBalance}
              </p>
            </div>
            <div className="col-span-1 flex items-center">
              <p className={`text-sm ${transaction.newBalance > 0 ? 'text-green-600' : 'text-red-600'} font-bold`}>
                {transaction.newBalance}
              </p>
            </div>
            <div className="col-span-1 text-center flex items-center">
              <Image
                alt="delete icon"
                className={`mx-auto text-rose-500 cursor-pointer hover:transform hover:animate-bounce hover:scale-125 ${deletingId === transaction._id ? 'opacity-40 pointer-events-none' : ''}`}
                onClick={() => handleDelete(transaction._id)}
                height={30}
                width={30}
                src="/images/icons/delete_icon.svg"
              />
            </div>
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
};

export default TableTwoCopy;
