'use client'
import React, { useEffect, useState } from 'react'
import Menu from '@/components/Menu'
import SelectCustomer from '../SelectCustomer'
import Switcherx from '@/components/Switchers/Switcherx'
import { MdDeleteForever } from "react-icons/md";
import { fetchCustomers, fetchShops } from '@/apirequests/getcustomersbyshopid'
import { useGlobalState } from '@/js/globaluser'
import { formatTimestampTo12Hour, reverseDate, getDocumentItems } from '@/apirequests/functions'
import apiaddress from '@/apirequests/apiaddress'
import Image from 'next/image'
import { MdReceipt } from 'react-icons/md'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BillView from '@/components/BillView'
import { useMemo } from 'react'
import DatePicker from 'react-datepicker';
import { FiCalendar } from 'react-icons/fi'; // Import a calendar icon from react-icons
import 'react-datepicker/dist/react-datepicker.css'; // Import the CSS for the date picker
import { FaPersonRays } from 'react-icons/fa6';
import LoginPage from "@/app/authentication/login/page";
import { RiArrowGoBackLine } from "react-icons/ri";

const Page = () => {
    const { user } = useGlobalState()
    const [shops, setShops] = useState([])
    const [documents, setDocuments] = useState([])
    const [selectedDoc, setSelectedDoc] = useState(null)
    const [itemsList, setItemsList] = useState([])
    const [selectedItem, setSelectedItem] = useState(null)
    const [docType, setDocType] = useState('sale')
    const [startDate, setStartDate] = useState(new Date())
    const [endDate, setEndDate] = useState(new Date())
    const [allUsers, setAllUsers] = useState(false)
    const [selectedShop, setSelectedShop] = useState('')
    const [customersList, setcustomerslist] = useState([])
    const [hoveredRow, setHoveredRow] = useState(null)


    const totals = useMemo(() => {
        let cash = 0;
        let debit = 0;
        let easypaisa = 0;
        let jazzcash = 0;
        let upaisa = 0;
        let meezan = 0;
        let total = 0;

        for (let i = 0; i < documents.length; i++) {
            let document = documents[i];
            let payment = document.payment;

            // Iterate through each payment type in the document
            payment.forEach(pay => {
                switch (pay.name) {
                    case 'Cash':
                        cash += Number(pay.amount);
                        break;  // Add break to prevent fall-through
                    case 'Debit':
                        debit += Number(pay.amount);
                        break;  // Add break to prevent fall-through
                    case 'Easypaisa':
                        easypaisa += Number(pay.amount);
                        break;  // Add break to prevent fall-through
                    case 'Jazzcash':
                        jazzcash += Number(pay.amount);
                        break;  // Add break to prevent fall-through
                    case 'Upaisa':
                        upaisa += Number(pay.amount);
                        break;  // Add break to prevent fall-through
                    case 'Meezan':
                        meezan += Number(pay.amount);
                        break;  // Add break to prevent fall-through
                    default:
                        break;  // Optional: You can handle unknown payment types here
                }
                total += Number(pay.amount);
            });
        }

        return { cash, debit, easypaisa, jazzcash, upaisa, meezan, total };
    }, [documents]);  // Only recompute if `documents` change


    const formatDate = (date) => {
        if (!date) {
            return
        }
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    }

    const fetchDocuments = async (shopid, userid, allusers, sdate, ldate, status, docType) => {
        let pxl = { shopid, userid, allusers, sdate: formatDate(sdate), ldate: formatDate(ldate), status, docType }
        let data = await fetch(apiaddress + '/recentdocs/getrecentdocs', {
            method: "POST",
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(pxl)
        })
        let parsed = await data.json()
        return parsed
    }



    const fetchData = (sd, ed) => {
        if (selectedShop) {
            fetchCustomers(selectedShop).then(data => setcustomerslist(data))
            fetchDocuments(
                selectedShop,
                user._id,
                allUsers,
                sd,
                ed,
                'processed',
                docType
            ).then(bills => {
                setDocuments(bills)

            })
        }
    }

    useEffect(() => {
        fetchShops().then(shopData => {
            setShops(shopData);
            let defaultShop;
            let sid = localStorage.getItem('selectedshop')
            if (sid) {
                let pshop = shopData.find(d => d._id === sid)
                if (pshop) {
                    defaultShop = pshop
                } else {
                    defaultShop = shopData[0]
                }
            } else {
                defaultShop = shopData[0]
            }
            setSelectedShop(defaultShop._id);
        })
    }, [])

    useEffect(() => {
        fetchData(startDate, endDate)
    }, [selectedShop, docType, startDate, endDate, allUsers])

    const fetchEntries = async (id) => {
        let data = await getDocumentItems(id)
        setItemsList(data)
        let selected = documents.find(d => d._id === id)
        setSelectedDoc(selected)
    }

    const calculateTotal = (itemsList) => {
        let totalamount = 0;
        let totalexpense = 0;
        let totalcost = 0;
        let costexpense = 0;
        let discount = 0;
        let totalitems = itemsList.length
        for (let i = 0; i < itemsList.length; i++) {
            let match = itemsList[i];
            totalamount += match.saleamount
            totalcost += match.costamount
            costexpense += match.sale * match.qty
            discount += match.discount.amount * match.qty
        }
        return {
            totalitems,
            totalamount: parseFloat(totalamount.toFixed(2)),
            totalexpense: parseFloat(totalexpense.toFixed(2)),
            totalcost: parseFloat(totalcost.toFixed(2)),
            costexpense: parseFloat(costexpense.toFixed(2)),
            discount: parseFloat(discount.toFixed(2)),
            billDiscount: selectedDoc ? selectedDoc.discount : 0
        }
    }

    const [iframeSrc, setIframeSrc] = useState("");
    const [customerSelecting, setCustomerSelecting] = useState(false)
    const [customer, setCustomer] = useState(undefined)
    const createDateTime = (date, updatedAt) => {
        // Get the date from the 'date' field (in YYYYMMDD format)
        const formattedDate = new Date(date.slice(0, 4), date.slice(4, 6) - 1, date.slice(6, 8));

        // Extract the time from the 'updatedAt' field (ISO 8601 timestamp)
        const updatedAtDate = new Date(updatedAt);
        const hours = updatedAtDate.getHours();
        const minutes = updatedAtDate.getMinutes();
        const seconds = updatedAtDate.getSeconds();

        // Set the time extracted from 'updatedAt' to the date from 'date'
        formattedDate.setHours(hours, minutes, seconds);

        return formattedDate; // Returns a Date object
    };

    const fetchReceipt = async () => {
        if (selectedDoc) {
            let billData = {
                selectedBill: selectedDoc,
                selectedDate: createDateTime(selectedDoc.date, selectedDoc.updatedAt),
                selectedShop: shops.find(sh => sh._id === selectedDoc.linkedShop),
                totalSum: selectedDoc.payment.find(fx => fx.name === "Debit") || 0,
                paidamount: selectedDoc.amountpaid,
                splitedPayments: selectedDoc.payment,
                total: calculateTotal(itemsList),
                customer: selectedDoc.customer,
                user: user.username
            }
            const response = await fetch(apiaddress + "/print", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(billData),
            });

            if (response.ok) {
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                setIframeSrc(blobUrl);
            } else {
                console.error("Failed to fetch receipt");
            }
        }
    };

    const deleteBill = async () => {
        if (selectedDoc) {
            let verify = confirm("Type delete to Delete Bill")
            if (verify) {
                let data = await fetch(apiaddress + '/recentdocs/deletedoc', {
                    method: "DELETE",
                    headers: { docid: selectedDoc._id }
                })
                let parsed = await data.json()
                if (parsed.success) {
                    toast("Document Deleted")
                    fetchData(startDate, endDate)
                    setItemsList([])
                    setSelectedDoc(null)  // Reset selected document after deletion
                } else {
                    toast.error("Document Not Deleted")
                }
            }
        }
    }
    const reverseProcessBill = async () => {
        if (selectedDoc) {
            let verify = confirm("Are You Sure ?")
            if (verify) {
                let data = await fetch(apiaddress + '/recentdocs/reverseprocess', {
                    method: "POST",
                    headers: { docid: selectedDoc._id }
                })
                let parsed = await data.json()
                if (parsed.success) {
                    toast("Document Reversed")
                    fetchData(startDate, endDate)
                    setItemsList([])
                    setSelectedDoc(null)  // Reset selected document after deletion
                } else {
                    toast.error("Document Not Reversed")
                }
            }
        }
    }
    const linkCustomer = async (customer) => {
        setCustomer(customer)
        let data = await fetch(apiaddress + '/pos/documents/joincustomer', {
            method: "POST",
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({ id: selectedDoc._id, customer: customer._id })
        })
        let parsed = await data.json()
        if (parsed.success) {
            toast("Customer Selected")
            fetchData(startDate, endDate)

        } else {
            "Backend Error"
        }

    }
    if (user && user.permissions.includes("searchbills")) {
        return (
            <Menu>
                {customerSelecting && <SelectCustomer customersList={customersList} setCustomer={linkCustomer} setCustomerSelecting={setCustomerSelecting} />}
                <ToastContainer />
                <BillView iframeSrc={iframeSrc} />
                <div className='bg-boxdark w-full h-full overflow-clip'>
                    <div className="flex h-[20vh] w-full p-3 justify-start items-start text-center">
                        <div className="flex flex-col justify-start bg-boxdark items-start p-2 w-2/12">
                            <label className="mb-3 block text-sm font-medium text-white dark:text-white">Select Shop</label>
                            <select
                                className="form-datepicker text-white w-full rounded border-[1.5px] border-stroke bg-boxdark px-5 py-3 font-normal outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:focus:border-primary"
                                name="shop"
                                id="shop"
                                value={selectedShop}
                                onChange={(e) => setSelectedShop(e.target.value)}
                            >
                                {shops && shops.map((s, key) => (
                                    <option key={key} value={s._id}>{s.shopName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col justify-start bg-boxdark items-start p-2 w-2/12">
                            <label className="mb-3 block text-sm font-medium text-white dark:text-white">Select Document Type</label>
                            <select
                                value={docType}
                                onChange={(e) => { setDocType(e.target.value) }}
                                className="form-datepicker text-white w-full rounded border-[1.5px] border-stroke bg-boxdark px-5 py-3 font-normal outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:focus:border-primary"
                                name="shop"
                                id="shop"
                            >
                                <option value="sale">Sales</option>
                                <option value="purchase">Purchase</option>
                                <option value="refund">Refund</option>
                                <option value="loss">Loss</option>
                                <option value="stockreturn">Stock Return</option>
                            </select>
                        </div>
                        <div className="w-2/12 flex flex-col items-center justify-between p-3 pl-5 space-y-3">
                            <div className="flex items-center text-white mb-2">
                                <FiCalendar className="text-2xl mr-2" />
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date) => setStartDate(new Date(date))} // Update the selected date
                                    dateFormat="MMMM d, yyyy" // Format for the date display
                                    className="border-none bg-transparent cursor-pointer text-lg"
                                />
                            </div>
                            <div className="flex items-center mb-2 text-white">
                                <FiCalendar className="text-2xl mr-2" />
                                <DatePicker
                                    selected={endDate}
                                    onChange={(date) => setEndDate(new Date(date))} // Update the selected date
                                    dateFormat="MMMM d, yyyy" // Format for the date display
                                    className="border-none bg-transparent cursor-pointer text-lg"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col justify-center space-y-3 bg-boxdark items-center p-2 w-1/12 hover:scale-110 transition-all">
                            <label className="mb-3 block text-sm font-medium text-white dark:text-white">All Users</label>
                            <Switcherx
                                onChange={(e) => { console.log(e.target.value) }}
                                enabled={allUsers}
                                setEnabled={setAllUsers}
                                id="doesCostIncludesDeliveryExpense"
                            />
                        </div>

                        <div onClick={() => { selectedDoc && setCustomerSelecting(true) }} className="flex flex-col justify-center cursor-pointer bg-boxdark items-center p-2 w-1/12 hover:scale-110 transition-all">
                            <label className="mb-3 block text-sm font-medium text-white dark:text-white">Set Customer</label>
                            <FaPersonRays className='text-white text-6xl text-center' />
                        </div>


                        <div onClick={deleteBill} className="flex flex-col justify-center cursor-pointer bg-boxdark items-center p-2 w-1/12 hover:scale-110 transition-all">
                            <label className="mb-3 block text-sm font-medium text-white dark:text-white">Delete</label>
                            <MdDeleteForever className='text-rose-600 text-6xl text-center' />
                        </div>
                        <div onClick={fetchReceipt} className="flex flex-col cursor-pointer justify-center bg-boxdark items-center p-2 w-1/12 hover:scale-110 transition-all">
                            <label className="mb-3 block text-sm font-medium text-white dark:text-white">Receipt</label>
                            <MdReceipt className='text-5xl pt-1 mx-auto text-white text-center' />
                        </div>
                        <div onClick={reverseProcessBill} className="flex flex-col cursor-pointer justify-center bg-boxdark items-center p-2 w-1/12 hover:scale-110 transition-all">
                            <label className="mb-3 block text-sm font-medium text-white dark:text-white">Reverse Process</label>
                            <RiArrowGoBackLine className='text-5xl pt-1 mx-auto text-white text-center' />
                        </div>
                    </div>
                    <hr className='text-slate-600' />
                    <div className="flex h-[80vh]">
                        <div className='h-full w-1/2 pb-18 border-r overflow-scroll text-white text-md border-l-slate-600'>
                            <div className="flex space-x-3 bg-blue-600 justify-between items-center p-2">
                                <div className='border-r w-1/12 text-center pr-2 border-slate-500'>Number</div>
                                <div className='border-r w-1/12 text-center pr-2 border-slate-500'>Type</div>
                                <div className='border-r w-2/12 text-center pr-2 border-slate-500'>User</div>
                                <div className='border-r w-2/12 text-center pr-2 border-slate-500'>Customer</div>
                                <div className='border-r w-2/12 text-center pr-2 border-slate-500'>Date</div>
                                <div className='border-r w-2/12 text-center pr-2 border-slate-500'>Time</div>
                                <div className='border-r w-2/12 text-center pr-2 border-slate-500'>Paid Amount</div>
                            </div>
                            {documents && documents.length > 0 && documents.map((d, key) => (
                                <div
                                    key={key}
                                    className={`relative flex space-x-3 cursor-pointer justify-between items-center p-2 ${d._id === selectedDoc?._id && 'bg-blue-500'}`}
                                    onMouseEnter={() => setHoveredRow(d._id)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                    onClick={()=>{fetchEntries(d._id)}}
                                >
                                    <div className='border-r w-1/12 text-center pr-2 border-slate-500'>{d.count}</div>
                                    <div className='border-r w-1/12 text-center pr-2 border-slate-500'>{d.doctype}</div>
                                    <div className='border-r w-2/12 text-center pr-2 border-slate-500'>{d.user.username}</div>
                                    <div className='border-r w-2/12 text-center pr-2 border-slate-500'>{d.customer ? d.customer.customerName : 'No Name'}</div>
                                    <div className='border-r w-2/12 text-center pr-2 border-slate-500'>{reverseDate(d.date)}</div>
                                    <div className='border-r w-2/12 text-center pr-2 border-slate-500'>{formatTimestampTo12Hour(d.time)}</div>
                                    <div className='border-r w-2/12 text-center pr-2 border-slate-500'>{d.amountpaid.toFixed(2)}</div>

                                    {/* Hover Payment Window */}
                                    {hoveredRow === d._id && (
                                        <div className="absolute top-full left-3 mt-2 -translate-y-48 bg-blue-600 z-999999 shadow-md border rounded-md p-3 w-3/5">
                                            <h3 className="text-lg font-bold mb-2 border-b pb-2">Payments</h3>
                                            <div className="flex justify-between font-bold mb-2">
                                                <span>Payment Type</span>
                                                <span>Payment Amount</span>
                                            </div>
                                            {d.payment.map((p, index) => (
                                                <div key={index} className="flex justify-between text-gray-700">
                                                    <span>{p.name}</span>
                                                    <span>{p.amount.toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between font-bold mt-3 border-t pt-2">
                                                <span>Total</span>
                                                <span>{d.payment.reduce((acc, p) => acc + p.amount, 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {documents.length === 0 && <p className='text-2xl p-3 animate-pulse text-white'>No Documents In Selected Date To Show!</p>}

                            <div className='bg-boxdark border-t-2 border-slate-600 shadow-lg text-white flex text-xl font-bold space-x-1 px-5 pr-24 items-center justify-between fixed bottom-0 left-0 w-full h-14'>
                                <div className='flex justify-between items-center space-x-3'>
                                    <p>Cash</p>
                                    <p>{totals.cash.toFixed(2)}</p>
                                </div>
                                <div className='flex justify-between items-center space-x-3'>
                                    <p>Debit</p>
                                    <p>{totals.debit.toFixed(2)}</p>
                                </div>
                                <div className='flex justify-between items-center space-x-3'>
                                    <p>Easypaisa</p>
                                    <p>{totals.easypaisa.toFixed(2)}</p>
                                </div>
                                <div className='flex justify-between items-center space-x-3'>
                                    <p>JazzCash</p>
                                    <p>{totals.jazzcash.toFixed(2)}</p>
                                </div>
                                <div className='flex justify-between items-center space-x-3'>
                                    <p>Upaisa</p>
                                    <p>{totals.upaisa.toFixed(2)}</p>
                                </div>
                                <div className='flex justify-between items-center space-x-3'>
                                    <p>Meezan</p>
                                    <p>{totals.meezan.toFixed(2)}</p>
                                </div>
                                <div className='flex justify-between text-2xl items-center space-x-3'>
                                    <p>Total</p>
                                    <p>{totals.total.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                        <div className='h-full w-1/2 pb-18 border-r overflow-scroll text-white text-md border-l-slate-600'>
                            {/* Item Headers */}
                            <div className="flex space-x-3 justify-between bg-green-600 items-center p-2">
                                <div className='border-r w-1/12 text-center pr-2 border-slate-500'>Code</div>
                                <div className='border-r w-2/12 text-center pr-2 border-slate-500'>Picture</div>
                                <div className='border-r w-2/12 text-center pr-2 border-slate-500'>Name</div>
                                <div className='border-r w-1/12 text-center pr-2 border-slate-500'>Qty</div>
                                <div className='border-r w-2/12 text-center pr-2 border-slate-500'>Price</div>
                                <div className='border-r w-2/12 text-center pr-2 border-slate-500'>Discount</div>
                                <div className='border-r w-2/12 text-center pr-2 border-slate-500'>Total</div>
                            </div>
                            {/* Item Rows */}
                            {itemsList && itemsList.map((i, key) => (
                                <div key={key} onClick={() => { setSelectedItem(i._id) }} className={`flex space-x-3 cursor-pointer justify-between items-center p-2 ${i._id === selectedItem && 'bg-green-700'}`}>
                                    <div className='border-r w-1/12 text-center pr-2 border-slate-500'>{i.product.itemCode}</div>
                                    <Image alt='product image' className='border-r w-2/12 h-auto text-center pr-2 border-slate-500' height={100} width={100} src={apiaddress + i.product.picture[0]} />
                                    <div className='border-r w-2/12 text-center pr-2 border-slate-500'>{i.product.name}</div>
                                    <div className='border-r w-1/12 text-center pr-2 border-slate-500'>{i.qty}</div>
                                    <div className='border-r w-2/12 text-center pr-2 border-slate-500'>{i.sale}</div>
                                    <div className='border-r w-2/12 text-center pr-2 border-slate-500'>{i.discount.amount}</div>
                                    <div className='border-r w-2/12 text-center pr-2 border-slate-500'>{docType === 'sale' && i.saleamount.toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Menu>
        )
    } else {
        return (
            <LoginPage />
        )
    }
}

export default Page
