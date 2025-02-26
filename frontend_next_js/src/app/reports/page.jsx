'use client';
import React, { useState,useRef } from 'react';
import DatePicker from 'react-datepicker';
import { FiCalendar } from 'react-icons/fi';
import 'react-datepicker/dist/react-datepicker.css';
import Image from 'next/image';
import Menu from '@/components/Menu'
import { GrDocumentPerformance } from "react-icons/gr";
import {getReport} from './reportData'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";

const Page = () => {
  const iframeRef = useRef(null);
  const { user } = useGlobalState();
  const [startdate, setstartdate] = useState(new Date());
  const [enddate, setenddate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState("")
  const [paymentType, setPaymentType] = useState("")
  const [showingReport, setShowingReport] = useState(false)
  const [iframeSrc, setIframeSrc] = useState("");
  const [hidebtn, sethidebtn] = useState(false)
  const token = localStorage.getItem("token")


if(user && user.permissions.includes("reports")){
  return (
    <Menu>
      <ToastContainer />
      {showingReport &&
        <div className="absolute top-0 left-0 w-full h-screen z-999999 print-visible">
          {!hidebtn &&
            <>
              <button
                onClick={() => { setShowingReport(false) }}
                className='p-2 m-1 rounded-md bg-rose-600 absolute right-7 top-3 text-white font-bold px-3 no-print'>
                Close
              </button>
            </>
          }
          {iframeSrc && (
            <iframe
              src={iframeSrc}
              ref={iframeRef}
              title="Report Preview"
              className='w-full h-screen'
            />
          )}
        </div>
      }
      <div className="min-h-screen bg-gray-900 bg-boxdark flex items-center justify-around w-full">

        <div className={`min-h-screen bg-gray-900 bg-boxdark p-3 border-r-2 border-slate-600 w-3/4`}>
        <div className="flex justify-start space-x-4 animate-fade-in-down">

            <div onClick={async () => { getReport("detailed", "daily",startdate,enddate,setIframeSrc,setShowingReport,token) }}>
              <Box name="Detailed Report" icon={<GrDocumentPerformance />} />
            </div>

          </div>
          <hr className='my-2' />
          {/* <h3 className='text-lg text-white p-1 pl-3 m-0'>Sales</h3>
          <hr className='my-2' />
          <div className="flex justify-start space-x-4 animate-fade-in-down">
            <div onClick={async () => { getReport("sales", "daily",startdate,enddate,setIframeSrc,setShowingReport,token) }}>
              <Box name="Daily Report" icon={<GrDocumentPerformance />} />
            </div>
            <div>
              <Box name="Monthly Report" icon={<GrDocumentPerformance />} />
            </div>

          </div>
          <hr className='my-2' />
          <h3 className='text-lg text-white p-1 pl-3 m-0'>Purchase</h3>
          <hr className='my-2' /> */}


        </div>
        <div className={`w-1/4 h-screen flex flex-col space-y-3 justify-center items-center border-l-2 border-slate-600 transition-all`}>
          <div className="flex items-center z-999 mb-2 w-10/12 p-2 text-xl text-white bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 border h-12 border-slate-600 rounded-lg shadow-lg transform transition-all duration-200 hover:shadow-xl active:shadow-md">
            <FiCalendar className="text-2xl mr-2" />
            <DatePicker
              selected={startdate}
              onChange={(date) => setstartdate(date)} // Update the selected date
              dateFormat="MMMM d, yyyy" // Format for the date display
              className="border-none bg-transparent cursor-pointer text-lg"
            />
          </div>
          <div className="flex items-center z-99 mb-2 w-10/12 p-2 text-xl text-white bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 border h-12 border-slate-600 rounded-lg shadow-lg transform transition-all duration-200 hover:shadow-xl active:shadow-md">
            <FiCalendar className="text-2xl mr-2" />
            <DatePicker
              selected={enddate}
              onChange={(date) => setenddate(date)} // Update the selected date
              dateFormat="MMMM d, yyyy" // Format for the date display
              className="border-none bg-transparent cursor-pointer text-lg"
            />
          </div>

          <select
            value={selectedShop}
            onChange={async (e) => {
              setSelectedShop(e.target.value);
            }}
            placeholder="Select Shop"
            className="w-10/12 p-2 text-xl text-white bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 border h-12 border-slate-600 rounded-lg shadow-lg transform transition-all duration-200 hover:shadow-xl active:shadow-md bg-boxdark"
          >
            <option value="">All Shops</option>
            {shops && shops.length > 0 && shops.map((s, key) => (
              <option key={key} value={s._id}>{s.shopName}</option>
            ))}
          </select>
          <select
            value={paymentType}
            onChange={async (e) => {
              setPaymentType(e.target.value);

            }}
            placeholder="Select Shop"
            className="w-10/12 p-2 text-xl text-white bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 border h-12 border-slate-600 rounded-lg shadow-lg transform transition-all duration-200 hover:shadow-xl active:shadow-md bg-boxdark"
          >
            <option value="">All Payment Types</option>
            <option value="Cash">Cash</option>
            <option value="Debit">Debit</option>
            <option value="Easypaisa">Easypaisa</option>
            <option value="Jazzcash">Jazzcash</option>
            <option value="Upaisa">Upaisa</option>
            <option value="Meezan">Meezan</option>
          </select>
        </div>
      </div>
    </Menu>
  );
}else{
  return(
    <LoginPage />
  )
}
};

const Box = ({ name, icon, image }) => {
  return (
    <div
      className={`relative group px-2 h-20 rounded-lg shadow-lg flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-110 cursor-pointer bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800`}
    >
      {/* Icon */}
      <div className="text-4xl text-white mb-2 z-10 drop-shadow-lg">
        {icon ? icon : <Image src={image} alt='name' height={40} width={40} />}
      </div>

      {/* Name Text */}
      <div className="text-sm font-semibold text-white z-10 drop-shadow-lg">{name}</div>

      {/* Shine effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-white bg-opacity-10 group-hover:bg-opacity-20 rounded-lg pointer-events-none"></div>

      {/* Glowing and 3D shadow for the box */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-900 rounded-lg shadow-xl transform transition-all duration-300 group-hover:shadow-[0_4px_30px_rgba(0,123,255,0.6)] z-0"></div>

      {/* Glowing border and shine effect */}
      <div className="absolute inset-0 rounded-lg border-4 border-transparent bg-gradient-to-br from-blue-700 to-blue-800 bg-opacity-20 group-hover:bg-opacity-30 z-0"></div>
    </div>
  );
};




export default Page;
