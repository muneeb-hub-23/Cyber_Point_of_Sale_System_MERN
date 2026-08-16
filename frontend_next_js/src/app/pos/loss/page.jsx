'use client'
import React, { useEffect, useMemo } from 'react'
import apiaddress from '@/apirequests/apiaddress';
import Image from 'next/image';
import { IoIosAddCircleOutline } from "react-icons/io";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { useState } from 'react';
import { useGlobalState } from '@/js/globaluser';
import { fetchShops } from '@/apirequests/getcustomersbyshopid';
import { useRef } from 'react';
import QuantitySetter from '../QuantitySetter'
import FunctionsPanel from '../FunctionsPanel'
import TopBar from '../TopBar'
import { fetchBills, createBill, deleteDocument } from '@/apirequests/functions'
import SelectCustomer from '../SelectCustomer'
import { fetchCustomers } from '@/apirequests/getcustomersbyshopid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Time from '../Time'
import { createDocumentItem, deleteDocumentItem, getDocumentItems, changeQtyOfItem } from '@/apirequests/functions';
import { MdReceipt } from "react-icons/md";
import { FaFileInvoice } from "react-icons/fa";
import { FaFilePdf } from "react-icons/fa6";
import Menu from '@/components/Menu'
import LoginPage from "@/app/authentication/login/page";
const Page = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());
    const { user } = useGlobalState()
    const [customersList, setCustomerList] = useState(undefined)
    const [customer, setCustomer] = useState(undefined)
    const [customerSelecting, setCustomerSelecting] = useState(false)
    const [shops, setShops] = useState([])
    const [selectedShop, setSelectedShop] = useState(undefined)
    const [bills, setBills] = useState([])
    const [selectedBill, setSelectedBill] = useState(undefined)
    const [products, setProducts] = useState([])
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [itemsList, setitemsList] = useState([])
    const [selectedItem, setSelectedItem] = useState(undefined)
    const [quantity, setQuantity] = useState('1')
    const inputRef = useRef(null);
    const [total, setTotal] = useState({ totalitems: 0, totalamount: 0, totalexpense: 0, totalcost: 0, costexpense: 0, discount: 0 })
    const searchRef = useRef(null)
    const [highlight, setHighlight] = useState(undefined)
    const [searchType, setSearchType] = useState('barcode')
    const [openFinalize, setOpenFinalize] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [quantitySelecting, setQuantitySelecting] = useState(false)
    const [quantityChanging,setQuantityChanging] = useState(false)
    const quantityinput = useRef(null)

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (value.length > 0) {
            let filteredProducts = [];

            if (searchType === 'barcode') {
                filteredProducts = products.filter((product) =>
                    product.itemCode && Number(product.itemCode) === Number(value)
                );
            } else if (searchType === 'name') {
                filteredProducts = products.filter((product) =>
                    product.name && product.name.toLowerCase().includes(value.toLowerCase())
                );
            } else if (searchType === 'category') {
                filteredProducts = products.filter((product) =>
                    product.category && product.category.name && product.category.name.toLowerCase().includes(value.toLowerCase())
                );
            }

            setSuggestions(filteredProducts);
        } else {
            setSuggestions([]); // Clear suggestions if searchTerm is empty
        }
    };
    const fetchProducts = async (shopid) => {
        let data = await fetch(apiaddress + '/management/products/getproductsbyshop', {
            method: "GET",
            headers: {
                'shop': shopid
            }
        });
        let parsed = await data.json();
        return parsed;
    };
    const handleBlur = () => {
        // Timeout to allow clicking suggestion items before hiding the list
        setTimeout(() => setSuggestions([]), 500);
    };
    const helper = (product) => {
        setSearchTerm('')
        setSelectedItem(product);
        setQuantitySelecting(true)
        quantityinput.current.value = '1'
        document.getElementById('quantity').focus()
        document.getElementById('quantity').select()
    }
    const enter = async (e) => {
        // if (e.key === " ") {
        //     !openFinalize && !customerSelecting && searchRef.current.focus()
        // }
        if (e.key === "ArrowRight") {
            setOpenFinalize(true)
        }
        if (e.key === "ArrowLeft") {
            setSearchType('barcode')
            searchRef.current.focus()
        }
        if (e.key === "ArrowDown") {
            !customerSelecting && setCustomerSelecting(true)
        }



        if (!openFinalize) {
            if (!quantitySelecting && !quantityChanging) {
                if (e.key === 'Enter') {
                    if (suggestions.length > 0) {
                        setSearchTerm('')
                        let selectedProduct = suggestions[0];
                        setSelectedItem(selectedProduct);
                        setQuantitySelecting(true)
                        quantityinput.current.value = '1'
                        document.getElementById('quantity').focus()
                        document.getElementById('quantity').select()


                    }
                } else if (e.key === 'Delete') {
                    if (selectedItem) {
                        alert("hello")
                        let data = await deleteDocumentItem(selectedItem._id)
                        if (data.success) {
                            toast("Item Deleted")
                            let b = await getDocumentItems(selectedBill._id)
                            setitemsList(b)
                            calculateTotal(b)
                        } else {
                            toast.error("Server Error")
                        }

                    }
                } else if (e.key === 'Escape') {
                    setSelectedItem(undefined)
                }
            } else if (quantityChanging) {
                if (e.key === 'Enter') {
                    setQuantityChanging(false)
                    setQuantitySelecting(false)

                    let data = await changeQtyOfItem(selectedItem, Number(quantityinput.current.value))
                    if (data.success) {
                        let n = await getDocumentItems(selectedBill._id)
                        setitemsList(n)
                        calculateTotal(n)
                        toast("Quantity Changed")
                        setQuantity(1)
                    } else {
                        setQuantity(1)
                        toast.error("Server Error")
                    }
                } else if (e.key === 'Escape') {

                    setQuantityChanging(false)
                    setQuantitySelecting(false)
                }
            } else {
                if (e.key === 'Enter') {
                    handleEnter(selectedItem);
                    setQuantitySelecting(false)
                    quantityinput.current.value = '1'
                    searchRef.current.focus()

                } else if (e.key === 'Escape') {
                    setCustomerSelecting(false)
                    setQuantitySelecting(false)
                    quantityinput.current.value = '1'
                    searchRef.current.focus()
                }
            }

        } else {
            if (e.key === "c" || e.key === "C") {

                let n = splitedPayments.find(sp => sp.name === "Cash")
                let x = splitedPayments.filter(sp => sp.name !== "Cash")
                !n && setSplitedPayments([...splitedPayments, { name: "Cash", amount: total.costexpense - total.discount }]);
                n && setSplitedPayments(x)

            } else if (e.key === "d" || e.key === "D") {
                if (customer) {
                    let n = splitedPayments.find(sp => sp.name === "Debit")
                    let x = splitedPayments.filter(sp => sp.name !== "Debit")
                    !n && setSplitedPayments([...splitedPayments, { name: "Debit", amount: total.costexpense - total.discount }]);
                    n && setSplitedPayments(x)
                } else {
                    setCustomerSelecting(true)
                }
            } else if (e.key === "s" || e.key === "S") {
                setSplitPayment(true)
            } else if (e.key === "p" || e.key === "P") {
                fetchReceipt()
            } else if (e.key === "Enter" && !customerSelecting && !splitPayment) {
                handleFinalize()
            } else if (e.key === 'Escape') {
                if (splitPayment) {
                    setSplitPayment(false)
                    setCustomerSelecting(false)

                } else {
                    setOpenFinalize(false)
                    setCustomerSelecting(false)

                }
                searchRef.current.focus()
            }
        }
    };
    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = date.getFullYear();

        return `${day}${month}${year}`;
    }
    const calculateTotal = (itemsList) => {
        let totalitems = itemsList.length;
        let totalamount = 0;
        let totalexpense = 0;
        let totalcost = 0;
        let costexpense = 0;

        for (var x = 0; x < itemsList.length; x++) {
            let match = itemsList[x];
            totalamount += match.saleamount
            totalexpense += match.expense * match.qty
            totalcost += match.costamount
            costexpense += match.costExpense * match.qty
        }

        setTotal({
            totalitems: parseFloat(totalitems.toFixed(2)),
            totalamount: parseFloat(totalamount.toFixed(2)),
            totalexpense: parseFloat(totalexpense.toFixed(2)),
            totalcost: parseFloat(totalcost.toFixed(2)),
            costexpense: parseFloat(costexpense.toFixed(2)),
            discount: 0 // No need to round since it's already set to 0
          });
          
    }
    const handleEnter = async (product) => {
        setSplitedPayments([])
        setSearchTerm('');
        const quantity = Number(quantityinput.current.value);
        if (!isNaN(quantity)) {
            const itemWithQty = {
                document: selectedBill._id,
                productData: product,
                product: product._id,
                cost: product.cost,
                expense: product.kharcha,
                costExpense: product.iskharchaincludedinsale ? product.cost + product.kharcha : product.cost,
                tax: product.tax.amount,
                discount: { amount: 0, percentage: 0 },
                sale: product.sale,
                qty: quantity,
                costamount: product.iskharchaincludedinsale ? (product.cost + product.kharcha) * quantity : product.cost * quantity,
                finalprice: product.sale,
                saleamount: product.sale * quantity,
                user: user._id
            };
            let data = await createDocumentItem(itemWithQty)
            if (data.success) {
                toast("Quantity Changed")
            } else {
                toast.error("Server Error")
            }
            let newitems = await getDocumentItems(selectedBill._id)
            setitemsList(newitems)
            setQuantity('1');
            calculateTotal(newitems)
            searchRef.current.focus()
        } else {
            setQuantity(1)
        }
        const targetDiv = document.getElementById(`item${product.itemCode}`);
        if (targetDiv) {
            targetDiv.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
            itemsList.length > 0 && document.getElementById(`item${itemsList[itemsList.length - 1].product.itemCode}`).scrollIntoView({ behavior: "smooth", block: "center" });
        }

    };


    const linkCustomer = async (customer) => {
        setCustomer(customer)
        let data = await fetch(apiaddress + '/pos/documents/joincustomer', {
            method: "POST",
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({ id: selectedBill._id, customer: customer._id })
        })
        let parsed = await data.json()
        if (parsed.success) {
            toast("Customer Selected")
            const billData = await fetchBills('loss', user._id, 'pending', selectedShop._id, selectedDate);
            setBills(billData);
            let x = billData.filter(b => b._id === selectedBill._id)
            setSelectedBill(x[0]);

        } else {
            "Backend Error"
        }

    }
    const unlinkCustomer = async (customer) => {
        setCustomer(undefined)
        let data = await fetch(apiaddress + '/pos/documents/delinkcustomer', {
            method: "POST",
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({ id: selectedBill._id })
        })
        let parsed = await data.json()
        if (parsed.success) {
            toast("Customer Removed")
            const newBills = await fetchBills('loss', user._id, 'pending', selectedShop._id, selectedDate);
            setBills(newBills)
            setSelectedBill(newBills.find(bil => bil._id === selectedBill._id))
        } else {
            "Backend Error"
        }
    }
    const handleBillChange = (e) => {
        setSplitedPayments([])
        let id = e.target.value
        let b = bills.filter(b => b._id === id)
        setSelectedBill(b[0])
        setCustomer(b[0].customer ? b[0].customer : undefined)
        getDocumentItems(b[0]._id).then(data => {
            setitemsList(data)
            calculateTotal(data)
        })
    }
    const handleShopChange = async (shopid) => {
        localStorage.setItem('selectedshop',shopid)
        setSplitedPayments([])
        setSelectedShop(shops.find(S => S._id === shopid))
        let a = await fetchProducts(shopid)
        setProducts(a)
        let b = await fetchCustomers(shopid)
        setCustomerList(b)
        const billData = await fetchBills('loss', user._id, 'pending', shopid, selectedDate);
        if (billData.length > 0) {
            setBills(billData);
            setSelectedBill(billData[0]);
            setCustomer(billData[0].customer ? billData[0].customer : undefined)
            let m = await getDocumentItems(billData[0]._id)
            setitemsList(m)
            calculateTotal(m)
        } else {
            const newBill = await createBill('loss', user._id, 'pending', shopid, selectedDate);
            setBills(newBill);
            setSelectedBill(newBill[0])
            setCustomer(newBill[0].customer ? newBill[0].customer : undefined)
            let m = await getDocumentItems(newBill[0]._id)
            setitemsList(m)
            calculateTotal(m)
        }
    }
    const deleteItem = async () => {
        if (selectedItem) {
            setSplitedPayments([])
            let data = await deleteDocumentItem(selectedItem._id)
            if (data.success) {
                toast("Item Deleted")
                let b = await getDocumentItems(selectedBill._id)
                setitemsList(b)
                calculateTotal(b)
            } else {
                toast.error("Server Error")
            }

        }
    }
    const changeQty = async () => {

        if (selectedItem) {
            setSplitedPayments([])
            setQuantitySelecting(true)
            setQuantityChanging(true)
            let x = itemsList.find(item => item._id === selectedItem._id)
            quantityinput.current.value = (x.qty)
            quantityinput.current.select()

        }
    }
    const itemClick = (id) => {
        let x = itemsList.find(i => i._id === id)
        setSelectedItem(x)
    }

    useEffect(() => {
        const initializeData = async () => {
            try {
                const shopData = await fetchShops();
                setShops(shopData);
                let defaultShop;
                let sid = localStorage.getItem('selectedshop')
                if(sid){
                  let pshop = shopData.find(d=>d._id===sid)
                  if(pshop){
                    defaultShop = pshop
                  }else{
                    defaultShop = shopData[0]
                  }
                }else{
                    defaultShop = shopData[0]
                }
                setSelectedShop(defaultShop);
                let customers = await fetchCustomers(defaultShop._id)
                setCustomerList(customers)

                const billData = await fetchBills('loss', user._id, 'pending', defaultShop._id, selectedDate);

                if (billData.length > 0) {
                    setBills(billData);
                    setSelectedBill(billData[0]);
                    let newlist = await getDocumentItems(billData[0]._id)
                    setitemsList(newlist)
                    calculateTotal(newlist)
                    setCustomer(billData[0].customer ? billData[0].customer : undefined)
                } else if (billData.length === 0) {
                    const newBill = await createBill('loss', user._id, 'pending', defaultShop._id, selectedDate);
                    setBills(newBill);
                    setSelectedBill(newBill[0]);
                    let newlist = await getDocumentItems(newBill[0]._id)
                    setitemsList(newlist)
                    calculateTotal(newlist)
                    // setCustomer(newBill[0].customer ? billData[0].customer : undefined)
                }
                const productData = await fetchProducts(defaultShop._id);
                setProducts(productData);

            } catch (error) {
                console.error("Error initializing data:", error);
            }
        };


        initializeData();

        // Register event listener and cleanup on unmount
        document.addEventListener('keydown', enter);
        return () => document.removeEventListener('keydown', enter);

        // Adding dependencies
    }, [selectedDate]);

    useEffect(() => {
        if(user){

            searchRef.current.focus()
        }
    }, [customer])


    const [paymentType, setPaymentType] = useState('')
    const [splitPayment, setSplitPayment] = useState(false)
    const [paymentTypes, setPaymentTypes] = useState(['Debit', 'Cash', 'Easypaisa', 'Jazzcash', 'Upaisa', 'Meezan'])
    const [splitedPayments, setSplitedPayments] = useState([])

    const paidamount = useMemo(() => {
        return splitedPayments.reduce((sum, payment) => {
            // Convert amount to a number to ensure accuracy
            return sum + Number(payment.amount || 0);
          }, 0);
  }, [splitedPayments]); // Dependencies array

    const totalSum = useMemo(() => {
            let x = splitedPayments.find((s) => s.name === 'Debit');
            if(x){
                return x.amount
            }else{
                return 0
            }
      }, [splitedPayments]); // Dependencies array


    const handleFinalize = async () => {
        if (isSaving) return

        let finalObject = {
            paymentType,
            paidamount,
            splitedPayments,
            totalSum,
            currentTime,
            user: user._id,
            customer,
            selectedShop: selectedShop._id,
            selectedBill,
            total,
            date: selectedDate
        }
        setIsSaving(true)
        let data
        try {
          data = await fetch(apiaddress + '/pos/finalize/finalizeloss', {
            method: "POST",
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(finalObject)
          })
        } catch (networkErr) {
          toast.error('Network error — please try again')
          setIsSaving(false)
          return
        }
        let parsed = await data.json()
        if (parsed.success) {
            setOpenFinalize(false)
            setSplitedPayments([])
            toast("Document Processed")
            setCustomer(undefined)
            const billData = await fetchBills('loss', user._id, 'pending', selectedShop._id, selectedDate);
            if (billData.length > 0) {
                setBills(billData);
                setSelectedBill(billData[0]);
                let newlist = await getDocumentItems(billData[0]._id)
                setitemsList(newlist)
                calculateTotal(newlist)
                setCustomer(billData[0].customer ? billData[0].customer : undefined)
            } else if (billData.length === 0) {
                const newBill = await createBill('loss', user._id, 'pending', selectedShop._id, selectedDate);
                setBills(newBill);
                setSelectedBill(newBill[0]);
                let newlist = await getDocumentItems(newBill[0]._id)
                setitemsList(newlist)
                calculateTotal(newlist)
                // setCustomer(newBill[0].customer ? billData[0].customer : undefined)
            }

            const productData = await fetchProducts(selectedShop._id);
            setProducts(productData);
            searchRef.current.focus()
        } else {
            toast.error(parsed.message)
        }
        setIsSaving(false)

    }
    if(user && user.permissions.includes("loss")){
    return (
        <Menu >
        <div onKeyDown={enter}>
        {customerSelecting && <SelectCustomer customersList={customersList} setCustomer={linkCustomer} setCustomerSelecting={setCustomerSelecting} />}
        <ToastContainer autoClose={2000} />

            {openFinalize &&
                <div className='absolute top-0 left-0 w-full min-h-screen bg-boxdark z-99999 p-4'>
                    <ToastContainer autoClose={2000} />
                    {splitPayment &&
                        <div className='absolute p-12 top-0 left-0 w-full min-h-screen bg-slate-700 z-999999'>
                            <button className='rounded-md bg-rose-600 text-white font-bold px-3 py-2 text-lg' onClick={() => { setSplitPayment(false) }}>Close</button>
                            <div className="flex space-x-5 mt-5">
                                <div className='w-1/4 flex flex-col space-y-3'>
                                    {
                                        paymentTypes.map((p, key) => (
                                            <button key={key}
                                                onClick={() => {
                                                    // Check if payment type already exists in splitedPayments
                                                    const exists = splitedPayments.some(payment => payment.name === p);
                                                    if (!exists) {
                                                        if (p === 'Debit') {
                                                            !customer ?
                                                                setCustomerSelecting(true)
                                                                : setSplitedPayments([...splitedPayments, { name: p, amount: total.costexpense }]);
                                                        } else {
                                                            setSplitedPayments([...splitedPayments, { name: p, amount: total.costexpense }]);
                                                        }
                                                    }
                                                }}
                                                className="text-xl text-white p-5 rounded-md bg-boxdark border-2 border-blue-600"
                                            >
                                                {p}
                                            </button>))
                                    }
                                </div>
                                <div className="w-3/4 flex flex-col">

                                    <div className='w-full min-h-72 border-2 border-slate-600'>
                                        {splitedPayments.map((sp, n) => (
                                            <div key={n} className="flex">
                                                <h3 className='text-xl w-2/12 text-white p-2'>{sp.name}</h3>
                                                <input
                                                    type="text"
                                                    value={sp.amount}
                                                    onChange={(e) => {
                                                        const updatedPayments = splitedPayments.map((payment, index) =>
                                                            index === n ? { ...payment, amount: e.target.value } : payment
                                                        );
                                                        setSplitedPayments(updatedPayments);
                                                    }}
                                                    className="border-b w-6/12 bg-transparent p-1 text-xl text-green-600 font-bold focus:outline-none" // Add any necessary Tailwind classes for styling
                                                />
                                                <button
                                                    onClick={() => {
                                                        const updatedPayments = splitedPayments.filter((_, index) => index !== n);
                                                        setSplitedPayments(updatedPayments);
                                                    }}
                                                    className="text-rose-500 border rounded m-2 p-1 hover:text-rose-700"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className='text-right text-xl font-bold text-green-600'>

                                        <div className='flex space-x-8 text-white justify-end'>
                                            <h3 className='w-2/12'>Total Loss</h3>
                                            <h3 className='w-1/12'>{total.costexpense}</h3>
                                        </div>


                                        {splitedPayments.map((sp) => (
                                            <div key={sp} className='flex space-x-8 text-green-600 justify-end'>
                                                <h3 className='w-2/12'>{sp.name}</h3>
                                                <h3 className='w-1/12'>- {sp.amount}</h3>
                                            </div>
                                        ))}
                                        <div className='flex space-x-8 text-white text-2xl justify-end'>
                                            <h3 className='w-2/12'>Total Bonus Amount</h3>
                                            <h3 className='w-1/12'>{paidamount}</h3>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                    <button className='absolute top-5 right-5 rounded-md bg-rose-600 text-white font-bold px-3 py-2 text-lg' onClick={() => { setOpenFinalize(false) }}>Close</button>
                   
                   
                    <div className={'flex w-full h-screen items-center justify-center'}>
                        <div className='w-8/12 min-h-72'>

                            <div className="flex">
                                <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>Total Loss Amount</h3>
                                <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>{total.costexpense}</h3>
                            </div>

                            {splitedPayments.map((p, l) => (
                                <div key={l} className="flex text-green-600">
                                    <h3 className='text-2xl font-bold border-b-2 mb-2 p-2 border-blue-600 w-1/2'>{p.name}</h3>
                                    <input type='text' className='text-2xl bg-transparent outline-none font-bold border-b-2 mb-2 p-2 border-blue-600 w-1/2' value={p.amount} />
                                </div>
                            ))}
                            <div className="flex">
                                <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>Total Bonus Amount</h3>
                                <p className='text-2xl bg-transparent outline-none font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>{paidamount}</p>
                            </div>

                            {selectedBill.customer &&
                                <>
                                    <div className="flex">
                                        <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>Customer</h3>
                                        <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>{selectedBill.customer ? selectedBill.customer.customerName : 'No Customer selected'}</h3>
                                    </div>
                                    <div className="flex">
                                        <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>Customer Balance</h3>
                                        <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>{selectedBill.customer && <p className={`${selectedBill.customer.balance>=0 ? 'text-green-600':'text-rose-600'}`}>{selectedBill.customer.balance}</p>}</h3>
                                    </div>
                                    <div className='flex space-x-8 text-white justify-end'>
                                        <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>New Balance</h3>
                                        <h3 className={`text-2xl font-bold border-b-2 mb-2 p-2 mr-0 border-blue-600 w-1/2 ${selectedBill.customer.balance+Number(totalSum) >= 0 ? 'text-green-600':'text-rose-600'}`}>{selectedBill.customer.balance+Number(totalSum)}</h3>
                                    </div>
                                </>}
                                <div className='w-full flex my-5 justify-between space-x-3'>
                                    {
                                        paymentTypes.map((p, key) => (
                                            <button key={key}
                                                onClick={() => {
                                                    // Check if payment type already exists in splitedPayments
                                                    const exists = splitedPayments.some(payment => payment.name === p);
                                                    if (!exists) {
                                                        if (p === 'Debit') {
                                                            !customer ?
                                                                setCustomerSelecting(true)
                                                                : setSplitedPayments([...splitedPayments, { name: p, amount: total.costexpense - total.discount - total.billDiscount }]);
                                                        } else {
                                                            setSplitedPayments([...splitedPayments, { name: p, amount: total.costexpense - total.discount - total.billDiscount }]);
                                                        }
                                                    }
                                                }}
                                                className="text-xl text-white p-3 w-2/12 rounded-md bg-boxdark border-2 border-blue-600 hover:bg-blue-600"
                                            >
                                                {p} {p === 'Cash' && '(c)'}{p === 'Debit' && '(d)'}
                                            </button>))
                                    }
                                </div>
                            <div className='w-full flex space-x-8 text-center'>

                                <button className='w-4/12 p-3 m-5 mx-auto rounded-md hover:scale-110 bg-blue-600 text-white font-bold text-3xl' onClick={() => { setSplitPayment(true) }}>Split Payment</button>
                                <button className={`w-7/12 p-3 m-5 mx-auto rounded-md bg-green-600 text-white font-bold text-3xl ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`} onClick={handleFinalize} disabled={isSaving}>{isSaving ? 'Processing...' : 'Process'}</button>
                            </div>
                        </div>
                        <div className='w-3/12 flex flex-col space-y-12 justify-between items-center'>
                            <div className='w-1/2 min-h-24 border-2 text-center border-white hover:bg-slate-700 cursor-pointer'>
                                <MdReceipt className='text-5xl pt-1 mx-auto text-green-600 text-center' />
                                <p className='text-white text-center'>Print receipt</p>
                            </div>
                            <div className='w-1/2 min-h-24 border-2 border-white hover:bg-slate-700 cursor-pointer'>
                                <FaFileInvoice className='text-5xl pt-1 mx-auto text-green-600 text-center' />
                                <p className='text-white text-center'>Print Invoice</p>
                            </div>
                            <div className='w-1/2 min-h-24 border-2 border-white hover:bg-slate-700 cursor-pointer'>
                                <FaFilePdf className='text-5xl pt-1 mx-auto text-green-600 text-center' />
                                <p className='text-white text-center'>Create PDF</p>
                            </div>
                        </div>
                    </div>
                </div>
            }

            <div className={`fixed z-999 ${!quantitySelecting ? '-top-[100vh]' : 'top-12'} left-72 w-1/3 h-3/5 p-5 px-12 pr-16 space-y-4 flex flex-col items-center justify-center space-x-4 border-2 text-center bg-blue-800 rounded-lg border-white transition-all`}>
                    <h3 className='text-4xl font-bold text-white'>Set Quantity</h3>

                    <input
                        id='quantity'
                        ref={quantityinput}
                        className='text-right w-full text-3xl bg-boxdark border-2 border-white text-white font-bold'
                        type="text"
                        placeholder='Enter Quantity'
                    />

                </div>
            <TopBar searchTerm={searchTerm} searchType={searchType} setSearchType={setSearchType} handleSearchChange={handleSearchChange} products={products} suggestions={suggestions} setSuggestions={setSuggestions} handleEnter={handleEnter} handleBlur={handleBlur} searchRef={searchRef} />
            <div className='w-full flex min-h-screen'>
                <div className='w-9/12 pt-12 pb-36 text-sm min-h-screen bg-black'>
                    <div className='flex w-full sticky top-12 bg-black border-blue-600 border-b-2'>
                        <div className='w-1/12 p-2 text-center text-white'>Item Code</div>
                        <div className='w-1/12 p-2 text-center text-white'>Image</div>
                        <div className='w-3/12 p-2 text-white'>Item Name</div>
                        <div className='w-1/12 p-2 text-center text-white'>Qty/Pack</div>
                        <div className='w-1/12 p-2 text-center text-white'>Cost Price</div>
                        <div className='w-1/12 p-2 text-center text-white'>Expense</div>
                        <div className='w-1/12 p-2 text-center text-white'>Cost+Expense</div>
                        <div className='w-1/12 p-2 text-center text-white'>Quantity</div>
                        <div className='w-1/12 p-2 text-center text-white'>Total Loss</div>

                    </div>

                    {itemsList && itemsList.length > 0 && itemsList.map((item, key) => (
                            <div key={key} id={`item${item.productData.itemCode}`} onClick={(e) => { itemClick(item._id) }} className={`flex w-full ${item.discount.amount !== 0 && 'bg-green-500'} items-center border-blue-600 ${selectedItem && selectedItem._id === item._id && 'bg-blue-600'} border-dotted border-b-2`}>
                            <div className="w-1/12 p-2 text-center text-white">{item.productData.itemCode}</div>
                            <div className="w-1/12 p-2 text-center text-white">
                                <Image
                                    height={70}
                                    width={70}
                                    className="mx-auto h-auto w-auto"
                                    alt="Product"
                                    src={`${apiaddress}${item.productData.picture[0]}`}
                                />
                            </div>
                            <div className="w-3/12 p-2 text-white">{item.productData.name}</div>
                            <div className="w-1/12 p-2 text-center text-white">{item.productData.unit}</div>
                            <div className="w-1/12 p-2 text-center text-white">{item.cost}</div>
                            <div className="w-1/12 p-2 text-center text-white">{item.expense}</div>
                            <div className="w-1/12 p-2 text-center text-white">{item.costExpense}</div>
                            <div className="w-1/12 p-2 text-center text-white">{item.qty}</div>
                            <div className="w-1/12 p-2 text-center text-white">{item.costamount}</div>

                        </div>
                    ))}
                </div>
                <div className='w-3/12 fixed right-0 min-h-screen bg-boxdark max-h-screen shadow-lg border-l-2 border-slate-500'>
                    <div className='w-full text-center'>
                        <select
                            value={selectedShop && selectedShop._id}
                            onChange={(e) => {
                                setSelectedShop(e.target.value);
                                handleShopChange(e.target.value)
                            }}
                            className='w-10/12 p-3 text-green-400 text-lg bg-boxdark outline-1 outline-slate-500 m-3 border-slate-500 border-2 hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300'
                            name="a"
                            id="a"
                        >
                            {shops.length > 0 && shops.map((shop) => (
                                <option key={shop._id} value={shop._id}>{shop.shopName}</option>
                            ))}
                        </select>

                    </div>
                    <hr />
                    <div className='w-full mx-auto flex justify-center items-center text-center'>
                            <IoIosAddCircleOutline onClick={async () => {

                                await createBill('loss', user._id, 'pending', selectedShop._id, selectedDate, customer && customer);
                                const billData = await fetchBills('loss', user._id, 'pending', selectedShop._id, selectedDate);
                                setBills(billData);
                                setSelectedBill(billData[billData.length - 1]);
                                let newlist = await getDocumentItems(billData[billData.length - 1]._id)
                                setitemsList(newlist)
                                calculateTotal(newlist)
                                setCustomer(billData[billData.length - 1].customer ? billData[billData.length - 1].customer : undefined)
                                searchRef.current.focus()



                            }} className='text-4xl rounded-full text-green-500 hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300' />
                            <select value={selectedBill && selectedBill._id} onChange={handleBillChange} className='w-7/12 p-3 text-green-400 text-lg bg-transparent outline-1 outline-slate-500 m-3 border-slate-500 border-2 hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300' name="a" id="a">
                                {bills && bills.length > 0 && bills.map((bi, num) => (
                                    <option key={bi._id} value={bi._id}>{bi.customer && bi.customer.customerName ? bi.customer.customerName : 'No Name ' + num}</option>
                                ))}
                            </select>

                            <MdOutlineDeleteOutline onClick={async () => {
                                await deleteDocument(selectedBill._id, 'loss', user._id, 'pending', selectedShop._id, formatDate(selectedDate))
                                const billData = await fetchBills('loss', user._id, 'pending', selectedShop._id, selectedDate);
                                if (billData.length > 0) {
                                    setBills(billData);
                                    setSelectedBill(billData[0]);
                                    let newlist = await getDocumentItems(billData[0]._id)
                                    setitemsList(newlist)
                                    calculateTotal(newlist)
                                    setCustomer(billData[0].customer ? billData[0].customer : undefined)
                                    await searchRef.current.focus()
                                } else if (billData.length === 0) {
                                    const newBill = await createBill('loss', user._id, 'pending', selectedShop._id, selectedDate);
                                    setBills(newBill);
                                    setSelectedBill(newBill[0]);
                                    let newlist = await getDocumentItems(newBill[0]._id)
                                    setitemsList(newlist)
                                    calculateTotal(newlist)
                                    setCustomer(undefined)
                                    await searchRef.current.focus()
                                }
                            }} className='text-4xl rounded-full text-rose-500 hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300' />
                        </div>
                    <hr />

                    <FunctionsPanel
                        customer={customer}
                        selected={'loss'}
                        setCustomerSelecting={setCustomerSelecting}
                        clearCustomer={unlinkCustomer}
                        deleteItem={deleteItem}
                        changeQty={changeQty}
                        openFinalize={setOpenFinalize}
                    />
                </div>
                <div className='w-9/12 flex fixed text-md justify-between items-center bg-boxdark bottom-0 left-0 text-white border-slate-500 border-t-2 h-36'>
                    <div className="w-1/3">
                        <Time user={user} selectedDate={selectedDate} setSelectedDate={setSelectedDate} currentTime={currentTime} setCurrentTime={setCurrentTime} />
                    </div>
                    <div className='w-1/3 p-1'>

                        <div className='flex justify-around ml-auto hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300 text-rose-500 font-bold w-full p-2'>
                            <div className='w-1/2'>Total Items</div>
                            <div className='w-1/2'>{total && total.totalitems}</div>
                        </div>

                        <div className='flex justify-around ml-auto hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300 text-rose-500 text-md font-bold w-full p-2'>
                            <div className='w-1/2 pr-1'>Total Delivery Expense:</div>
                            <div className='w-1/2 text-xl'>{total && total.totalexpense}</div>
                        </div>


                    </div>
                    <div className='w-1/3 p-1'>



                        <div className='flex justify-around hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300 ml-auto text-green-500 font-bold text-md w-full p-2'>
                            <div className='w-1/2 pr-1'>Total Delivery + Cost</div>
                            <div className='w-1/2 text-xl'>{total && total.costexpense}</div>
                        </div>

                        <div className='flex justify-around hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300 ml-auto text-green-500 font-bold text-xl w-full p-2'>
                            <div className='w-1/2'>Total Loss Amount:</div>
                            <div className='w-1/2'>{total && total.costexpense}</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
        </Menu>
    )
}else{
    return(
        <LoginPage />
    )
}
}

export default Page
