'use client'
import React, { use, useEffect, useMemo } from 'react'
import apiaddress from '@/apirequests/apiaddress';
import Image from 'next/image';
import { IoIosAddCircleOutline } from "react-icons/io";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { useState } from 'react';
import { useGlobalState } from '@/js/globaluser';
import { fetchShops } from '@/apirequests/getcustomersbyshopid';
import { useRef } from 'react';
import FunctionsPanel from '../FunctionsPanel'
import TopBar from '../TopBar'
import { fetchBillsx, createBill, deleteDocument } from '@/apirequests/functions'
import SelectCustomer from '../SelectCustomer'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Time from '../Time'
import { createDocumentItem, deleteDocumentItem, getDocumentItems, changeQtyOfItem } from '@/apirequests/functions';
import { MdReceipt } from "react-icons/md";
import Menu from '@/components/Menu'
import BillView from '@/components/BillView'
import LoginPage from "@/app/authentication/login/page";
import { fetchCustomers } from './functions';
import { handleSearchChange } from './functions';
import { fetchProducts } from './functions';
import { handleItemDiscount } from './functions';
import './xstyle.css'
const Page = () => {
    const [caller, setcaller] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const token = localStorage.getItem("token")
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());
    const { user } = useGlobalState()
    const [customersList, setCustomerList] = useState(undefined)
    const [customer, setCustomer] = useState(undefined)
    const [customerSelecting, setCustomerSelecting] = useState(false)
    const [shops, setShops] = useState([])
    const [selectedShop, setSelectedShop] = useState(undefined)
    const selectedShopRef = React.useRef(undefined)
    const [bills, setBills] = useState([])
    const [selectedBill, _setSelectedBill] = useState(undefined)
    const selectedBillRef = React.useRef(undefined)
    const setSelectedBill = (val) => { selectedBillRef.current = val; _setSelectedBill(val); }
    const [products, setProducts] = useState([])
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [itemsList, setitemsList] = useState([])
    const [selectedItem, setSelectedItem] = useState(undefined)
    const searchRef = useRef(null)
    const [searchType, setSearchType] = useState('barcode')
    const [openFinalize, setOpenFinalize] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [quantitySelecting, setQuantitySelecting] = useState(false)
    const [quantityChanging, setQuantityChanging] = useState(false)
    const quantityinput = useRef(null)
    const [iframeSrc, setIframeSrc] = useState("");
    const discRef = useRef(null)
    const [splitPayment, setSplitPayment] = useState(false)
    const paymentTypes = ['Debit', 'Cash', 'Easypaisa', 'Jazzcash', 'Upaisa', 'Meezan'];
    const [splitedPayments, setSplitedPayments] = useState([])
    const [discountAmount, setdiscountAmount] = useState(0)
    const [selectedShopToFinal, setSelectedShopToFinal] = useState(undefined)
    const [finalTotals, setFinalTotals] = useState(undefined)
    const [balanceTotal, setBalanceTotal] = useState({ list: [] });
    const updateBalanceTotal = async () => {
        const customerData = customer ? customer.ids : [];
        let finalTotals = [];

        // Iterate over all the items in the list
        for (let citem of itemsList) {
            let shopID = citem.product.shop;

            // Find the shop object from `shops` array using the shopID
            let shopObj = shops.find(shop => shop._id === shopID);

            if (!shopObj) {
                // If no matching shop is found, skip this item
                continue;
            }

            // Check if shop already exists in finalTotals
            let shop = finalTotals.find(s => s.shop._id === shopObj._id);

            if (!shop) {
                // Initialize the shop if not already present
                shop = {
                    shop: shopObj,  // Set shop as the full shop object
                    shopBill: 0,
                    shopItemsDiscount: 0,  // Sum of all item discounts
                    shopItems: 0,          // Count of items
                    shopCustomer: [],
                    shopPayments: [],
                    cartDiscount: 0,       // Initialize cart discount to 0
                    shopTotalAfterDiscount: 0,  // Will be calculated later
                    paidamount: 0
                };
                finalTotals.push(shop);
            }

            // Calculate discount per item and update the shop totals
            const itemDiscount = citem.discount.amount * citem.qty || 0;

            // Sum of saleAmount + itemDiscount (shopBill)
            shop.shopBill += citem.saleamount + itemDiscount;

            // Sum of itemDiscount (shopItemsDiscount)
            shop.shopItemsDiscount += itemDiscount;

            // Increment shopItems count
            shop.shopItems += 1;

            // Add customer to shop's customer list (match by shopID)
            const customer = customerData.find(cust => cust.customerID.linkedShop === shopObj._id);
            if (customer && !shop.shopCustomer.some(c => c.customerID === customer.customerID)) {
                shop.shopCustomer.push({
                    customerID: customer.customerID,
                    customerName: customer.customerName,
                    customerMobileNumber: customer.customerMobileNumber
                });
            }
        }

        // After finalTotals calculation, set total after discount as sum of saleAmount
        finalTotals = finalTotals.map(shop => {
            // Shop Total After Discount should just be the sum of saleAmount minus itemDiscount and cartDiscount
            shop.shopTotalAfterDiscount = shop.shopBill - shop.shopItemsDiscount - shop.cartDiscount;

            return shop;
        });
        setBalanceTotal(finalTotals);
    };
    const calculation = async () => {
        const customerData = customer ? customer.ids : [];
        let finalTotals = [];

        // Iterate over all the items in the list
        for (let citem of itemsList) {
            let shopID = citem.product.shop;

            // Find the shop object from `shops` array using the shopID
            let shopObj = shops.find(shop => shop._id === shopID);

            if (!shopObj) {
                // If no matching shop is found, skip this item
                continue;
            }

            // Check if shop already exists in finalTotals
            let shop = finalTotals.find(s => s.shop._id === shopObj._id);

            if (!shop) {
                // Initialize the shop if not already present
                shop = {
                    shop: shopObj,  // Set shop as the full shop object
                    shopBill: 0,
                    shopItemsDiscount: 0,  // Sum of all item discounts
                    shopItems: 0,          // Count of items
                    shopCustomer: [],
                    shopPayments: [],
                    cartDiscount: 0,       // Initialize cart discount to 0
                    shopTotalAfterDiscount: 0  // Will be calculated later
                };
                finalTotals.push(shop);
            }

            // Calculate discount per item and update the shop totals
            const itemDiscount = citem.discount.amount || 0;

            // Sum of saleAmount + itemDiscount (shopBill)
            shop.shopBill += citem.saleamount + itemDiscount;

            // Sum of itemDiscount (shopItemsDiscount)
            shop.shopItemsDiscount += itemDiscount;

            // Increment shopItems count
            shop.shopItems += 1;

            // Add customer to shop's customer list (match by shopID)
            const customer = customerData.find(cust => cust.customerID.linkedShop === shopObj._id);
            if (customer && !shop.shopCustomer.some(c => c.customerID === customer.customerID)) {
                shop.shopCustomer.push({
                    customerID: customer.customerID,
                    customerName: customer.customerName,
                    customerMobileNumber: customer.customerMobileNumber
                });
            }
        }

        // After finalTotals calculation, set total after discount as sum of saleAmount
        finalTotals = finalTotals.map(shop => {
            // Shop Total After Discount should just be the sum of saleAmount minus itemDiscount and cartDiscount
            shop.shopTotalAfterDiscount = shop.shopBill - shop.shopItemsDiscount - shop.cartDiscount;

            return shop;
        });

        return finalTotals;
    };
    const updateBalanceTotal2 = (updatedShop) => {
        setBalanceTotal((prevBalanceTotal) =>
            prevBalanceTotal.map((shop) =>
                shop.shop._id === updatedShop.shop._id ? updatedShop : shop
            )
        );
    };
    const total = useMemo(() => {
        let totalamount = 0;
        let totalexpense = 0;
        let totalcost = 0;
        let costexpense = 0;
        let discount = 0;
        let totalitems = itemsList.length;

        for (let x = 0; x < itemsList.length; x++) {
            let match = itemsList[x];
            totalamount += match.saleamount;
            totalcost += match.costamount;
            costexpense += match.sale * match.qty;
            discount += match.discount.amount * match.qty;
        }

        return {
            totalitems,
            totalamount: parseFloat(totalamount.toFixed(2)),
            totalexpense: parseFloat(totalexpense.toFixed(2)),
            totalcost: parseFloat(totalcost.toFixed(2)),
            costexpense: parseFloat(costexpense.toFixed(2)),
            discount: parseFloat(discount.toFixed(2)),
            billDiscount: discountAmount, // Assuming no calculation for billDiscount
        };
    }, [itemsList, splitedPayments, discountAmount]);

    const shopWiseTotal = useMemo(() => {
        let finalArray = [];
        if (shops && shops.length > 0) {

            for (let x in itemsList) {
                let currentItem = itemsList[x];
                
                let shopId = currentItem.product.shop.toString();
                let existingShop = finalArray.find(shop => shop.shopID.toString() === shopId);
               
                if (existingShop) {
                    existingShop.total += currentItem.saleamount;
                } else {
                    let shopName = shops.find(s => s._id.toString() === shopId);
                    shopName && finalArray.push({
                        shopID: shopId,
                        shopName: shopName.shopName,
                        total: currentItem.saleamount,
                        discount: document.getElementById(shopId) ? document.getElementById(shopId).value : 0
                    });
                }
            }
        }

        return finalArray;
    }, [itemsList, shops]);
    const handleBlur = () => {
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
        await handleEnterKey(
            e,
            {
                openFinalize,
                setOpenFinalize,
                setSearchType,
                searchRef,
                setCustomerSelecting,
                setQuantitySelecting,
                setQuantityChanging,
                quantityinput,
                selectedItem,
                suggestions, // Assuming suggestions are defined elsewhere
                deleteDocumentItem, // Assuming deleteDocumentItem is defined elsewhere
                getDocumentItems, // Assuming getDocumentItems is defined elsewhere
                setitemsList,
                selectedBill,
                handleEnter, // Assuming handleEnter is defined elsewhere
                handleFinalize, // Assuming handleFinalize is defined elsewhere
                splitedPayments,
                setSplitedPayments,
                total,
                customer, // Assuming customer is defined elsewhere
                splitPayment,
                setSplitPayment,
                fetchReceipt // Assuming fetchReceipt is defined elsewhere
            }
        );
    };
    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = date.getFullYear();

        return `${day}${month}${year}`;
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
            searchRef.current.focus()
        }
        const targetDiv = document.getElementById(`item${product.itemCode}`);
        if (targetDiv) {
            targetDiv.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
            itemsList.length > 0 && document.getElementById(`item${itemsList[itemsList.length - 1].product.itemCode}`).scrollIntoView({ behavior: "smooth", block: "center" });
        }

    };
    const linkCustomer = async (customer) => {
        const shop = selectedShopRef.current || selectedShop
        const customerId = customer._id || customer.id
        setCustomer(customer)
        let data = await fetch(apiaddress + '/pos/documents/linkcustomergroup', {
            method: "POST",
            headers: {
                'content-type': 'application/json',
                token
            },
            body: JSON.stringify({ id: selectedBill._id, customer: customerId })
        })
        let parsed = await data.json()
        if (parsed.success) {
            toast("Customer Selected")
            const billData = await fetchBillsx('sale', user._id, 'pending', shop._id, selectedDate);
            if (Array.isArray(billData)) {
                setBills(billData);
                let x = billData.filter(b => b._id === selectedBill._id)
                setSelectedBill(x[0]);
            }
        } else {
            toast.error("Backend Error linking customer")
        }
    }
    const unlinkCustomer = async (customer) => {
        const shop = selectedShopRef.current || selectedShop
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
            const newBills = await fetchBillsx('sale', user._id, 'pending', shop._id, selectedDate);
            if (Array.isArray(newBills)) {
                setBills(newBills)
                setSelectedBill(newBills.find(bil => bil._id === selectedBill._id))
            }
        } else {
            toast.error("Backend Error unlinking customer")
        }
    }
    const handleBillChange = (e) => {
        setSplitedPayments([])
        let id = e.target.value
        let b = bills.find(b => b._id === id)
        setSelectedBill(b)
        setCustomer(b.customerGroup ? customersList.find(c=> c._id.toString() === b.customerGroup._id.toString()) : undefined)
        getDocumentItems(b._id).then(data => {
            setitemsList(data)
        })
    }
    const deleteItem = async () => {
        if (selectedItem) {
            setSplitedPayments([])
            let data = await deleteDocumentItem(selectedItem._id)
            if (data.success) {
                toast("Item Deleted")
                let b = await getDocumentItems(selectedBill._id)
                setitemsList(b)
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
    const fetchReceipt = async () => {
        let finalObject = {
            user: user._id,
            currentTime,
            date: selectedDate,
            selectedBill,
            customerGroup: customer,
            finalTotals,
            balanceTotal,
        }
        const response = await fetch(apiaddress + "/print/sale/receipt", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                token
            },
            body: JSON.stringify(finalObject),
        });

        if (response.ok) {
            // Convert response to blob URL for iframe
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            setIframeSrc(blobUrl);

        } else {
            console.error("Failed to fetch receipt");
        }
    };
    const copyDiscount = async (method) => {
        const bill = selectedBillRef.current || selectedBill
        if (!bill || !bill.customerGroup) {
            toast.error("Please Select Customer First!")
            return
        }
        let data = await fetch(apiaddress + '/pos/copydiscount', {
            method: "POST",
            headers: {
                'content-type': 'application/json',
                token
            },
            body: JSON.stringify({ method, selecteddocument: bill._id })
        })
        let parsed = await data.json()
        if (parsed.success) {
            if (parsed.updated > 0) {
                toast("Discount Applied to " + parsed.updated + " item(s)")
                let newentries = await getDocumentItems(bill._id)
                setitemsList(newentries)
            } else {
                toast.error("No past purchase history found for this customer")
            }
        } else {
            toast.error("Database Error")
        }
    }
    const applyDiscount = async (item, type, amount) => {
        // Call the external function with necessary parameters
        await handleItemDiscount(
            item,
            type,
            amount,
            itemsList,
            setitemsList,
            selectedBill,
            apiaddress,
            getDocumentItems
        );
    };
    const handleBillAction = async (action) => {
        const shop = selectedShopRef.current || selectedShop
        if (isLoading || !shop) { toast.error("Please wait, loading..."); return; }
        let billData;

        if (action === 'create') {
            // Create Bill
            await createBill('sale', user._id, 'pending', shop._id, selectedDate, customer && customer);
            billData = await fetchBillsx('sale', user._id, 'pending', shop._id, selectedDate);
            setBills(billData);
            const newBill = billData[billData.length - 1];
            setSelectedBill(newBill);
            let newItems = await getDocumentItems(newBill._id);
            setitemsList(newItems);
            setCustomer(newBill.customer ? newBill.customer : undefined);
        } else if (action === 'delete') {
            // Delete Bill
            await deleteDocument(selectedBill._id, 'sale', user._id, 'pending', shop._id, formatDate(selectedDate));
            billData = await fetchBillsx('sale', user._id, 'pending', shop._id, selectedDate);

            if (billData.length > 0) {
                setBills(billData);
                setSelectedBill(billData[0]);
                let newItems = await getDocumentItems(billData[0]._id);
                setitemsList(newItems);
                setCustomer(billData[0].customerGroup ? billData[0].customerGroup : undefined);
            } else {
                const newBill = await createBill('sale', user._id, 'pending', shop._id, selectedDate);
                setBills(newBill);
                setSelectedBill(newBill[0]);
                let newItems = await getDocumentItems(newBill[0]._id);
                setitemsList(newItems);
                setCustomer(undefined);
            }
        }

        // Focus the search bar after operation
        await searchRef.current.focus();
    };
    const handleEnterKey = async (
        e,
        {
            openFinalize,
            setOpenFinalize,
            setSearchType,
            searchRef,
            setCustomerSelecting,
            setQuantitySelecting,
            setQuantityChanging,
            quantityinput,
            selectedItem,
            suggestions,
            deleteDocumentItem,
            getDocumentItems,
            setitemsList,
            selectedBill,
            handleEnter,
            handleFinalize,
            splitedPayments,
            setSplitedPayments,
            total,
            customer,
            splitPayment,
            setSplitPayment,
            fetchReceipt
        }
    ) => {
        if (e.key === "ArrowRight") {
            setOpenFinalize(true);
            if (openFinalize) {
                discRef.current.focus();
            }
        }

        if (e.key === "ArrowLeft") {
            setSearchType('barcode');
            searchRef.current.focus();
        }

        if (e.key === "ArrowDown") {
            !customerSelecting && setCustomerSelecting(true);
        }

        if (!openFinalize) {
            if (!quantitySelecting && !quantityChanging) {
                if (e.key === 'Enter') {
                    if (suggestions.length > 0) {
                        setSearchTerm('');
                        let selectedProduct = suggestions[0];
                        setSelectedItem(selectedProduct);
                        setQuantitySelecting(true);
                        quantityinput.current.value = '1';
                        document.getElementById('quantity').focus();
                        document.getElementById('quantity').select();
                    }
                } else if (e.key === 'Delete') {
                    if (selectedItem) {
                        let data = await deleteDocumentItem(selectedItem._id);
                        if (data.success) {
                            toast("Item Deleted");
                            let b = await getDocumentItems(selectedBill._id);
                            setitemsList(b);
                        } else {
                            toast.error("Server Error");
                        }
                    }
                } else if (e.key === 'Escape') {
                    searchRef.current.focus();
                    setSelectedItem(undefined);
                }
            } else if (quantityChanging) {
                if (e.key === 'Enter') {
                    setQuantityChanging(false);
                    setQuantitySelecting(false);

                    let data = await changeQtyOfItem(selectedItem, Number(quantityinput.current.value));
                    if (data.success) {
                        let n = await getDocumentItems(selectedBill._id);
                        setitemsList(n);
                        toast("Quantity Changed");
                    } else {
                        toast.error("Server Error");
                    }
                } else if (e.key === 'Escape') {
                    searchRef.current.focus();
                    setQuantityChanging(false);
                    setQuantitySelecting(false);
                }
            } else {
                if (e.key === 'Enter') {
                    handleEnter(selectedItem);
                    setQuantitySelecting(false);
                    quantityinput.current.value = '1';
                    searchRef.current.focus();
                } else if (e.key === 'Escape') {
                    setCustomerSelecting(false);
                    setQuantitySelecting(false);
                    quantityinput.current.value = '1';
                    searchRef.current.focus();
                }
            }
        } else {
            if (e.key === "c" || e.key === "C") {
                let n = splitedPayments.find(sp => sp.name === "Cash");
                let x = splitedPayments.filter(sp => sp.name !== "Cash");
                !n && setSplitedPayments([...splitedPayments, { name: "Cash", amount: total.costexpense - total.discount }]);
                n && setSplitedPayments(x);
            } else if (e.key === "d" || e.key === "D") {
                if (customer) {
                    let n = splitedPayments.find(sp => sp.name === "Debit");
                    let x = splitedPayments.filter(sp => sp.name !== "Debit");
                    !n && setSplitedPayments([...splitedPayments, { name: "Debit", amount: total.costexpense - total.discount }]);
                    n && setSplitedPayments(x);
                } else {
                    setCustomerSelecting(true);
                }
            } else if (e.key === "s" || e.key === "S") {
                setSplitPayment(true);
            } else if (e.key === "p" || e.key === "P") {
                fetchReceipt();
            } else if (e.key === "Enter" && !customerSelecting && !splitPayment) {
                handleFinalize();
            } else if (e.key === 'Escape') {
                if (splitPayment) {
                    setSplitPayment(false);
                    setCustomerSelecting(false);
                } else {
                    setOpenFinalize(false);
                    setCustomerSelecting(false);
                }
                searchRef.current.focus();
            }
        }
    };
    const handleFinalize = async () => {
        const shop = selectedShopRef.current || selectedShop
        if (isLoading || !shop) { toast.error("Please wait, loading..."); return; }
        if (isSaving) return
        let xsm = false
        for (let i of balanceTotal) {
            const totalAmount = i.shopPayments.reduce((sum, payment) => sum + payment.amount, 0);
            if (i.shopTotalAfterDiscount - i.cartDiscount === totalAmount) {
                xsm = true
            } else {
                xsm = false
            }
        }
        if (xsm) {
            let finalObject = {
                user: user._id,
                currentTime,
                date: selectedDate,
                selectedBill,
                customerGroup: customer,
                finalTotals,
                balanceTotal,
            }
            setSelectedShopToFinal(undefined)
            setIsSaving(true)
            let data
            try {
              data = await fetch(apiaddress + '/pos/finalize/finalizesale', {
                method: "POST",
                headers: {
                    'content-type': 'application/json',
                    token
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
                const billData = await fetchBillsx('sale', user._id, 'pending', shop._id, selectedDate);
                if (billData.length > 0) {
                    setBills(billData);
                    setSelectedBill(billData[0]);
                    let newlist = await getDocumentItems(billData[0]._id)
                    setitemsList(newlist)
                    setCustomer(billData[0].customerGroup ? billData[0].customerGroup : undefined)
                } else if (billData.length === 0) {
                    const newBill = await createBill('sale', user._id, 'pending', shop._id, selectedDate);
                    setBills(newBill);
                    setSelectedBill(newBill[0]);
                    let newlist = await getDocumentItems(newBill[0]._id)
                    setitemsList(newlist)
                }
                let customers = await fetchCustomers(token)
                setCustomerList(customers.data)
                const productData = await fetchProducts();
                setProducts(productData);
                searchRef.current.focus()
            } else {
                toast.error(parsed.message)
            }
            setIsSaving(false)
        } else {
            toast.error("The Paid Amount Should Be Equal To Total Bill Amount")
        }

    }

    useEffect(() => {
        if (user) {
            searchRef.current.focus()
            setSplitedPayments([])
        }
    }, [customer])
    useEffect(() => {
        let cancelled = false;
        const initializeData = async () => {
            if (!user || !user._id) {
                return;
            }
            if (!cancelled) setIsLoading(true);
            try {
                const shopData = await fetchShops();
                if (cancelled) return;
                if (!shopData || !Array.isArray(shopData) || shopData.length === 0) {
                    console.error("No shops returned from server"); if (!cancelled) setIsLoading(false); return;
                }
                setShops(shopData);
                setSelectedShop(shopData[0]);
                selectedShopRef.current = shopData[0];

                let customers = await fetchCustomers(token)
                if (cancelled) return;
                setCustomerList(customers.data)

                const billDataRaw = await fetchBillsx('sale', user._id, 'pending', shopData[0]._id, selectedDate);
                if (cancelled) return;
                const billData = Array.isArray(billDataRaw) ? billDataRaw : [];

                if (billData.length > 0) {
                    setBills(billData);
                    setSelectedBill(billData[0]);
                    let newlist = await getDocumentItems(billData[0]._id)
                    if (cancelled) return;
                    setitemsList(newlist)
                    setCustomer(billData[0].customerGroup ? customers.data.find(c => c._id === billData[0].customerGroup._id) : undefined)
                } else {
                    const newBill = await createBill('sale', user._id, 'pending', shopData[0]._id, selectedDate);
                    if (cancelled) return;
                    const newBillArr = Array.isArray(newBill) ? newBill : [];
                    if (newBillArr.length > 0) {
                        setBills(newBillArr);
                        setSelectedBill(newBillArr[0]);
                        let newlist = await getDocumentItems(newBillArr[0]._id)
                        if (cancelled) return;
                        setitemsList(newlist)
                    }
                }
                const productData = await fetchProducts();
                if (cancelled) return;
                setProducts(productData);

            } catch (error) {
                console.error("Error initializing data:", error);
            }
            if (!cancelled) setIsLoading(false);
        };

        initializeData();

        // Register event listener and cleanup on unmount
        document.addEventListener('keydown', enter);
        return () => {
            cancelled = true;
            document.removeEventListener('keydown', enter);
        };

        // Adding dependencies
    }, [selectedDate, user]);
    useEffect(() => {
        calculation().then(e => {
            setFinalTotals(e);
        })
    }, [itemsList, total])
    useEffect(() => {
        updateBalanceTotal()
        setSelectedShopToFinal(undefined)
    }, [itemsList, total])

    if (user && user.permissions.includes("sale")) {
        return (
            <Menu >
                <div className='z-999999'>
                    <ToastContainer autoClose={2000} />
                </div>
                <div onKeyDown={enter}>

                    {customerSelecting && <SelectCustomer customersList={customersList} setCustomer={linkCustomer} setCustomerSelecting={setCustomerSelecting} />}

                    <BillView iframeSrc={iframeSrc} />
                    {openFinalize &&
                        <div className='fixed top-0 left-0 w-full min-h-screen overflow-scroll bg-boxdark z-999999 p-4'>

                            <button className='absolute top-5 right-5 rounded-md bg-rose-600 text-white font-bold px-3 py-2 text-lg' onClick={() => { setOpenFinalize(false) }}>Close</button>


                            <div className={'flex w-full h-screen items-center space-x-3 justify-center'}>
                                {customerSelecting && <SelectCustomer customersList={customersList} setCustomer={linkCustomer} setCustomerSelecting={setCustomerSelecting} />}

                                <div className="w-8/12 min-h-72 border bg-gray-800 text-white rounded-lg p-4">
                                    <p className='text-xl p-2'>Customer : {customer ? customer.customerName : "No Customer Selected"}</p>

                                    <div className="overflow-x-auto">
                                        {finalTotals && finalTotals.length > 0 && (
                                            <table className="min-w-full table-auto border-collapse scale-90">
                                                <thead>
                                                    <tr className="bg-blue-600">
                                                        <th className="p-1 text-left">Attribute</th>
                                                        {balanceTotal.map((l, key) => (
                                                            <th
                                                                key={l.shop._id}
                                                                className={`p-1 text-left ${selectedShopToFinal?.shop._id === l.shop._id ? "bg-green-600" : ""} ${l.shopBill !== l.paidamount && l.paidamount !== 0 && "bg-rose-600"}`}
                                                                onClick={() => setSelectedShopToFinal(l)}
                                                            >
                                                                {l.shop.shopName}
                                                            </th>
                                                        ))}
                                                        <th className="p-1 text-left">Total</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {/* Shop Name Row */}
                                                    <tr className="bg-gray-700">
                                                        <td className="p-1">Shop Name</td>
                                                        {balanceTotal.map((l, key) => (
                                                            <td onClick={() => { setSelectedShopToFinal(l) }} key={key} className="p-1 border border-gray-500">
                                                                {l.shop.shopName}
                                                            </td>
                                                        ))}
                                                        <td className="p-1">-</td>
                                                    </tr>

                                                    {/* Shop Subtotal Row */}
                                                    <tr className="bg-gray-800">
                                                        <td className="p-1">Shop Subtotal</td>
                                                        {balanceTotal.map((l, key) => (
                                                            <td onClick={() => { setSelectedShopToFinal(l) }} key={key} className="p-1 border border-gray-500">
                                                                {l.shopBill || 0}
                                                            </td>
                                                        ))}
                                                        <td className="p-1">
                                                            {balanceTotal.reduce((total, l) => total + (l.shopBill || 0), 0)}
                                                        </td>
                                                    </tr>

                                                    {/* Shop Items Discount Row */}
                                                    <tr className="bg-gray-700">
                                                        <td onClick={() => { setSelectedShopToFinal(l) }} className="p-1">Shop Items Discount</td>
                                                        {balanceTotal.map((l, key) => (
                                                            <td onClick={() => { setSelectedShopToFinal(l) }} key={key} className="p-1 border border-gray-500">
                                                                {l.shopItemsDiscount || 0}
                                                            </td>
                                                        ))}
                                                        <td className="p-1">
                                                            {balanceTotal.reduce((total, l) => total + (l.shopItemsDiscount || 0), 0)}
                                                        </td>
                                                    </tr>

                                                    <tr className="bg-gray-700">
                                                        <td className="p-1">Subtotal</td>
                                                        {balanceTotal.map((l, key) => (
                                                            <td onClick={() => { setSelectedShopToFinal(l) }} key={key} className="p-1 border border-gray-500">
                                                                {l.shopTotalAfterDiscount || 0}
                                                            </td>
                                                        ))}
                                                        <td className="p-1">
                                                            {balanceTotal.reduce((total, l) => total + (l.shopTotalAfterDiscount || 0), 0)}
                                                        </td>
                                                    </tr>

                                                    {/* Cart Discount Row */}
                                                    <tr className="bg-gray-700">
                                                        <td className="p-1">Cart Discount</td>
                                                        {balanceTotal.map((l, key) => (
                                                            <td key={key} className="p-1 border border-gray-500">
                                                                <input
                                                                    onClick={() => { setSelectedShopToFinal(l) }}
                                                                    type="number"
                                                                    className="py-3 bg-transparent px-2"
                                                                    value={l.cartDiscount || ""}
                                                                    onChange={(e) => {
                                                                        const updatedList = balanceTotal.map((item) =>
                                                                            item.shop._id === l.shop._id
                                                                                ? {
                                                                                    ...item,
                                                                                    cartDiscount: parseFloat(e.target.value) || 0,
                                                                                }
                                                                                : item
                                                                        );
                                                                        setBalanceTotal(updatedList);

                                                                        setSelectedShopToFinal(undefined)
                                                                    }}
                                                                />
                                                            </td>
                                                        ))}
                                                        <td className="p-1">
                                                            {balanceTotal.reduce((total, l) => total + (l.cartDiscount || 0), 0)}
                                                        </td>
                                                    </tr>

                                                    {/* Total After Discount Row */}
                                                    <tr className="bg-gray-800">
                                                        <td className="p-1">Total After Discount</td>
                                                        {balanceTotal.map((l, key) => {
                                                            const totalAfterDiscount = l.shopTotalAfterDiscount - l.cartDiscount;
                                                            return (
                                                                <td onClick={() => { setSelectedShopToFinal(l) }} key={key} className="p-1 border border-gray-500">
                                                                    {totalAfterDiscount || 0}
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="p-1">
                                                            {balanceTotal.reduce(
                                                                (total, l) => total + (l.shopTotalAfterDiscount - l.cartDiscount || 0),
                                                                0
                                                            )}
                                                        </td>
                                                    </tr>

                                                    {/* Amount Paid Row */}
                                                    <tr className="bg-gray-700">
                                                        <td className="p-1">Amount Paid</td>
                                                        {balanceTotal.map((l, key) => {
                                                            const amountPaid =
                                                                Array.isArray(l.shopPayments) && l.shopPayments.length > 0
                                                                    ? l.shopPayments.reduce(
                                                                        (total, payment) => total + (payment.amount || 0),
                                                                        0
                                                                    )
                                                                    : 0;
                                                            return (
                                                                <td onClick={() => { setSelectedShopToFinal(l) }} key={key} className="p-1 border border-gray-500">
                                                                    {amountPaid}
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="p-1">
                                                            {balanceTotal.reduce(
                                                                (total, l) =>
                                                                    total +
                                                                    (l.shopPayments.reduce(
                                                                        (paymentTotal, p) => paymentTotal + (p.amount || 0),
                                                                        0
                                                                    ) || 0),
                                                                0
                                                            )}
                                                        </td>
                                                    </tr>


                                                    <tr className="bg-gray-800">
                                                        <td className="p-1">Customer Previous Balance</td>
                                                        {balanceTotal.map((l, key) => (
                                                            <td onClick={() => { setSelectedShopToFinal(l) }} key={key} className="p-1 border border-gray-500">
                                                                {l.shopCustomer.length > 0 && l.shopCustomer[0].customerID.balance || 0}
                                                            </td>
                                                        ))}
                                                        <td className="p-1">
                                                            {balanceTotal.reduce((total, l) => total + (l.shopCustomer.length > 0 && l.shopCustomer[0].customerID.balance || 0), 0)}
                                                        </td>
                                                    </tr>
                                                    <tr className="bg-gray-700">
                                                        <td className="p-1">Customer New Balance</td>
                                                        {balanceTotal.map((l, key) => {
                                                            // Add Debit payments to new balance
                                                            const totalDebitPayment = l.shopPayments.reduce(
                                                                (sum, payment) => (payment.name === "Debit" ? sum + payment.amount : sum),
                                                                0
                                                            );
                                                            const newBalance = l.shopCustomer.length > 0 && l.shopCustomer[0].customerID.balance + totalDebitPayment;
                                                            return (
                                                                <td onClick={() => { setSelectedShopToFinal(l) }} key={key} className="p-1 border border-gray-500">
                                                                    {newBalance || 0}
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="p-1">
                                                            {balanceTotal.reduce(
                                                                (total, l) => total + (l.shopCustomer.length > 0 && l.shopCustomer[0].customerID.balance + l.shopPayments.reduce(
                                                                    (sum, payment) => (payment.name === "Debit" ? sum + payment.amount : sum),
                                                                    0
                                                                )),
                                                                0
                                                            )}
                                                        </td>
                                                    </tr>

                                                </tbody>
                                            </table>
                                        )}
                                    </div>

                                </div>
                                <div className='w-4/12 min-h-72 scale-75'>

                                    <div className="flex">
                                        <h3 className='text-xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>Total</h3>
                                        <h3 className='text-xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>
                                            {selectedShopToFinal && selectedShopToFinal.shopTotalAfterDiscount - selectedShopToFinal.cartDiscount || 0}
                                        </h3>
                                    </div>
                                    {selectedShopToFinal &&
                                        selectedShopToFinal.shopPayments.map((payment, index) => (
                                            <div key={index} className="mb-4">
                                                <div className="flex text-green-600">
                                                    <h3 className="text-xl font-bold border-b-2 mb-2 p-2 border-blue-600 w-1/2">
                                                        {payment.name}
                                                    </h3>
                                                    <input
                                                        type="text"
                                                        className="text-xl bg-transparent outline-none font-bold border-b-2 mb-2 p-2 border-blue-600 w-1/2"
                                                        value={payment.amount}
                                                        onChange={(e) => {
                                                            const updatedPayments = [...selectedShopToFinal.shopPayments];
                                                            const newAmount = Number(e.target.value);

                                                            if (!isNaN(newAmount)) {
                                                                // Update the specific payment amount
                                                                updatedPayments[index] = { ...payment, amount: newAmount };

                                                                // Calculate the new paid amount by summing up all payment amounts
                                                                const newPaidAmount = updatedPayments.reduce(
                                                                    (total, payment) => total + payment.amount,
                                                                    0
                                                                );

                                                                // Create a new updated shop object
                                                                const updatedShop = {
                                                                    ...selectedShopToFinal,
                                                                    shopPayments: updatedPayments,
                                                                    paidamount: newPaidAmount,
                                                                };

                                                                // Update the selectedShopToFinal state
                                                                setSelectedShopToFinal(updatedShop);

                                                                // Update the balanceTotal array
                                                                updateBalanceTotal2(updatedShop);

                                                            }
                                                        }}
                                                    />
                                                </div>
                                                {payment.name === "Debit" && (
                                                    <div className="ml-4 space-y-2">
                                                        <div className="flex items-center text-white">
                                                            <label className="text-sm w-1/2">Days to Clear:</label>
                                                            <input
                                                                type="number"
                                                                className="text-sm bg-boxdark border border-blue-600 outline-none p-2 rounded w-1/2"
                                                                placeholder="Enter days"
                                                                value={payment.daysToClear || ""}
                                                                onChange={(e) => {
                                                                    const updatedPayments = [...selectedShopToFinal.shopPayments];
                                                                    updatedPayments[index] = { 
                                                                        ...payment, 
                                                                        daysToClear: Number(e.target.value) || 0 
                                                                    };

                                                                    const updatedShop = {
                                                                        ...selectedShopToFinal,
                                                                        shopPayments: updatedPayments,
                                                                    };

                                                                    setSelectedShopToFinal(updatedShop);
                                                                    updateBalanceTotal2(updatedShop);
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex items-center text-white">
                                                            <label className="text-sm w-1/2">Remarks (Optional):</label>
                                                            <input
                                                                type="text"
                                                                className="text-sm bg-boxdark border border-blue-600 outline-none p-2 rounded w-1/2"
                                                                placeholder="Add remarks"
                                                                value={payment.remarks || ""}
                                                                onChange={(e) => {
                                                                    const updatedPayments = [...selectedShopToFinal.shopPayments];
                                                                    updatedPayments[index] = { 
                                                                        ...payment, 
                                                                        remarks: e.target.value 
                                                                    };

                                                                    const updatedShop = {
                                                                        ...selectedShopToFinal,
                                                                        shopPayments: updatedPayments,
                                                                    };

                                                                    setSelectedShopToFinal(updatedShop);
                                                                    updateBalanceTotal2(updatedShop);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    <div className="flex">
                                        <h3 className='text-xl font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>Total Paid Amount</h3>
                                        <p className='text-xl bg-transparent outline-none font-bold text-white border-b-2 mb-2 p-2 border-blue-600 w-1/2'>{selectedShopToFinal && selectedShopToFinal.shopTotalAfterDiscount - selectedShopToFinal.cartDiscount}</p>
                                    </div>

                                    <div className="w-full flex my-5 justify-between space-x-3">
                                        {selectedShopToFinal &&
                                            paymentTypes.map((paymentType, index) => {
                                                const isSelected = selectedShopToFinal.shopPayments.some(
                                                    (payment) => payment.name === paymentType
                                                );

                                                const handleButtonClick = () => {
                                                    // Check if there are no customers in the selected shop
                                                    if (paymentType === "Debit" && selectedShopToFinal.shopCustomer.length === 0) {
                                                        // Show a toast error if no customer is selected and Debit is clicked
                                                        toast.error("Customer not selected. Please select a customer before adding a debit payment.");
                                                        return; // Prevent adding payment if no customer is selected
                                                    }

                                                    const updatedPayments = [...selectedShopToFinal.shopPayments];

                                                    if (isSelected) {
                                                        // Remove the payment type if it already exists
                                                        const filteredPayments = updatedPayments.filter(
                                                            (payment) => payment.name !== paymentType
                                                        );
                                                        const updatedShop = {
                                                            ...selectedShopToFinal,
                                                            shopPayments: filteredPayments,
                                                        };
                                                        setSelectedShopToFinal(updatedShop);
                                                        updateBalanceTotal(updatedShop);
                                                    } else {
                                                        // Add the payment type
                                                        if (updatedPayments.length === 0) {
                                                            // If no payments exist, set this type with the full amount
                                                            updatedPayments.push({
                                                                name: paymentType,
                                                                amount:
                                                                    selectedShopToFinal.shopTotalAfterDiscount -
                                                                    selectedShopToFinal.cartDiscount,
                                                            });
                                                        } else {
                                                            // Otherwise, add the new payment type with a default amount of 0
                                                            updatedPayments.push({ name: paymentType, amount: 0 });
                                                        }
                                                        const updatedShop = {
                                                            ...selectedShopToFinal,
                                                            shopPayments: updatedPayments,
                                                        };
                                                        setSelectedShopToFinal(updatedShop);
                                                        updateBalanceTotal(updatedShop);
                                                    }
                                                };

                                                // Function to update balanceTotal array
                                                const updateBalanceTotal = (updatedShop) => {
                                                    setBalanceTotal((prevBalanceTotal) =>
                                                        prevBalanceTotal.map((shop) =>
                                                            shop.shop._id === updatedShop.shop._id ? updatedShop : shop
                                                        )
                                                    );
                                                };

                                                return (
                                                    <button
                                                        key={index}
                                                        onClick={handleButtonClick}
                                                        className={`text-md text-white p-1 w-2/12 rounded-md bg-boxdark border-2 border-blue-600 hover:bg-blue-600 ${isSelected ? "bg-green-600" : ""}`}
                                                    >
                                                        {paymentType}
                                                    </button>
                                                );
                                            })}

                                    </div>




                                    <div className='w-full flex space-x-8 justify-between'>

                                        <button className='w-6/12 p-3 my-5 rounded-md hover:scale-110 bg-blue-600 text-white font-bold text-xl px-8 flex justify-between items-center' onClick={fetchReceipt}><MdReceipt className='text-2xl text-white' />Print (p)</button>
                                        <button className={`w-6/12 p-3 my-5 rounded-md bg-green-600 text-white font-bold text-xl ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`} onClick={handleFinalize} disabled={isSaving}>{isSaving ? 'Processing...' : 'Process (enter)'}</button>
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
                    <TopBar searchTerm={searchTerm} searchType={searchType} setSearchType={setSearchType} handleSearchChange={(e) => { handleSearchChange(e, searchType, setSearchTerm, setSuggestions, products); }} products={products} suggestions={suggestions} setSuggestions={setSuggestions} handleEnter={handleEnter} helper={helper} handleBlur={handleBlur} searchRef={searchRef} />
                    <div className='w-full flex min-h-screen'>
                        <div className='w-9/12 pt-12 pb-36 text-sm min-h-screen bg-black font-bold'>
                            <div className='flex w-full sticky top-12 bg-black border-blue-600 border-b-2'>
                                <div className='w-1/12 p-2 text-center text-white'>Item Code</div>
                                <div className='w-1/12 p-2 text-center text-white'>Image</div>
                                <div className='w-3/12 p-2 text-white'>Item Name</div>
                                <div className='w-1/12 p-2 text-center text-white'>Qty/Pack</div>
                                <div className='w-1/12 p-2 text-center text-white'>Quantity</div>
                                <div className='w-1/12 p-2 text-center text-white'>Sale Price</div>
                                <div className='w-1/12 p-2 text-center text-white'>Discount Amount</div>
                                <div className='w-1/12 p-2 text-center text-white'>Discount Percentage</div>
                                <div className='w-1/12 p-2 text-center text-white'>Final Price</div>
                                <div className='w-1/12 p-2 text-center text-white'>Total Sale</div>

                            </div>

                            {itemsList && itemsList.length > 0 && itemsList.map((item, key) => (
                                <div key={key} id={`item${item.productData.itemCode}`} onClick={(e) => { itemClick(item._id) }} className={`flex w-full ${item.discount.amount !== 0 && 'bg-green-700'} ${item.costExpense > (item.sale - item.discount.amount) && 'bg-rose-600'} ${item.costExpense === (item.sale - item.discount.amount) && 'bg-orange-600'} items-center border-blue-600 ${selectedItem && selectedItem._id === item._id && 'bg-blue-600'} border-dotted border-b-2`}>
                                    <div className="w-1/12 p-2 text-center text-white">{item.productData.itemCode}</div>
                                    <div className="w-1/12 p-2 text-center text-white">
                                        <Image
                                            height={70}
                                            width={70}
                                            className="mx-auto hover:scale-150"
                                            alt="Product"
                                            src={`${apiaddress}${item.productData.picture?.[0] || '/images/products/default.png'}`}
                                        />
                                    </div>
                                    <div className="w-3/12 p-2 text-white">{item.productData.name}</div>
                                    <div className="w-1/12 p-2 text-center text-white">{item.productData.unit}</div>
                                    <div className="w-1/12 p-2 text-center text-white">{item.qty}</div>
                                    <div className="w-1/12 p-2 text-center text-white">{item.sale}</div>
                                    <input onChange={(e) => { (applyDiscount(item, 'amount', e.target.value)) }} className="w-1/12 bg-transparent p-2 text-center text-white" value={parseFloat(item.discount.amount.toFixed(2))} disabled={item.ispricechangeallowed} />
                                    <input onChange={(e) => { (applyDiscount(item, 'percentage', e.target.value)) }} className="w-1/12 p-2 bg-transparent text-center text-white" value={parseFloat(item.discount.percentage.toFixed(2))} disabled={item.ispricechangeallowed} />
                                    <div className="w-1/12 p-2 text-center text-white">{item.finalprice}</div>
                                    <div className="w-1/12 p-2 text-center text-white">{item.saleamount}</div>
                                </div>
                            ))}
                        </div>
                        <div className='w-3/12 fixed right-0 min-h-screen bg-boxdark max-h-screen shadow-lg border-l-2 border-slate-500'>

                            <div className='w-full mx-auto flex justify-center items-center text-center'>
                                <IoIosAddCircleOutline
                                    onClick={async () => await handleBillAction('create')}
                                    className={`text-4xl rounded-full transition-shadow duration-300 ${isLoading ? 'text-gray-500 cursor-not-allowed' : 'text-green-500 hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)]'}`}
                                />
                                {isLoading
                                    ? <div className='w-7/12 p-3 text-yellow-400 text-sm text-center m-3 border-slate-500 border-2'>Loading...</div>
                                    : <select
                                        value={selectedBill && selectedBill._id}
                                        onChange={handleBillChange}
                                        className='w-7/12 p-3 text-green-400 text-lg bg-transparent outline-1 outline-slate-500 m-3 border-slate-500 border-2 hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300'
                                        name="a" id="a"
                                    >
                                        {bills && bills.length > 0 && bills.map((bi, num) => (
                                            <option key={bi._id} value={bi._id}>{bi.customer && bi.customer.customerName ? bi.customer.customerName : 'No Name ' + num}</option>
                                        ))}
                                    </select>
                                }

                                <MdOutlineDeleteOutline
                                    onClick={async () => await handleBillAction('delete')}
                                    className={`text-4xl rounded-full transition-shadow duration-300 ${isLoading ? 'text-gray-500 cursor-not-allowed' : 'text-rose-500 hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)]'}`}
                                />
                            </div>

                            <hr />

                            <FunctionsPanel
                                customer={customer}
                                selected={'sale'}
                                setCustomerSelecting={setCustomerSelecting}
                                clearCustomer={unlinkCustomer}
                                deleteItem={deleteItem}
                                changeQty={changeQty}
                                openFinalize={setOpenFinalize}
                                discref={discRef}
                                copyDiscount={copyDiscount}
                            />
                        </div>
                        <div className='w-9/12 flex fixed text-md justify-between items-center bg-boxdark bottom-0 left-0 text-white border-slate-500 border-t-2 h-36'>
                            <div className="w-1/3">
                                <Time user={user} selectedDate={selectedDate} setSelectedDate={setSelectedDate} currentTime={currentTime} setCurrentTime={setCurrentTime} />
                            </div>

                            <div className='w-1/3 p-1'>
                                {shopWiseTotal && shopWiseTotal.map((d, key) => (
                                    <div key={key} className='flex justify-around hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300 ml-auto text-green-500 font-bold text-md w-full p-1'>
                                        <div className='w-1/2'>{d.shopName}</div>
                                        <div className='w-1/2'>{d.total}</div>
                                    </div>
                                ))}
                            </div>

                            <div className='w-1/3 p-1'>

                                <div className='flex justify-around hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300 ml-auto text-green-500 font-bold text-sm w-full p-1'>
                                    <div className='w-1/2'>Total Items</div>
                                    <div className='w-1/2'>{total && total.totalitems}</div>
                                </div>

                                <div className='flex justify-around hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300 ml-auto text-green-500 font-bold text-sm w-full p-1'>
                                    <div className='w-1/2 pr-1'>Subtotal</div>
                                    <div className='w-1/2'>{total && total.costexpense}</div>
                                </div>
                                <div className='flex justify-around hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300 ml-auto text-green-500 font-bold text-sm w-full p-1'>
                                    <div className='w-1/2 pr-1'>Items Discount</div>
                                    <div className='w-1/2'>{total && total.discount}</div>
                                </div>
                                <div className='flex justify-around hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300 ml-auto text-green-500 font-bold text-xl w-full p-1'>
                                    <div className='w-1/2'>Total</div>
                                    <div className='w-1/2'>{total && total.totalamount}</div>
                                </div>
                            </div>

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