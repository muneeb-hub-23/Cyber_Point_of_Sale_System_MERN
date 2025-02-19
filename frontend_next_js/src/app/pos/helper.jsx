'use client'
import React, { useEffect } from 'react'
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
    const enter = (e) => {
        if (e.key === 'Enter') {
            if (suggestions.length > 0) {
                const selectedProduct = suggestions[0];
                setSelectedItem(selectedProduct);
                handleEnter(selectedProduct);
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

        setTotal({ totalitems, totalamount, totalexpense, totalcost, costexpense, discount: 0 })
    }
    const handleEnter = (product) => {

        setSearchTerm('');
        inputRef.current.select();
        setSelectedItem(product);

        const priceElement = document.getElementById('price');
        priceElement.classList.remove('-top-[100vh]');
        priceElement.classList.add('top-12');

        const handleQty = async () => {
            const quantity = Number(document.getElementById('amount').value);
            if (!isNaN(quantity)) {
                const itemWithQty = {
                    document: selectedBill._id,
                    productData: product,
                    product: product._id,
                    cost: product.cost,
                    expense: product.kharcha,
                    costExpense: product.iskharchaincludedinsale ? product.cost + product.kharcha : product.cost,
                    tax: product.tax.amount,
                    discount: 0,
                    sale: product.sale,
                    qty: quantity,
                    costamount: product.iskharchaincludedinsale ? (product.cost + product.kharcha) * quantity : product.cost * quantity,
                    saleamount: product.sale * quantity,
                    user: user._id
                };
                let data = await createDocumentItem(itemWithQty)
                if (data.success) {
                    toast("Item Added To List")
                } else {
                    toast.error("Server Error")
                }
                setHighlight(undefined)
                let newitems = await getDocumentItems(selectedBill._id)
                setitemsList(newitems)
                // setitemsList([...itemsList, itemWithQty]);
                setQuantity('1');
                // calculateTotal([...itemsList, itemWithQty]);
                calculateTotal(newitems)
            } else {
                setQuantity(1)
            }
        };

        const run = (e) => {
            if (e.key === "Escape") {
                priceElement.classList.add('-top-[100vh]');
                priceElement.classList.remove('top-12');
                document.removeEventListener('keydown', run);
                searchRef.current.focus();
            } else if (e.key === "Enter") {
                handleQty();
                priceElement.classList.add('-top-[100vh]');
                priceElement.classList.remove('top-12');
                document.removeEventListener('keydown', run);
                searchRef.current.focus();
            }
        };
        document.addEventListener('keydown', run);
    };
    const linkCustomer = async (customer) => {
        setCustomer(customer)
        console.log(selectedBill)
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
            const formattedDate = formatDate(selectedDate);
            const billData = await fetchBills('purchase', user._id, 'pending', selectedShop._id, formattedDate);
            setBills(billData);
            let x = billData.filter(b => b._id === selectedBill._id)
            setSelectedBill(x[0]);

        } else {
            "Backend Error"
        }

    }
    const unlinkCustomer = async (customer) => {
        setCustomer(customer)
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
            const newBills = await fetchBills('purchase', user._id, 'pending', selectedShop._id, formatDate(selectedDate));
            setBills(newBills)
            setSelectedBill(newBills.filter(bil => bil._id === selectedBill._id))
        } else {
            "Backend Error"
        }
    }
    const handleBillChange = (e) => {
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
        let a = await fetchProducts(shopid)
        setProducts(a)
        let b = await fetchCustomers(shopid)
        setCustomerList(b)
        const billData = await fetchBills('purchase', user._id, 'pending', shopid, formatDate(selectedDate));
        if (billData.length > 0) {
            setBills(billData);
            setSelectedBill(billData[0]);
            setCustomer(billData[0].customer ? billData[0].customer : undefined)
            let m = await getDocumentItems(billData[0]._id)
            setitemsList(m)
        } else {
            const newBill = await createBill('purchase', user._id, 'pending', shopid, formatDate(selectedDate));
            setBills(newBill);
            setSelectedBill(newBill[0])
            setCustomer(newBill[0].customer ? newBill[0].customer : undefined)
            let m = await getDocumentItems(newBill[0]._id)
            setitemsList(m)
        }
    }
    const deleteItem = async () => {
        if (highlight) {
            let data = await deleteDocumentItem(highlight)
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
        if (highlight) {
            const priceElement = document.getElementById('price');
            inputRef.current.select()
            priceElement.classList.remove('-top-[100vh]');
            priceElement.classList.add('top-12');
            let x = itemsList.filter(item => item._id === highlight)
            setQuantity(x[0].qty)

            const change = async (e) => {
                if (e.key === "Enter") {
                    priceElement.classList.add('-top-[100vh]');
                    priceElement.classList.remove('top-12');
                    let data = await changeQtyOfItem(highlight, Number(document.getElementById('amount').value))
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
                }
            }
            document.addEventListener('keydown', change)

        }
    }
    useEffect(() => {
        const initializeData = async () => {
            try {
                const shopData = await fetchShops();
                setShops(shopData);
                const defaultShop = shopData[0];
                setSelectedShop(defaultShop);
                let customers = await fetchCustomers(defaultShop._id)
                setCustomerList(customers)

                const formattedDate = formatDate(selectedDate);
                const billData = await fetchBills('purchase', user._id, 'pending', defaultShop._id, formattedDate);
                if (billData.length > 0) {
                    setBills(billData);
                    setSelectedBill(billData[0]);
                    let newlist = await getDocumentItems(billData[0]._id)
                    setitemsList(newlist)
                    calculateTotal(newlist)
                    setCustomer(billData[0].customer ? billData[0].customer : undefined)
                } else {
                    const newBill = await createBill('purchase', user._id, 'pending', defaultShop._id, formattedDate, customer && customer);
                    setBills(newBill);
                    setSelectedBill(newBill[0]);
                    let newlist = await getDocumentItems(billData[0]._id)
                    setitemsList(newlist)
                    calculateTotal(newlist)
                    setCustomer(newBill[0].customer ? billData[0].customer : undefined)
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
    }, []);


    const [paymentType, setPaymentType] = useState('')
    const [amountPaid, setAmountPaid] = useState(total.costexpense)
    const paidRef = useRef(null)
    const discRef = useRef(null)
    const handleFinalize = async () => {
        let finalObject = {
            paymentType, amountPaid, selectedDate, currentTime, user: user._id, customer, selectedShop: selectedShop._id, selectedBill, total
        }
        let data = await fetch(apiaddress + '/pos/finalize/finalizepurchase', {
            method: "POST",
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(finalObject)
        })
        let parsed = await data.json()

        if (parsed.success) {
            toast("Data Fetched")
        }

    }
    return (
        <div onKeyDown={enter}>
            <ToastContainer autoClose={2000} />
            {openFinalize &&
                <div className='absolute top-0 left-0 w-full h-screen bg-boxdark z-99999 p-4'>
                    <ToastContainer autoClose={2000} />
                    <button className='absolute top-5 right-5 rounded-md bg-rose-600 text-white font-bold px-3 py-2 text-lg' onClick={() => { setOpenFinalize(false) }}>Close</button>
                    <div className={'flex w-full h-screen items-center justify-center'}>
                        <div className='w-8/12 min-h-72'>

                            <div className="flex">
                                <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>SubTotal</h3>
                                <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>{total.costexpense}</h3>
                            </div>
                            <div className="flex">
                                <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>Discount</h3>
                                <input ref={discRef} type='text' onChange={(e) => { setTotal({ ...total, discount: Number(e.target.value) }) }} className='text-2xl bg-transparent outline-none font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2' value={total.discount} />

                            </div>
                            <div className="flex">
                                <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>Total Amount</h3>
                                <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>{total.costexpense - total.discount}</h3>
                            </div>
                            {paymentType === 'debit' &&
                                <>
                                    <div className="flex">
                                        <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>Customer</h3>
                                        <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>{selectedBill.customer ? selectedBill.customer.customerName : 'No Customer selected'}</h3>
                                    </div>
                                    <div className="flex">
                                        <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>Customer Balance</h3>
                                        <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>{selectedBill.customer && selectedBill.customer.leneHain > 0 ? <p className='text-green-600'>+ {selectedBill.customer.leneHain}</p> : <p className='text-rose-600'>- {selectedBill.customer.deneHain}</p>}</h3>
                                    </div>
                                    <div className="flex">
                                        <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>Current Balance</h3>
                                        <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>{selectedBill.customer && selectedBill.customer.leneHain > 0 ? <p>+ {selectedBill.customer.leneHain + (total.costexpense - total.discount)}</p> : <p>- {selectedBill.customer.deneHain - (total.costexpense - total.discount)}</p>}</h3>
                                    </div>
                                </>}

                            {paymentType === 'cash' &&
                                <>
                                    <div className="flex">
                                        <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>Amount Paid</h3>
                                        <input ref={paidRef} type='text' onChange={(e) => { setAmountPaid(e.target.value) }} className='text-2xl bg-transparent outline-none font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2' value={amountPaid} />
                                    </div>
                                    <div className="flex">
                                        <h3 className='text-2xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>Change</h3>
                                        <input type='text' className='text-2xl bg-transparent outline-none font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2' value={total.costexpense-total.discount-amountPaid} />
                                    </div>
                                </>
                            }



                            <div className="flex space-x-5 mt-8 justify-around">
                                <button onClick={() => { customer ? setPaymentType('debit') : setCustomerSelecting(true); toast("Please Select Customer First") }} className={`px-3 py-2 w-2/12 ${paymentType === 'debit' ? 'border-4 border-blue-600 scale-110' : ''} text-2xl rounded-lg hover:scale-110 bg-rose-600 text-white`}>Debit</button>
                                <button onClick={() => { setPaymentType('cash'); setAmountPaid(total.costexpense - total.discount) }} className={`px-3 py-2 w-2/12 ${paymentType === 'cash' ? 'border-4 border-blue-600 scale-110' : ''} text-2xl rounded-lg hover:scale-110 bg-green-600 text-white`}>Cash</button>
                                <button onClick={() => { setPaymentType('easypaisa'); setAmountPaid(total.costexpense - total.discount) }} className={`px-3 w-2/12 ${paymentType === 'easypaisa' ? 'border-4 border-blue-600 scale-110' : ''} py-2 text-2xl rounded-lg hover:scale-110 bg-green-600 text-white`}>Easypaisa</button>
                                <button onClick={() => { setPaymentType('jazzcash'); setAmountPaid(total.costexpense - total.discount) }} className={`px-3 w-2/12 ${paymentType === 'jazzcash' ? 'border-4 border-blue-600 scale-110' : ''} py-2 text-2xl rounded-lg hover:scale-110 bg-green-600 text-white`}>Jazz Cash</button>
                                <button onClick={() => { setPaymentType('upaisa'); setAmountPaid(total.costexpense - total.discount) }} className={`px-3 w-2/12 ${paymentType === 'upaisa' ? 'border-4 border-blue-600 scale-110' : ''} py-2 text-2xl rounded-lg hover:scale-110 bg-green-600 text-white`}>U Paisa</button>
                                <button onClick={() => { setPaymentType('meezan'); setAmountPaid(total.costexpense - total.discount) }} className={`px-3 w-2/12 ${paymentType === 'meezan' ? 'border-4 border-blue-600 scale-110' : ''} py-2 text-2xl rounded-lg hover:scale-110 bg-green-600 text-white`}>Meezan</button>
                            </div>
                            <div className='w-full text-center'>
                                <button className='w-8/12 p-3 m-5 mx-auto rounded-md hover:scale-110 bg-blue-600 text-white font-bold text-3xl' onClick={handleFinalize}>Process</button>
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
            {customerSelecting && <SelectCustomer customersList={customersList} setCustomer={linkCustomer} setCustomerSelecting={setCustomerSelecting} />}
            <QuantitySetter
                quantity={quantity}
                setQuantity={setQuantity}
                inputRef={inputRef}
                onEnter={handleEnter}
            />
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
                        <div className='w-1/12 p-2 text-center text-white'>Total Cost</div>
                        <div className='w-1/12 p-2 text-center text-white'>Sale Price</div>
                        <div className='w-1/12 p-2 text-center text-white'>Total Sale</div>
                    </div>

                    {itemsList && itemsList.length > 0 && itemsList.map((item, key) => (
                        <div key={key} onClick={(e) => { setHighlight(item._id) }} className={`flex w-full items-center border-blue-600 ${highlight === item._id && 'bg-blue-600'} border-dotted border-b-2`}>
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
                            <div className="w-1/12 p-2 text-center text-white">{item.sale}</div>
                            <div className="w-1/12 p-2 text-center text-white">{item.saleamount}</div>
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
                            const newBill = await createBill('purchase', user._id, 'pending', selectedShop._id, formatDate(selectedDate), customer && customer);
                            setBills(newBill);
                            setSelectedBill(newBill[newBill.length > 0 ? newBill.length - 1 : 0]);
                        }} className='text-4xl rounded-full text-green-500 hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300' />
                        <select value={selectedBill && selectedBill._id} onChange={handleBillChange} className='w-7/12 p-3 text-green-400 text-lg bg-transparent outline-1 outline-slate-500 m-3 border-slate-500 border-2 hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300' name="a" id="a">
                            {bills && bills.length > 0 && bills.map((bi, num) => (
                                <option key={bi._id} value={bi._id}>{bi.customer && bi.customer.customerName.length > 0 ? bi.customer.customerName : 'No Name ' + num}</option>
                            ))}
                        </select>

                        <MdOutlineDeleteOutline onClick={async () => {
                            let newBill = await deleteDocument(selectedBill._id, 'purchase', user._id, 'pending', selectedShop._id, formatDate(selectedDate))
                            setBills(newBill);
                            setSelectedBill(newBill[newBill.length > 0 ? newBill.length - 1 : 0]);
                        }} className='text-4xl rounded-full text-rose-500 hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300' />
                    </div>
                    <hr />

                    <FunctionsPanel
                        customer={customer}
                        selected={'purchase'}
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

                        <div className='flex justify-around ml-auto hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300 text-rose-500 text-md font-bold w-full p-2'>
                            <div className='w-1/2 pr-1'>Total Cost:</div>
                            <div className='w-1/2 text-xl'>{total && total.totalcost}</div>
                        </div>


                    </div>
                    <div className='w-1/3 p-1'>



                        <div className='flex justify-around hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300 ml-auto text-green-500 font-bold text-md w-full p-2'>
                            <div className='w-1/2 pr-1'>Total Delivery + Cost</div>
                            <div className='w-1/2 text-xl'>{total && total.costexpense}</div>
                        </div>

                        <div className='flex justify-around hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300 ml-auto text-green-500 font-bold text-xl w-full p-2'>
                            <div className='w-1/2'>Total Sale Amount:</div>
                            <div className='w-1/2'>{total && total.totalamount}</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

    )
}

export default Page
