'use client';
import React, { useEffect, useMemo, useState } from 'react';
import apiaddress from '@/apirequests/apiaddress';
import { useGlobalState } from '@/js/globaluser';
import { fetchShops } from '@/apirequests/getcustomersbyshopid';
import Time from '../Time'
import Image from 'next/image';
import Menu from '@/components/Menu'
import { MdDeleteForever } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage from "@/app/authentication/login/page";

const Page = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shops, setShops] = useState([])
  const [customer, setCustomer] = useState("")
  const [selectedShop, setSelectedShop] = useState("")
  const { user } = useGlobalState()
  const [amount, setAmount] = useState("")
  const [expenseType, setExpenseType] = useState("")
  const [paymentType, setPaymentType] = useState("Cash")
  const [entries, setEntries] = useState([])
  const [givento, setGivenTo] = useState("")
  const totalexpense = useMemo(() => {
    return entries.reduce((sum, payment) => {
      // Convert amount to a number to ensure accuracy
      return sum + Number(payment.amount || 0);
    }, 0);
  }, [entries]); // Dependencies array


  const addExpense = async (item) => {
    setExpenseType(item)
  }
  function convertDateFormat(dateString) {
    const year = dateString.slice(0, 4);
    const monthIndex = parseInt(dateString.slice(4, 6), 10) - 1;
    const day = dateString.slice(6, 8);

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const month = months[monthIndex];

    return `${day}-${month}-${year}`;
  }
  function convertTo12HourFormat(timestamp) {
    const date = new Date(timestamp);

    let hours = date.getHours();  // Use local time (not UTC)
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    let ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert hours from 24-hour to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // The hour '0' should be 12
    minutes = minutes < 10 ? '0' + minutes : minutes; // Pad minutes to 2 digits
    seconds = seconds < 10 ? '0' + seconds : seconds; // Pad seconds to 2 digits

    // Format time as HH:MM:SS:AM/PM
    return `${hours}:${minutes}:${seconds}:${ampm}`;
  }
  const submitEntry = async () => {

    if (isNaN(Number(amount)) || selectedShop === "" || expenseType === "" || paymentType === "" || amount === "") {
      toast.error("Please fill all fields and then try again!")
      return
    }

    let data = await fetch(apiaddress + '/pos/expense/addexpense', {
      method: "POST",
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        date: selectedDate,
        time: currentTime,
        user: user._id,
        customer,
        shop: selectedShop,
        type: expenseType,
        method: paymentType,
        category: "expense",
        amount,
        givento
      })
    })

    let parsed = await data.json()

    if (parsed.success) {
      toast("Expense Recorded")
      setAmount("")
      setPaymentType("Cash")
      setGivenTo("")
      let ent = await getExpense(selectedShop, selectedDate)
      setEntries(ent)
    } else {
      toast.error("Please Try Again After Reload")
    }

  }
  const getExpense = async (shop, date) => {
    let data = await fetch(apiaddress + '/pos/expense/getexpense', {
      method: "GET",
      headers: {
        shop,
        'datex': date

      }
    })
    let parsed = await data.json()
    return parsed.reverse()
  }
  const handleDeleteEntry = async (eid) => {
    let x = prompt("Type delete to delete this entry")
    if(x !== "delete"){
      return
    }
    let data = await fetch(apiaddress + '/pos/expense/deleteexpense', {
      method: "DELETE",
      headers: { eid }
    })
    let parsed = await data.json()
    if (parsed.success) {
      toast("Entry Deleted")
      if(selectedShop && selectedShop.length>0){
        let ent = await getExpense(selectedShop,selectedDate)
        setEntries(ent)
      }
    } else {
      toast.error("Server Error")
    }
  }

  useEffect(() => {
    let fetchdata = async () => {
      let data = await fetchShops()
      setShops(data)
      let defaultShop;
      let sid = localStorage.getItem('selectedshop')
      if(sid){
        let pshop = data.find(d=>d._id===sid)
        if(pshop){
          defaultShop = pshop
        }else{
          defaultShop = data[0]
        }
      }else{
          defaultShop = data[0]
      }
      setSelectedShop(defaultShop._id)
      let data2 = await getExpense(defaultShop._id, selectedDate)
      setEntries(data2)
    }

    fetchdata()
  }, [selectedDate])

