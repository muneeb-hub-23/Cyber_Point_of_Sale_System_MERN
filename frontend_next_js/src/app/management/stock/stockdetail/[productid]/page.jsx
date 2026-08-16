'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import apiaddress from '@/apirequests/apiaddress'
import DatePicker from 'react-datepicker';
import { FiCalendar } from 'react-icons/fi'; // Import a calendar icon from react-icons
import 'react-datepicker/dist/react-datepicker.css'; // Import the CSS for the date picker
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";

const Page = () => {
  const {user} = useGlobalState()
  const { productid } = useParams()
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [docType, setDocType] = useState('all')
  const [productData, setProductData] = useState(undefined)
  const [productEntries, setProductEntries] = useState(undefined)
  const [recalibrating, setRecalibrating] = useState(false)
  const beforeAfter = useMemo(() => {
    let data = [];
    let reference = 0;

    if (productEntries && productEntries.length > 0) {
      for (let entry of productEntries) {
        const doctype = entry.document?.doctype
        if (doctype === 'adjuststock') {
          // Use the stored onHandBefore/After directly
          data.push({ before: entry.onHandBefore, after: entry.onHandAfter });
        } else if (doctype === 'purchase' || doctype === 'refund') {
          let temp = reference;
          reference += entry.qty;
          data.push({ before: temp, after: reference });
        } else if (entry.document) {
          let temp = reference;
          reference -= entry.qty;
          data.push({ before: temp, after: reference });
        } else {
          let temp = reference;
          reference += entry.qty;
          data.push({ before: temp, after: reference });
        }
      }
    }

    return data;
  }, [productEntries]);


  const getProductData = async (pid) => {
    let data = await fetch(apiaddress + '/management/products/getproductbyid', {
      method: "GET",
      headers: {
        id: pid
      }
    })
    let parsed = await data.json()
    return parsed
  }
  function formatDate(dateString) {
    const date = new Date(dateString);

    // Options to format the date
    const options = { year: '2-digit', month: 'short', day: '2-digit' };

    // Format the date
    const formattedDate = date.toLocaleDateString('en-GB', options).replace(/(\d{2})-(\w{3})-(\d{2})/, '$1-$2-$3');

    return formattedDate;
  }
  function formatDateString(dateString) {
    // Extract day, month, and year from the string
    const day = dateString.slice(6, 8);
    const month = dateString.slice(4, 6);
    const year = dateString.slice(0, 4);

    // Array of month abbreviations
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Get the abbreviated month name
    const monthName = months[parseInt(month) - 1];

    // Format the final output as "DD-Mon-YY"
    const formattedDate = `${day}-${monthName}-${year.slice(2)}`;

    return formattedDate;
  }
  const getProductEntries = async (pid) => {
    let data = await fetch(apiaddress + '/management/products/getproductentries', {
      method: "GET",
      headers: {
        id: pid
      }
    })
    let parsed = await data.json()
    return parsed
  }

  const recalibrateStock = async () => {
    setRecalibrating(true)
    try {
      const res = await fetch(apiaddress + '/management/products/recalibratestock', {
        method: 'POST',
        headers: { id: productid }
      })
      const result = await res.json()
      if (res.ok) {
        // Refresh both product data and entries after recalibration
        const [updatedProduct, updatedEntries] = await Promise.all([
          getProductData(productid),
          getProductEntries(productid)
        ])
        setProductData(updatedProduct)
        setProductEntries(updatedEntries)
        alert(`Recalibrated successfully. Final On Hand: ${result.finalOnHand} (${result.entriesProcessed} entries processed)`)
      } else {
        alert('Recalibration failed: ' + result.error)
      }
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setRecalibrating(false)
    }
  }

  useEffect(() => {
    getProductData(productid).then(data => setProductData(data))
    getProductEntries(productid).then(data => setProductEntries(data))
  }, [])

  useEffect(() => {
    console.log(productEntries)
  }, [productEntries])

  if(user && user.permissions.includes("stockdetail")){
  return (
    <div className='min-h-screen bg-boxdark text-white'>
      <div className='w-full text-white text-lg border-b-2 border-slate-600 p-2 pl-6 flex space-x-3'>
        <h2><span className='text-blue-600 pr-5'>Product Code: </span>{productData && productData.itemCode}</h2>
        <h2><span className='text-blue-600 pr-5'>Product Name: </span>{productData && productData.name}</h2>
        <h2><span className='text-blue-600 pr-5'>On Hand </span>{productData && productData.onHand}</h2>
        <h2><span className='text-blue-600 pr-5'>Created At </span>{productData && formatDate(productData.createdAt)}</h2>
        <h2><span className='text-blue-600 pr-5'>Cost </span>{productData && productData.cost}</h2>
        <h2><span className='text-blue-600 pr-5'>Cost Total </span>{productData && productData.cost * productData.onHand}</h2>
        <h2><span className='text-blue-600 pr-5'>Sale </span>{productData && productData.sale}</h2>
        <h2><span className='text-blue-600 pr-5'>Sale Total </span>{productData && productData.sale * productData.onHand}</h2>
      </div>
      <div className='w-full flex justify-start items-center space-x-3'>
      <div className='m-2 rounded-md bg-boxdark border-blue-600 border'>
          <select
            value={docType}
            onChange={(e) => { setDocType(e.target.value) }}
            className="form-datepicker text-white w-full rounded border-[1.5px] border-stroke bg-boxdark px-5 py-3 font-normal outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:focus:border-primary"
            name="shop"
            id="shop"
          >
            <option value="all">All</option>
            <option value="sale">Sales</option>
            <option value="purchase">Purchase</option>
            <option value="refund">Refund</option>
            <option value="loss">Loss</option>
            <option value="stockreturn">Stock Return</option>
            <option value="adjuststock">Adjust Stock</option>
          </select>
        </div>
        <div className='p-2 m-2 rounded-md bg-boxdark border-blue-600 border'>
          <div className="flex items-center text-white">
            <FiCalendar className="text-lg mr-2" />
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(new Date(date))} // Update the selected date
              dateFormat="MMMM d, yyyy" // Format for the date display
              className="border-none bg-transparent cursor-pointer text-lg"
            />
          </div>
        </div>
        <div className='p-2 m-2 rounded-md bg-boxdark border-blue-600 border'>
          <div className="flex items-center text-white">
            <FiCalendar className="text-lg mr-2" />
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(new Date(date))} // Update the selected date
              dateFormat="MMMM d, yyyy" // Format for the date display
              className="border-none bg-transparent cursor-pointer text-lg"
            />
          </div>
        </div>

        <div className='p-2 m-2 rounded-md bg-boxdark border-blue-600 border'>
          User
        </div>
        <div className='p-2 m-2 rounded-md bg-boxdark border-blue-600 border'>
          Customer
        </div>
        <button
          onClick={recalibrateStock}
          disabled={recalibrating}
          className='p-2 m-2 rounded-md bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold border border-orange-400 transition-colors'
        >
          {recalibrating ? 'Recalibrating...' : 'Recalibrate Stock'}
        </button>
      </div>
      <div className='w-full'>
        <div className='flex items-center bg-blue-600 text-center text-white'>
          <div className="p-1 w-2/12 text-left pl-3">Date</div>
          <div className="w-1/12 text-left">Doc Type</div>
          <div className="p-1 w-2/12 text-left">Customer | Supplier</div>
          <div className="p-1 w-1/12">OnHand Before</div>
          <div className="p-1 w-1/12">Difference</div>
          <div className="p-1 w-1/12">OnHand After</div>
          <div className="p-1 w-1/12">Cost</div>
          <div className="p-1 w-1/12">Cost Total</div>
          <div className="p-1 w-1/12">Sale</div>
          <div className="p-1 w-1/12">Sale Total</div>
        </div>
        {productEntries && productEntries
          .filter(p => docType === 'all' || (p.document && p.document.doctype === docType))
          .map((p, key) => {
            const doctype = p.document && p.document.doctype
            const isAdjust = doctype === 'adjuststock'
            const isIncrease = isAdjust
              ? p.adjustType === 'increase'
              : (doctype === 'purchase' || doctype === 'refund')

            // Date: adjuststock entries have ISO datetime; doc entries have YYYYMMDD string
            const displayDate = isAdjust
              ? (p.createdAt ? formatDate(p.createdAt) : '')
              : (p.document && p.document.date ? formatDateString(p.document.date) : '')

            const onHandBefore = isAdjust ? p.onHandBefore : p.productData.onHand
            const onHandAfter = isAdjust
              ? p.onHandAfter
              : (isIncrease ? p.productData.onHand + p.qty : p.productData.onHand - p.qty)

            // For adjust entries show reason; for others show customer name
            const customerOrReason = isAdjust
              ? (p.reason || 'Adjust Stock')
              : (p.document && p.document.customer && p.document.customer.customerName || 'No Customer')

            return (
              <div key={key} className={`flex items-center ${key % 2 === 0 ? "bg-boxdark" : "bg-boxdark-2"} my-1 text-center text-white`}>
                <div className="p-1 w-2/12 text-left pl-3">{displayDate}</div>
                <div className="w-1/12 text-left">{doctype || 'purchase'}</div>
                <div className="p-1 w-2/12 text-left">{customerOrReason}</div>
                <div className="p-1 w-1/12">{onHandBefore}</div>
                <div className={`p-1 w-1/12 ${isIncrease ? "text-green-600" : "text-rose-600"}`}>{isIncrease ? '+' : '-'}{p.qty}</div>
                <div className="p-1 w-1/12">{onHandAfter}</div>
                <div className="p-1 w-1/12">{p.costExpense}</div>
                <div className="p-1 w-1/12">{p.costamount}</div>
                <div className="p-1 w-1/12">{p.sale}</div>
                <div className="p-1 w-1/12">{p.saleamount}</div>
              </div>
            )
          })}
      </div>
    </div>
  )
}else{
  return(
    <LoginPage />
  )
}
}

export default Page
