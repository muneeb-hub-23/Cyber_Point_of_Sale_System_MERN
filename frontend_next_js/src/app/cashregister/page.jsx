'use client'
import React, { useState, useEffect } from 'react'
import { useGlobalState } from '@/js/globaluser'
import { fetchShops } from '@/apirequests/getcustomersbyshopid'
import DefaultLayout from '@/components/Layouts/DefaultLayout'
import DatePickerOne from '@/components/FormElements/DatePicker/DatePickerOne'
import apiaddress from '@/apirequests/apiaddress'
import Menu from '@/components/Menu'
import LoginPage from '../authentication/login/page'

const formatDate = (currentDate) => {
  const formattedDate = `${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}`;
  return formattedDate;
};

const reverseDate = (inputDate) => {
  const year = inputDate.slice(0, 4);
  const month = inputDate.slice(4, 6);
  const day = inputDate.slice(6, 8);

  const date = new Date(`${year}-${month}-${day}`);
  const monthName = date.toLocaleString('default', { month: 'long' });

  return `${day}-${monthName}-${year}`;
}

const Page = () => {
  const token = localStorage.getItem("token")
  const { user } = useGlobalState();
  const [shops, setShops] = useState(null);
  const [date, setDate] = useState(formatDate(new Date()));
  const [selectedShop, setSelectedShop] = useState();
  const [entries, setEntries] = useState(undefined);
  const [totals, setTotals] = useState({
    methodTotals: {},
    totalCashIn: 0,
    totalCashOut: 0,
    netTotal: 0
  });

  const fetchEntries = async (shopid, date) => {
    
    let data = await fetch(apiaddress + '/cashregister/getentries', {
      method: "POST",
      headers: {
        'content-type': 'application/json',
        token
      },
      body: JSON.stringify({ shopid, date })
    });
    let response = await data.json();
    return response;
  };

  const dateChange = (e) => {
    setDate(e);
  };

  const handleChange = (e) => {
    setSelectedShop(e.target.value);
  };

  const getColorForEntry = (method, type, customer) => {
    const methodLower = method.toLowerCase();
    const typeLower = type.toLowerCase();

    if (!customer) {
      return 'text-rose-600';  // Red for entries with no customer
    } else if (methodLower === 'debit') {
      return 'text-blue-600';  // Blue for debit method
    } else if (['sale', 'stockreturn', 'wasool'].includes(typeLower)) {
      return 'text-green-600';  // Green for sale, stockreturn, wasool types if not debit
    } else {
      return 'text-rose-600';  // Default to red for other cases
    }
  };

  const calculateTotals = (entries) => {
    let methodTotals = {};

    entries.forEach((entry) => {
      const method = entry.method.toLowerCase();
      const amount = parseFloat(entry.amount);
      const type = entry.type.toLowerCase();

      if (!methodTotals[method]) {
        methodTotals[method] = { cashIn: 0, cashOut: 0 };
      }

      if (['sale', 'stockreturn', 'wasool'].includes(type)) {
        methodTotals[method].cashIn += amount;
      } else {
        methodTotals[method].cashOut += amount;
      }
    });

    let totalCashIn = 0;
    let totalCashOut = 0;

    Object.keys(methodTotals).forEach(method => {
      totalCashIn += methodTotals[method].cashIn;
      totalCashOut += methodTotals[method].cashOut;
    });

    return {
      methodTotals,
      totalCashIn,
      totalCashOut,
      netTotal: totalCashIn - totalCashOut
    };
  };

  useEffect(() => {
    if (selectedShop) {
      fetchEntries(selectedShop, date,token).then(data => {
        setEntries(data);
        setTotals(calculateTotals(data));
      });
    }
  }, [selectedShop, date]);

  useEffect(() => {
    fetchShops(token).then((data) => {
      setShops(data);
      if (data[0]) {
        setSelectedShop(data[0]._id); // Set default shop and trigger entry fetch
      }
    });
  }, []);

  if(user && user.permissions.includes("cashregister")){
  return (
    <Menu>
    <DefaultLayout>
      <div className='w-full min-h-screen p-3 bg-boxdark'>
        <div className='rounded-sm border mb-5 shadow-lg border-stroke w-full text-center bg-white dark:border-strokedark dark:bg-boxdark'>
          <select
            name="linkedShop"
            onChange={handleChange}
            value={selectedShop}
            className="w-full rounded border-2 border-slate-400 px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white bg-transparent"
          >
            {shops && shops.map((shop) => (
              <option key={shop._id} value={shop._id}>{shop.shopName}</option>
            ))}
          </select>
        </div>
        <div className='rounded-sm border mb-5 shadow-lg border-stroke w-full text-center bg-white dark:border-strokedark dark:bg-boxdark'>
        <DatePickerOne warningDate={date} setWarningDate={dateChange} />
        </div>

        <div className='rounded-sm border p-3 mt-5 mb-5 shadow-lg border-stroke w-full text-center bg-white dark:border-strokedark dark:bg-boxdark'>
          <div className="flex space-x-3 justify-center items-center text-center text-white font-bold text-lg bg-blue-600 mt-5">
            <p className='w-1/12'>Sr No</p>
            <p className='w-2/12'>Date</p>
            <p className='w-3/12'>Customer</p>
            <p className='w-2/12'>User</p>
            <p className='w-1/12'>Entry Type</p>
            <p className='w-1/12'>Method</p>
            <p className='w-1/12'>Amount</p>
          </div>
          {entries && entries.map((e, key) => {
            const method = e.method;
            const type = e.type;
            const textColor = getColorForEntry(method, type, e.customer);

            return (
              <div key={key} className={`flex space-x-3 p-2 text-md shadow-md justify-center items-center text-center dark:text-white ${key % 2 === 0 ? 'bg-boxdark' : 'bg-slate-700'} mt-5`}>
                <p className='w-1/12'>{key + 1}</p>
                <p className='w-2/12'>{reverseDate(e.date)}</p>
                <p className='w-3/12'>{e.customer ? e.customer.customerName : 'No Name'}</p>
                <p className='w-2/12'>{e.user.username}</p>
                <p className='w-1/12'>{e.type}</p>
                <p className={`w-1/12 ${textColor}`}>{e.method}</p>
                <p className={`w-1/12 ${textColor}`}>{e.amount}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-sm border p-3 mt-5 mb-5 shadow-lg border-stroke w-full text-center bg-white dark:border-strokedark dark:bg-boxdark">
          <div className="flex justify-between text-white font-bold text-lg bg-blue-600 mt-5">
            <p className="w-3/12">Method</p>
            <p className="w-2/12">Cash In</p>
            <p className="w-2/12">Cash Out</p>
            <p className="w-2/12">Net Total</p>
          </div>
          {totals.methodTotals && Object.keys(totals.methodTotals).map((method, idx) => {
            const { cashIn, cashOut } = totals.methodTotals[method];
            return (
              <div key={idx} className="flex justify-between text-center text-white mt-3">
                <p className="w-3/12">{method}</p>
                <p className="w-2/12 text-green-600 font-bold">{cashIn.toFixed(2)}</p>
                <p className="w-2/12 text-red-600 font-bold">{cashOut.toFixed(2)}</p>
                <p className="w-2/12 text-blue-600 font-bold">{(cashIn - cashOut).toFixed(2)}</p>
              </div>
            );
          })}
          <div className="flex justify-between text-center text-white font-bold mt-5 bg-blue-700">
            <p className="w-3/12">Total</p>
            <p className="w-2/12 text-green-600">{totals.totalCashIn.toFixed(2)}</p>
            <p className="w-2/12 text-red-600">{totals.totalCashOut.toFixed(2)}</p>
            <p className="w-2/12 text-blue-600">{totals.netTotal.toFixed(2)}</p>
          </div>
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

export default Page;