if(user && user.permissions.includes("expense")){
  return (
    <Menu>
      <ToastContainer />
      <div className="min-h-screen bg-gray-900 bg-boxdark flex items-center justify-around w-full">
        <div className='absolute bottom-0 right-0'>
          <Time user={user} selectedDate={selectedDate} setSelectedDate={setSelectedDate} currentTime={currentTime} setCurrentTime={setCurrentTime} />
        </div>
        <div className={`min-h-screen bg-gray-900 bg-boxdark flex flex-col items-center justify-center border-r-2 border-slate-600 w-3/4`}>
          <div className="flex justify-center space-x-4 animate-fade-in-down">
            <p onClick={() => { addExpense("Electricity Bill") }}>
              <Box name="Electricity Bill" image={'/images/icon/meter.png'} />
            </p>

            <p onClick={() => { addExpense("Gass Bill") }}>
              <Box name="Gass Bill" image={'/images/icon/gasmeter.png'} />
            </p>

            <p onClick={() => { addExpense("Rent") }}>
              <Box name="Rent" image={'/images/icon/rent.png'} />
            </p>
          </div>
          <div className="flex justify-center space-x-4 mt-6 animate-fade-in-up">
            <p onClick={() => { addExpense("Food") }}>
              <Box name="Food" image={'/images/icon/food.png'} />
            </p>

            <p onClick={() => { addExpense("Transport") }}>
              <Box name="Transport" image={'/images/icon/transport.png'} />
            </p>

            <p onClick={() => { addExpense("Salary") }}>
              <Box name="Salary" image={'/images/icon/salary.png'} />
            </p>
          </div>
          <div className="flex flex-col text-center h-[35vh] overflow-y-scroll overflow-x-hidden justify-start items-start mt-6 animate-fade-in-up w-full text-white font-bold">
            <div className='flex space-x-3 justify-around items-center w-full transform transition-transform duration-300 hover:scale-110 cursor-pointer bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800'>
              <p className='w-2/12 p-2 text-center'>Date</p>
              <p className='w-2/12 p-2 text-center'>Time</p>
              <p className='w-2/12 p-2 text-center'>User</p>
              <p className='w-2/12 p-2 text-center'>Given To</p>
              <p className='w-1/12 p-2 text-center'>Type</p>
              <p className='w-1/12 p-2 text-center'>Method</p>
              <p className='w-1/12 p-2 text-center'>Amount</p>
              <p className='w-1/12 p-2 text-center'>Delete</p>
            </div>
            {entries && entries.length > 0 && entries.map((entry, key) => (
              <div key={key} className='flex space-x-3 justify-around items-center w-full bg-boxdark border border-slate-600'>
                <p className='w-2/12 p-2 text-center'>{convertDateFormat(entry.date)}</p>
                <p className='w-2/12 p-2 text-center'>{convertTo12HourFormat(entry.updatedAt)}</p>
                <p className='w-2/12 p-2 text-center'>{entry.user.username}</p>
                <p className='w-2/12 p-2 text-center'>{entry.givento && entry.givento}</p>
                <p className='w-1/12 p-2 text-center'>{entry.type}</p>
                <p className='w-1/12 p-2 text-center'>{entry.method}</p>
                <p className='w-1/12 p-2 text-center'>{entry.amount}</p>
                <p className='w-1/12 p-2 text-center text-rose-600 text-3xl hover:cursor-pointer hover:scale-110 px-auto' onClick={() => { handleDeleteEntry(entry._id) }}><MdDeleteForever /></p>
              </div>
            ))}



          </div>
          <div className="flex text-center justify-start items-center mt-1 text-xl space-x-6 animate-fade-in-up w-full text-green-600 pl-8 font-bold">
            <p>Total Expense</p>
            <p>{totalexpense}</p>
          </div>
        </div>
        <div className={`w-1/4 h-screen flex flex-col space-y-3 justify-center items-center border-l-2 border-slate-600 transition-all`}>
          <input
            type="text"
            value={expenseType}
            onChange={(e) => { setExpenseType(e.target.value) }}
            placeholder="Expense Type"
            className="w-10/12 p-2 text-xl text-white bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 border h-12 border-slate-600 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 active:shadow-md"
          />
          <select
            value={selectedShop}
            onChange={async (e) => {
              localStorage.setItem('selectedshop',e.target.value)
              setSelectedShop(e.target.value);
              let data = await getExpense(e.target.value, selectedDate)
              setEntries(data)
            }}
            placeholder="Select Shop"
            className="w-10/12 p-2 text-xl text-white bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 border h-12 border-slate-600 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 active:shadow-md bg-boxdark"
          >
            <option value="">Select Shop</option>
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
            className="w-10/12 p-2 text-xl text-white bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 border h-12 border-slate-600 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 active:shadow-md bg-boxdark"
          >
            <option value="">Select Payment Type</option>
            <option value="Cash">Cash</option>
            <option value="Debit">Debit</option>
            <option value="Easypaisa">Easypaisa</option>
            <option value="Jazzcash">Jazzcash</option>
            <option value="Upaisa">Upaisa</option>
            <option value="Meezan">Meezan</option>

          </select>
          <input
            type="text"
            placeholder="Given To"
            value={givento}
            onChange={(e) => { setGivenTo(e.target.value) }}
            className="w-10/12 p-2 text-xl text-white bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 border h-12 border-slate-600 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 active:shadow-md"
          />
          <input
            type="text"
            placeholder="Amount"
            value={amount}
            onChange={(e) => { setAmount(e.target.value) }}
            className="w-10/12 p-2 text-xl text-white bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 border h-12 border-slate-600 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 active:shadow-md"
          />
          <button
            type="button"
            onClick={submitEntry}
            className="w-10/12 p-2 text-xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 text-white border h-12 border-slate-600 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 active:shadow-md"
          >
            Submit
          </button>
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
      className={`relative group w-40 h-40 rounded-lg shadow-lg flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-110 cursor-pointer bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800`}
    >
      {/* Icon */}
      <div className="text-4xl text-white mb-2 z-10 drop-shadow-lg filter invert brightness-100 contrast-100">
        {icon ? icon : <Image src={image} alt='name' height={80} width={80} />}
      </div>

      {/* Name Text */}
      <div className="text-xl font-semibold text-white z-10 drop-shadow-lg">{name}</div>

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
