"use client"
import React, { useEffect } from 'react'
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Switcherx from '@/components/Switchers/Switcherx';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { useState } from 'react';
import Searchoption from '@/js/Searchoption'
import apiaddress from '@/apirequests/apiaddress';
import { fetchShops } from "@/apirequests/getcustomersbyshopid"; // Adjust this based on your actual file structure
import { useGlobalState } from '@/js/globaluser';
import { ToastContainer, toast ,Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useParams } from 'next/navigation';
import Menu from '@/components/Menu'
import LoginPage from "@/app/authentication/login/page";

const Page = () => {
  const params = useParams()
  const {id} = params
  const { user } = useGlobalState();
  const [shops, setShops] = useState(undefined);
  const [categories, setCategories] = useState(undefined);
  const [supliersList, setSupliersList] = useState([]);
  const [selectedShop, setSelectedShop] = useState(undefined);
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [code, setCode] = useState(0);
  const [barcode, setBarcode] = useState(0);
  const [suplier, setSuplier] = useState('');
  const [cost, setCost] = useState('');
  const [deliveryExpense, setDeliverExpense] = useState('');
  const [costPlusDelivery, setCostPlusDelivery] = useState('')
  const [doesCostIncludesDeliveryExpense, setDoesCostIncludesDeliveryExpense] = useState(true);
  const [markup, setMarkup] = useState({ amount: '', percentage: '' });
  const [priceWithMarkup, setPriceWithMarkup] = useState('');
  const [tax, setTax] = useState({ amount: 0, percentage: 0 });
  const [priceWithTax, setPriceWithTax] = useState(0);
  const [doesSaleIncludeTax, setDoesSaleIncludeTax] = useState(true);
  const [sale, setSale] = useState('')
  const [qtyPerPiece,setQtyPerPiece] = useState('')
  const [description,setDescription] = useState('')
  const [priceChangeAllowed, setPriceChangeAllowed] = useState(true);
  const [isService, setIsService] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [productx,setproduct] = useState()
  const [reorder,setReorder] = useState('1')
  const [pointforcost, setpointforcost] = useState(false);
  const [pointforsale, setpointforsale] = useState(false);
  const prefetch = async()=>{
    let data = await fetch(apiaddress+'/management/products/getproductbyid',{
      method:"GET",
      headers:{
        'id':id
      }
    })
    let parsed = await data.json()
    return parsed
  }


  const sanitizeDecimalInput = (value, isCostField = true) => {
    // If the input is empty, keep the state as false
    if (value === "") {
      if (isCostField) setpointforcost(false);
      else setpointforsale(false);
      return value;
    }

    // This regex allows:
    // - One or more digits before the decimal point
    // - An optional decimal point
    // - Up to two digits after the decimal point
    const regex = /^[0-9]*\.?[0-9]{0,2}$/;

    // If the input matches the regex, we check if it's a decimal point
    if (regex.test(value)) {
      // If a decimal point is detected and it's the first time, set pointforcost/pointforsale to true
      if (value.includes(".") && !value.endsWith(".")) {
        if (isCostField) setpointforcost(false); // Reset point when digits after decimal are added
        else setpointforsale(false);
      } else if (value.endsWith(".")) {
        if (isCostField) setpointforcost(true); // Set point when decimal point is entered
        else setpointforsale(true);
      }
      return value;
    }

    // If the value doesn't match, remove the last character
    return value.slice(0, -1);
  };
  const handlechange = async (e) => {
    e.preventDefault();
    let value = e.target.value;
    const id = e.target.id;

    const roundToTwoDecimals = (num) => Math.round(num * 100) / 100;

    const recalculateValues = (updatedCost, updatedDelivery, includeDelivery) => {
      const costPlusDeliveryValue = includeDelivery
        ? roundToTwoDecimals(Number(updatedCost) + Number(updatedDelivery))
        : roundToTwoDecimals(Number(updatedCost));

      setCostPlusDelivery(costPlusDeliveryValue);

      let priceWithMarkupValue = costPlusDeliveryValue;
      if (markup.amount) {
        const percentage = roundToTwoDecimals((Number(markup.amount) * 100) / costPlusDeliveryValue);
        setMarkup((prevMarkup) => ({ ...prevMarkup, percentage }));
        priceWithMarkupValue = roundToTwoDecimals((1 + percentage / 100) * costPlusDeliveryValue);
      } else if (markup.percentage) {
        const amount = roundToTwoDecimals((costPlusDeliveryValue * markup.percentage) / 100);
        setMarkup((prevMarkup) => ({ ...prevMarkup, amount }));
        priceWithMarkupValue = roundToTwoDecimals((1 + markup.percentage / 100) * costPlusDeliveryValue);
      }
      setPriceWithMarkup(priceWithMarkupValue);

      recalculateTax(priceWithMarkupValue);
    };

    const recalculateTax = (priceWithMarkupValue) => {
      let priceWithTaxValue = priceWithMarkupValue;
      if (!doesSaleIncludeTax) {
        if (tax.amount) {
          const taxPercentage = roundToTwoDecimals((tax.amount * 100) / priceWithMarkupValue);
          setTax((prevTax) => ({ ...prevTax, percentage: taxPercentage }));
          priceWithTaxValue = roundToTwoDecimals((1 + taxPercentage / 100) * priceWithMarkupValue);
        } else if (tax.percentage) {
          const taxAmount = roundToTwoDecimals((priceWithMarkupValue * tax.percentage) / 100);
          setTax((prevTax) => ({ ...prevTax, amount: taxAmount }));
          priceWithTaxValue = roundToTwoDecimals((1 + tax.percentage / 100) * priceWithMarkupValue);
        }
      }
      setPriceWithTax(priceWithTaxValue);
      setSale(priceWithTaxValue);
    };

    // Input change handling based on ID
    if (id === 'costprice') {
      let cost;
      if (value[value.length - 1] === '.') {
        cost = value.slice(0, -1)
        setpointforcost(true)
      } else {
        cost = value
        setpointforcost(false)
      }
      if (pointforcost) {
        cost = `${cost.slice(0, -1)}.${cost[cost.length - 1]}`
      }

      const costValue = parseFloat(cost);
      if (!isNaN(costValue)) {
        setCost(costValue);
        recalculateValues(costValue, deliveryExpense, doesCostIncludesDeliveryExpense);
      } else {
        setCost('');
        setCostPlusDelivery('');
      }
    } else if (id === 'deliveryexpense') {

      let sale;
      if (value[value.length - 1] === '.') {
        sale = value.slice(0, -1);  // Remove the decimal point temporarily
        setpointforsale(true);       // Set pointforsale to true
      } else {
        sale = value;
        setpointforsale(false);      // Reset pointforsale if there's no decimal point
      }
      if (pointforsale) {
        sale = `${sale.slice(0, -1)}.${sale[sale.length - 1]}`;
      }
      value = parseFloat(sale);

      // value = sanitizeDecimalInput(value, false); // Sanitize input for sale
      const deliveryValue = parseFloat(value);
      if (!isNaN(deliveryValue)) {
        setDeliverExpense(deliveryValue);
        recalculateValues(cost, deliveryValue, doesCostIncludesDeliveryExpense);
      }
    } else if (id === 'doesCostIncludesDeliveryExpense') {
      const checked = e.target.checked;
      setDoesCostIncludesDeliveryExpense(checked);
      recalculateValues(cost, deliveryExpense, checked);
    } else if (id === 'markupamount') {
      value = sanitizeDecimalInput(value, true); // Sanitize input for cost
      const markupAmount = parseFloat(value);
      if (!isNaN(markupAmount)) {
        const percentage = roundToTwoDecimals((markupAmount * 100) / costPlusDelivery);
        setMarkup({ amount: markupAmount, percentage });
        const priceWithMarkupValue = roundToTwoDecimals((1 + percentage / 100) * costPlusDelivery);
        setPriceWithMarkup(priceWithMarkupValue);
        recalculateTax(priceWithMarkupValue);
      }
    } else if (id === 'markuppercentage') {
      value = sanitizeDecimalInput(value, true); // Sanitize input for cost
      const markupPercentage = parseFloat(value);
      if (!isNaN(markupPercentage)) {
        const amount = roundToTwoDecimals((costPlusDelivery * markupPercentage) / 100);
        setMarkup({ percentage: markupPercentage, amount });
        const priceWithMarkupValue = roundToTwoDecimals((1 + markupPercentage / 100) * costPlusDelivery);
        setPriceWithMarkup(priceWithMarkupValue);
        recalculateTax(priceWithMarkupValue);
      }
    } else if (id === 'taxamount') {
      value = sanitizeDecimalInput(value, false); // Sanitize input for sale
      const taxAmount = parseFloat(value);
      if (!isNaN(taxAmount)) {
        const taxPercentage = roundToTwoDecimals((taxAmount * 100) / priceWithMarkup);
        setTax({ amount: taxAmount, percentage: taxPercentage });
        const priceWithTaxValue = roundToTwoDecimals((1 + taxPercentage / 100) * priceWithMarkup);
        setPriceWithTax(priceWithTaxValue);
        setSale(priceWithTaxValue);
      }
    } else if (id === 'taxpercentage') {
      value = sanitizeDecimalInput(value, false); // Sanitize input for sale
      const taxPercentage = parseFloat(value);
      if (!isNaN(taxPercentage)) {
        const taxAmount = roundToTwoDecimals((priceWithMarkup * taxPercentage) / 100);
        setTax({ percentage: taxPercentage, amount: taxAmount });
        const priceWithTaxValue = roundToTwoDecimals((1 + taxPercentage / 100) * priceWithMarkup);
        setPriceWithTax(priceWithTaxValue);
        setSale(priceWithTaxValue);
      }
    } else if (id === 'doessaleincludetax') {
      const checked = e.target.checked;
      setDoesSaleIncludeTax(checked);
      recalculateTax(priceWithMarkup);
    } else if (id === 'saleprice') {
      let sale;
      if (value[value.length - 1] === '.') {
        sale = value.slice(0, -1);  // Remove the decimal point temporarily
        setpointforsale(true);       // Set pointforsale to true
      } else {
        sale = value;
        setpointforsale(false);      // Reset pointforsale if there's no decimal point
      }
      if (pointforsale) {
        sale = `${sale.slice(0, -1)}.${sale[sale.length - 1]}`;
      }
      const saleValue = parseFloat(sale);

      if (!isNaN(saleValue)) {
        setSale(saleValue);

        // Calculate the base cost
        const baseCost = cost + (doesCostIncludesDeliveryExpense ? deliveryExpense : 0);

        // Calculate the new markup amount and percentage
        const newMarkupAmount = roundToTwoDecimals(saleValue - baseCost - (doesSaleIncludeTax ? tax.amount : 0));
        const newMarkupPercentage = roundToTwoDecimals((newMarkupAmount / costPlusDelivery) * 100);

        // Update markup state
        setMarkup({ amount: Math.max(newMarkupAmount, 0), percentage: Math.max(newMarkupPercentage, 0) });
      } else {
        setSale('');  // If invalid, reset sale
      }
    }

  };
  const fetchCategories = async (id) => {
    let data = await fetch(apiaddress + '/management/categories/getcategories?shop=' + (id ? id : selectedShop._id))
    let parsed = await data.json()
    setCategories(parsed.categories)
    return parsed.categories
  }
  const fetchSupliers = async (id) => {
    if(id === ''){
      setSupliersList([])
    }else{

      let data = await fetch(apiaddress + '/customers/getcustomersbyshop', {
        headers: {
          'shopid': id
        }
      })
      let parsed = await data.json()
      setSupliersList(parsed)
      return parsed
    }
  }
  useEffect(() => {
    fetchShops().then(data => {
      setShops(data)
      prefetch().then(product=>{
        setSelectedShop(data.find((x) => x._id === product.shop));
        setProductName(product.name)
        fetchCategories(product.shop).then((cat) => {
          setCategory(cat?.find((c) => c._id === product.category));
        });
        setCode(product.itemCode)
        setBarcode(product.barCode)
        setCost(product.cost)
        fetchSupliers(product.shop).then((sup)=>{
          setSuplier(sup.find(s=>s._id === product.suplier))
        })
        setDeliverExpense(product.kharcha)
        setDoesCostIncludesDeliveryExpense(product.iskharchaincludedinsale)
        let cpd = product.iskharchaincludedinsale ? product.cost+product.kharcha : product.cost
        setCostPlusDelivery(cpd)
        setMarkup(product.markup)
        setPriceWithMarkup(cpd + product.markup.amount)
        setTax(product.tax)
        let pwt = product.istaxincludedinsale ? cpd+product.tax.amount: cpd
        setPriceWithTax(pwt)
        setSale(product.sale)
        setDoesSaleIncludeTax(product.istaxincludedinsale)
        setQtyPerPiece(product.unit)
        setReorder(product.reorder)
        setDescription(product.description)
        setPriceChangeAllowed(product.ispricechangeallowed)
        setIsService(product.isservice)
        setIsEnabled(product.isenabled)
        setproduct(product)
      })
    })
  }, [])

  const handleSubmitForm = async ()=>{
    let newProduct = {
      id,
      productName,
      code,
      barcode,
      suplier:suplier._id,
      shop:selectedShop._id,
      cost:Number(cost),
      kharcha:Number(deliveryExpense),
      iskharchaincludedinsale:doesCostIncludesDeliveryExpense,
      markup:{amount:Number(markup.amount),percentage:Number(markup.percentage)},
      tax:{amount:Number(tax.amount),percentage:Number(tax.percentage)},
      doesSaleIncludeTax,
      priceChangeAllowed,
      isService,
      sale:Number(sale),
      isEnabled,
      qtyPerPiece:Number(qtyPerPiece),
      reorder:Number(reorder),
      description,
      createdby:productx.createdby,
      modifiedby:user._id,
      category:category._id,
    }
    if(productName.length<3){
      toast.error('Product Name Too Short', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
    }else if(suplier.length<3){
      toast.error('Please Select Suplier', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
    }else if(cost === '0' | cost === ''){
      toast.error('Please Enter Cost Price', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
    }else if(category===''){
      toast.error('Please Select a Category', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
    }else if(sale === '0' | sale === ''){
      toast.error('Sale Price Can Not Be 0.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
    }
    else{
    try{
    let response = await fetch(apiaddress+'/management/products/modifyproduct',{
      method:"POST",
      headers:{
        'content-type':'application/json'
      },
      body: JSON.stringify(newProduct)
    })
    let parsed = await response.json()
    if(parsed.success){
      toast('Product Modification Successfull', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });

    }else{
      toast.error(parsed.messge, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
    }
  }catch(err){
    toast.error('Network Error', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
      transition: Bounce,
    });
  }
  }
  }
  if(user && user.permissions.includes("modifyproductsform")){
  return (
    <Menu>
    <DefaultLayout>
      <ToastContainer />
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Modify Product" />

      </div>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

        <div className="flex flex-col gap-5.5 p-6.5">
          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Select Main Shop
            </label>
            <select
              value={selectedShop?._id || ""}  // Safely access _id if selectedShop exists
              onChange={async(e) => {
                const selectedShopId = e.target.value;
                const selectedShopObject = shops.find((shop) => shop._id === selectedShopId);  // Find the selected shop object
                setSelectedShop(selectedShopObject);  // Update state with the whole shop object
                fetchCategories(selectedShopObject._id)
                let data = await fetch(apiaddress + '/customers/getcustomersbyshop', {
                  headers: {
                    'shopid': selectedShopObject._id
                  }
                })
                let parsed = await data.json()
                setSupliersList(parsed)
              }}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            >
              {shops &&
                shops.map((shop, key) => (
                  <option key={key} value={shop._id}>
                    {shop.shopName}
                  </option>
                ))}
            </select>
          </div>
          <div className='flex justify-between'>

            <div className='w-full'>
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Select Supplier
              </label>
              <Searchoption data={supliersList} setData={setSuplier} type={'customer'} />
            </div>

          </div>
          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Product Name
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => { setProductName(e.target.value) }}
              placeholder="Enter Name Of The Product"
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Product Category
            </label>
            <Searchoption data={categories} setData={setCategory} type={'category'} />
          </div>
          <div className='flex justify-between'>
            <div className='w-1/2'>
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Product Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value) }}
                placeholder="Product Code Auto Generated"
                disabled
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary dark:disabled:bg-black"
              />
            </div>
            <div className='w-1/2 pl-5'>
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Product Barcode
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => { setBarcode(e.target.value) }}
                placeholder="Product Barcode Auto Generated"
                disabled
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary dark:disabled:bg-black"
              />
            </div>
          </div>
          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Cost Price
            </label>
            <input
              value={cost}
              onChange={handlechange}
              id="costprice"
              type="text"
              placeholder="Type Cost Price"
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary dark:disabled:bg-black"
            />
          </div>
          <div className="flex justify-between">
            <div className="w-1/2">
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Expense
              </label>
              <input
                value={deliveryExpense}
                onChange={handlechange}
                type="text"
                name="deliveryexpense"
                id="deliveryexpense"
                placeholder="Enter Delivery Expense"
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary dark:disabled:bg-black"
              />
            </div>
            <div className="w-1/2 pl-5">
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Cost Price With Expense
              </label>
              <input
                value={costPlusDelivery}
                type="text"
                id="costplusdelivery"
                placeholder="Cost + Delivery Expense"
                disabled
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary dark:disabled:bg-black"
              />
            </div>
            {/* <div className="w-1/3 pl-5">
              <label className="mb-5 block text-sm font-medium text-black dark:text-white">
                Does Cost Price Include Delivery Expense
              </label>
              <Switcherx
                onChange={handlechange}
                enabled={doesCostIncludesDeliveryExpense}
                setEnabled={setDoesCostIncludesDeliveryExpense}
                id="doesCostIncludesDeliveryExpense"
              />
            </div> */}
          </div>
          <div>
            {/* <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Markup
            </label> */}
            <div className="flex justify-between">
              <div className="w-1/3">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Markup Amount
                </label>
                <input
                  value={markup.amount}
                  onChange={handlechange}
                  type="text"
                  name="amount"
                  id="markupamount"
                  placeholder="Markup Amount"
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
              <div className="w-1/3 ml-5">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Markup Percentage
                </label>
                <input
                  value={markup.percentage}
                  onChange={handlechange}
                  type="text"
                  name="percentage"
                  id="markuppercentage"
                  placeholder="Markup Percentage"
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
              <div className="w-1/3 ml-5">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Price With Markup
                </label>
                <input
                  value={priceWithMarkup}
                  type="text"
                  placeholder="Price After Markup"
                  disabled
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>
          </div>
          {/* <div className="flex justify-between">
            <div className="w-1/4">
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Tax Amount
              </label>
              <input
                value={tax.amount}
                onChange={handlechange}
                type="text"
                id="taxamount"
                name="amount"
                placeholder="Enter Tax Amount"
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary dark:disabled:bg-black"
              />
            </div>
            <div className="w-1/4 pl-5">
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Tax Percentage
              </label>
              <input
                value={tax.percentage}
                onChange={handlechange}
                type="text"
                name="percentage"
                id="taxpercentage"
                placeholder="Enter Tax %"
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary dark:disabled:bg-black"
              />
            </div>
            <div className="w-1/4 pl-5">
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Sale Price With Tax
              </label>
              <input
                value={priceWithTax}
                type="text"
                disabled
                placeholder="Price After Tax"
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary dark:disabled:bg-black"
              />
            </div>
            <div className="w-1/3 pl-5">
              <label className="mb-5 block text-sm font-medium text-black dark:text-white">
                Does Sale Price Include Tax
              </label>
              <Switcherx
                onChange={handlechange}
                enabled={doesSaleIncludeTax}
                setEnabled={setDoesSaleIncludeTax}
                id="doessaleincludetax"
              />
            </div>
          </div> */}
          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Sale Price
            </label>
            <input
              value={sale}
              onChange={handlechange}
              id="saleprice"
              type="text"
              placeholder="Quantity Per Piece"
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary dark:disabled:bg-black"
            />
          </div>
          <div className="flex">
          <div className='w-1/2'>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Quantity Per Piece
            </label>
            <input
              value={qtyPerPiece}
              onChange={(e) => {
                if (!isNaN(Number(e.target.value))) {
                  setQtyPerPiece(e.target.value)
                }
              }}
              type="text"
              placeholder="Quantity Per Piece"
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary dark:disabled:bg-black"
            />
          </div>
          <div className='w-1/2 pl-5'>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Stock Warning
            </label>
            <input
              value={reorder}
              onChange={(e) => {
                if (!isNaN(Number(e.target.value))) {
                  setReorder(Number(e.target.value))
                }
              }}
              type="text"
              placeholder="Quantity Per Piece"
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary dark:disabled:bg-black"
            />
          </div>
          </div>
          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Description
            </label>
            <input
              value={description}
              onChange={(e) => { setDescription(e.target.value) }}
              type="text"
              placeholder="Product Description"
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary dark:disabled:bg-black"
            />
          </div>
          <div className='flex space-x-24 justify-between'>

            <div className='w-1/3'>
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Does Price Change is allowed
              </label>
              <Switcherx enabled={priceChangeAllowed} onChange={handlechange} setEnabled={setPriceChangeAllowed} id={'pricechangeallowed'} />
            </div>
            <div className='w-1/3'>
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Is It Service
              </label>
              <Switcherx enabled={isService} onChange={handlechange} setEnabled={setIsService} id={'isservice'} />
            </div>
            <div className='w-1/3'>
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Is Enabled
              </label>
              <Switcherx enabled={isEnabled} onChange={handlechange} setEnabled={setIsEnabled} id={'isenabled'} />
            </div>
          </div>
          <button className='mx-auto p-3 bg-blue-700 text-white rounded-md' onChange={handlechange} onClick={handleSubmitForm}>Finalize Modification</button>
        </div>
      </div>
    </DefaultLayout>
    </Menu>
  )}else{
    return(
      <LoginPage />
    )
  }
}

export default Page