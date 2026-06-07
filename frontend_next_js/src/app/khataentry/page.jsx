"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import TableTwoCopy from '../../components/Tables/TableTwoCopy'
import { useEffect, useState } from "react";
import { fetchCustomers, fetchShops, fetchTransactions, toastParser } from "../../apirequests/getcustomersbyshopid"
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SwitcherThree from "@/components/Switchers/SwitcherThree";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import apiaddress from "@/apirequests/apiaddress";
import Searchoption from './Searchoption'
import { useGlobalState } from "@/js/globaluser";
import Menu from '@/components/Menu'
import LoginPage from "@/app/authentication/login/page";
import Switcherx from '@/components/Switchers/Switcherx';

const KhataEntry = () => {
  const [clearCustomer, setClearCustomer] = useState(true)
  const [transactionCollectedFrom, setTransactionCollectedFrom] = useState("counter")
  const [trnscollected, settrnscollected] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const { user } = useGlobalState()
  const token = localStorage.getItem("token")
  const [enabled, setEnabled] = useState(false);
  const [warningDate, setWarningDate] = useState(new Date().toISOString().slice(0, 10).replace(/-/g, ''))
  const [workingDate, setWorkingDate] = useState(new Date().toISOString().slice(0, 10).replace(/-/g, ''))
  const [shops, setShops] = useState([])
  const [customers, setCustomers] = useState([])
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('')
  const [selectedShop, setSelectedShop] = useState(undefined)
  const [transactionType, setTransactionType] = useState('')
  const [pagex, setPagex] = useState(1);
  const [currentCustomer, setCurrentCustomer] = useState({
    customerName: "",
    customerMobileNumber: "",
    balance: 0
  })
  const [transactions, setTransactions] = useState(null)
  const next = async () => {
    let trns = await fetchTransactions(document.getElementById("shopID").value, token)
    setTransactions(trns)
    let cust = await fetchCustomers(document.getElementById("shopID").value, token)
    setCustomers(cust)
  }

  const handlechangex = (e) => {
    if (e === "false") {
      setTransactionCollectedFrom("counter");
    } else {
      setTransactionCollectedFrom("salesman");
    }
  };
  

  const shopChange = async (e) => {
    setSelectedShop(e.target.value)
    let trns = await fetchTransactions(e.target.value, token)
    setTransactions(trns)
    let data = await fetchCustomers(e.target.value, token)
    setCustomers(data)

    if (e.target.value !== selectedShop) {
      setCurrentCustomer({
        customerName: "",
        customerMobileNumber: "",
        balance: 0
      })
    } else if (clearCustomer) {
      setCurrentCustomer({
        customerName: "",
        customerMobileNumber: "",
        balance: 0
      })
    } else {
      setCurrentCustomer(data.find(customer => customer._id === currentCustomer._id))
    }


  }


  const userChange = async (e) => {
    const current = customers.find(customer => customer._id === e.target.value);
    setCurrentCustomer(current)
  }

  const doTransaction = async () => {
    if (isSaving) return

    let trnsType = ""
    switch (transactionType) {
      case "wasool":     trnsType = "minus"; break;
      case "sale":       trnsType = "plus";  break;
      case "paidmoney": trnsType = "plus";  break;
      case "purchase":  trnsType = "minus"; break;
      case "refund":    trnsType = "minus"; break;
      case "loss":      trnsType = "plus";  break;
      case "stockreturn": trnsType = "plus"; break;
    }

    if (trnsType !== "" && amount > 0 && currentCustomer && currentCustomer._id && method !== "") {
      let postData = { currentCustomer, transactionType, amount, trnsType, date: workingDate, method, user: user._id, transactionCollectedFrom }
      if (enabled) {
        postData.warning = { date: parseInt(warningDate), resolved: false, relation: transactionType, user: user._id }
      }
      setIsSaving(true)
      try {
        let data = await fetch(apiaddress + "/khata/khataentry", {
          method: "POST",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify(postData)
        })
        let parsed = await data.json()
        if (parsed.success) {
          toast('Transaction Successfull', { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", transition: Bounce });
          setAmount('')
          await shopChange({ target: { value: document.getElementById("shopID").value } })
          let newTrns = await fetchTransactions(document.getElementById("shopID").value, token)
          setTransactions(newTrns)
        } else {
          toast.error(parsed.error || 'Check Values', { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "dark", transition: Bounce });
        }
      } catch (err) {
        toast.error('Network error — please try again', { position: "top-right", autoClose: 5000, theme: "dark", transition: Bounce });
      } finally {
        setIsSaving(false)
      }
    } else {
      toast.error('Check Values', { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "dark", transition: Bounce });
    }
  }

  const fetchmoredata = async () => {
    setPagex(pagex + 1)
    let data = await fetchTransactions(selectedShop, pagex + 1, 10, token)
    data.length === 0 && setHasMore(false)
    setTransactions([...transactions, ...data])
  }

  useEffect(() => {
    fetchShops(token).then(data => {
      setShops(data)
      setSelectedShop(data[0]._id)
      fetchTransactions(data[0]._id, token).then(data => {
        setTransactions(data)
      })
      fetchCustomers(data[0]._id, token).then(data => {
        setCustomers(data)
      })
    })
  }, [])

  if (user && user.permissions.includes("khataentry")) {
    return (
      <Menu>
        <DefaultLayout>

          <div>
            <ToastContainer />
            <div className="mx-auto max-w-270">
              <Breadcrumb pageName="Khata Entry" />
            </div>
            <div className="flex space-x-3">
              <select
                onChange={shopChange}
                name="shopID"
                id="shopID"
                className="text-xl bg-transparent inline-flex items-center justify-center rounded-md border border-primary px-10 py-4 text-center font-medium text-primary lg:px-8 xl:px-10 w-8/12">
                {shops && shops.map((shop) => (
                  <option key={shop._id} value={shop._id}>{shop.shopName}</option>
                ))}
              </select>
              <div className="flex border border-primary rounded-sm w-4/12 space-x-3 items-center px-3">
                <p className="text-white text-md">Clear Customer After Submit</p>
                <Switcherx
                  onChangex={()=>{return}}
                  enabled={clearCustomer}
                  setEnabled={setClearCustomer}
                  id="clearcustomeraftersubmit"
                />
              </div>
              <div className="flex border border-primary rounded-sm w-4/12 space-x-3 items-center px-3">
                <p className="text-white text-md">Collected From</p>
                <Switcherx
                  onChangex={handlechangex}
                  enabled={trnscollected}
                  setEnabled={settrnscollected}
                  id="collectedfrom"
                />
                <p className="text-white text-md">{transactionCollectedFrom}</p>
              </div>
            </div>
            <h2 className="text-xl mx-3 mt-3">Add New Entry</h2>
            <div className="entryform my-5">

              <div className="inline-block w-full md:w-1/2 xl:w-1/2 px-3 mb-3">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Search By Name / Phone
                </label>
                <Searchoption currentCustomer={currentCustomer} data={customers} setCurrentCustomer={setCurrentCustomer} />
              </div>

              <div className="inline-block w-full md:w-1/2 xl:w-1/2 px-3 mb-3">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Select Working Date
                </label>
                <DatePickerOne warningDate={workingDate} setWarningDate={setWorkingDate} />
              </div>

              <div className="inline-block w-full md:w-1/2 xl:w-1/2 px-3 mb-3">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Customer Name
                </label>
                <select
                  required
                  name="customerName"
                  type="text"
                  className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  autoFocus
                  value={currentCustomer.customerName}
                  onChange={userChange}
                >
                  <option className="hidden" value={currentCustomer._id}>{currentCustomer.customerName}</option>
                  {customers && customers.map((customer) => (
                    <option className="flex space-x-3 items-center" key={customer._id} value={customer._id}>{customer.customerName}</option>
                  ))}
                </select>
              </div>

              <div className="inline-block w-full md:w-1/2 xl:w-1/2 px-3 mb-3">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Customer Mobile Number
                </label>
                <select
                  required
                  name="customerMobileNumber"
                  type="text"
                  className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  autoFocus
                  value={currentCustomer.customerMobileNumber}
                  onChange={userChange}
                >
                  <option className="hidden" value={currentCustomer._id}>{currentCustomer.customerMobileNumber}</option>
                  {customers && customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>{customer.customerMobileNumber}</option>
                  ))}
                </select>
              </div>


              <div className="inline-block w-full sm:w-1/2 xl:w-1/2 px-3 mb-3">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Transaction Type
                </label>
                <select
                  required
                  value={transactionType}
                  onChange={(e) => { setTransactionType(e.target.value) }}
                  name="transactiontype"
                  type="text"
                  placeholder="Transaction Type"
                  className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  autoFocus
                >
                  <option value=""></option>
                  <option className="text-rose-600" value="wasool">Wasool</option>
                  <option className="text-green-600" value="paidmoney">Paid Money</option>
                  <option className="text-green-600" value="sale">Sale</option>
                  <option className="text-rose-600" value="purchase">Purchase</option>
                  <option className="text-rose-600" value="refund">Refund</option>
                  <option className="text-green-600" value="loss">Loss</option>
                  <option className="text-green-600" value="stockreturn">Stock Return</option>
                </select>
              </div>

              <div className="inline-block w-full sm:w-1/2 xl:w-1/2 px-3 mb-3">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Transaction Method
                </label>
                <select
                  required
                  value={method}
                  onChange={(e) => { setMethod(e.target.value) }}
                  name="method"
                  type="text"
                  placeholder="Transaction Method"
                  className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  autoFocus
                >
                  <option value=""></option>
                  <option className="text-green-600" value="debit">Debit</option>
                  <option className="text-green-600" value="for">FOR</option>
                  <option className="text-green-600" value="cash">Cash</option>
                  <option className="text-green-600" value="easypaisa">Easypaisa</option>
                  <option className="text-green-600" value="jazzcash">JazzCash</option>
                  <option className="text-green-600" value="upaisa">Upaisa</option>
                  <option className="text-green-600" value="meezan">Meezan</option>
                </select>
              </div>

              <div className="inline-block w-full sm:w-1/3 xl:w-1/2 px-3 mb-3">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Customer Balance
                </label>
                <input
                  value={currentCustomer.balance}
                  type="number"
                  className={`w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 ${currentCustomer.balance >= 0 ? 'text-green-600' : 'text-rose-600'} font-bold outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary`}
                  disabled
                />
              </div>

              <div className="inline-block w-full sm:w-1/2 xl:w-1/2 px-3 mb-3">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Total Amount
                </label>
                <input
                  required
                  onChange={(e) => { setAmount(e.target.value) }}
                  value={amount && amount}
                  name="amount"
                  type="number"
                  placeholder="Enter Amount"
                  className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="w-full px-3 mb-3 hidden">
                <p className="text-xl w-full sm:w-1/6 text-white mr-12">Due Date</p>
                <div className="w-full sm:w-1/6">
                  <SwitcherThree enabled={enabled} setEnabled={setEnabled} />
                </div>
                {enabled ? (
                  <div className="transition-transform inline-block w-full sm:w-4/6 xl:w-4/6 px-3 mb-3">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Due Date
                    </label>
                    <DatePickerOne warningDate={warningDate} setWarningDate={setWarningDate} />
                  </div>
                ) : ("")}
              </div>

              <div className="inline-block w-full px-3 mb-3">
                <button onClick={doTransaction} disabled={isSaving} className={`w-full rounded-md bg-blue-600 text-white font-bold text-xl p-3 mt-3 ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}>{isSaving ? 'Processing...' : 'Submit'}</button>
              </div>
            </div>

            <TableTwoCopy transactions={transactions} toast={toast} next={next} fetchmoredata={fetchmoredata} hasMore={hasMore} />
          </div>
        </DefaultLayout>
      </Menu>

    );
  } else {
    return (
      <LoginPage />
    )
  }
};


export default KhataEntry;
