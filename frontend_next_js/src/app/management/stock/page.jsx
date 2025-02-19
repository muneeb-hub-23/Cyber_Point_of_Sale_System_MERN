'use client';
import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { fetchCustomers, fetchShops } from '@/apirequests/getcustomersbyshopid';
import Searchoption from '@/js/Searchoption';
import apiaddress from '@/apirequests/apiaddress';
import { MdOutlineCategory } from "react-icons/md";
import { BiSolidRename } from "react-icons/bi";
import { FaBarcode } from "react-icons/fa6";
import { useMemo } from 'react'; // import useMemo for memoized calculation
import Menu from '@/components/Menu'
import Link from 'next/link';
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";

const Page = () => {
    const {user} = useGlobalState()
    const [shops, setShops] = useState([]);
    const [selectedShop, setSelectedShop] = useState(undefined);
    const [customers,setCustomers] = useState([])
    const [selectedCustomer,setSelectedCustomer] = useState(undefined)
    const [selectedCategory,setSelectedCategory] = useState(undefined)
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchType, setSearchType] = useState('barcode');
    const searchRef = useRef(null);
    const totalCost = useMemo(() => {
        return filteredProducts.reduce((sum, product) => sum + (product.cost * product.onHand), 0);
    }, [filteredProducts]);
    const totalSale = useMemo(() => {
        return filteredProducts.reduce((sum, product) => sum + (product.sale * product.onHand), 0);
    }, [filteredProducts]);

    const handleSearch = (e) => {
        const searchValue = e.target.value.toLowerCase();
        setSearchTerm(searchValue);

        const filtered = products.filter((item) => {
            if (searchType === 'name') {
                return item.name.toLowerCase().includes(searchValue);
            } else if (searchType === 'category') {
                return item.category.name.toLowerCase().includes(searchValue);
            } else if (searchType === 'barcode') {
                return Number(item.itemCode)===Number(searchValue);
            }
            return false;
        });
        setFilteredProducts(filtered);
    };
    const handleChange = (e,category)=>{
        if(category==='customer'){
            setSelectedCustomer(e)
            if(e===undefined){
                setFilteredProducts(products)
                return
            }
            const filtered = products.filter((item) => {
                    return item.suplier._id===e._id;
            });
            setFilteredProducts(filtered);

        }else if(category==='category'){
            setSelectedCategory(e)
        }
    }

    const fetchProducts = async (shopId) => {
        if (!shopId) return;
    
        try {
            const response = await fetch(`${apiaddress}/management/products/getproductsbyshop`, {
                headers: {
                    'shop': shopId,
                }
            });    
            const parsedData = await response.json();
            return parsedData
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const handleshopchange = (e)=>{
        localStorage.setItem('selectedshop',e.target.value)
        setSelectedShop(shops.find(f=>f._id===e.target.value))
        fetchProducts(e.target.value).then(productsData => {
            console.log(productsData)
            setProducts(productsData);
            setFilteredProducts(productsData);
        })
        fetchCustomers(e.target.value).then(data2 => {
            setCustomers(data2)
            setSelectedCustomer(data2[0])
        })
    }

    useEffect(() => {
        fetchShops().then(data=>{
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
                
            setSelectedShop(defaultShop)
            fetchProducts(defaultShop._id).then(productsData=>{
                console.log(productsData)
                setProducts(productsData);
                setFilteredProducts(productsData);
            })
            fetchCustomers(defaultShop._id).then(data2=>{
                setCustomers(data2)
                setSelectedCustomer(data2[0])
            })
        })
    }, []);
if(user && user.permissions.includes("stock")){
    return (
        <Menu>
        <DefaultLayout>
            <div className="mx-auto max-w-270">
                <Breadcrumb pageName="Products List" />
            </div>
            <div className="min-h-[100vh] text-sm">
                <div className="rounded-sm border mb-5 shadow-lg border-stroke w-full text-center items-center bg-white dark:border-strokedark dark:bg-boxdark">
                    <div className="flex py-2 space-x-3">
                        <select
                            name="linkedShop"
                            value={selectedShop && selectedShop._id}
                            onChange={handleshopchange}
                            className="w-1/2 rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                        >
                            <option value="">Select Shop</option>
                            {shops && shops.map((shop) => (
                                <option key={shop._id} value={shop._id}>{shop.shopName}</option>
                            ))}
                        </select>
                        <div className="w-1/2">
                            <Searchoption data={customers} setData={setSelectedCustomer} onChange={(e)=>{handleChange(e,'customer')}} type="customer" />
                        </div>
                    </div>
                </div>
                <div className="rounded-sm flex border mb-5 shadow-lg border-stroke w-full text-center items-center bg-white dark:border-strokedark dark:bg-boxdark">
                    <button onClick={() => { setSearchType('barcode'); searchRef.current.focus(); }} className={`text-white ${searchType === 'barcode' ? 'border-b-2 border-blue-600' : ''} hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300 text-lg m-2`}><FaBarcode /></button>
                    <button onClick={() => { setSearchType('name'); searchRef.current.focus(); }} className={`text-white ${searchType === 'name' ? 'border-b-2 border-blue-600' : ''} hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300 text-lg m-2`}><BiSolidRename /></button>
                    <button onClick={() => { setSearchType('category'); searchRef.current.focus(); }} className={`text-white ${searchType === 'category' ? 'border-b-2 border-blue-600' : ''} hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300 text-lg m-2`}><MdOutlineCategory /></button>
                    <input
                        name="linkedShop"
                        type="text"
                        ref={searchRef}
                        value={searchTerm}
                        onChange={handleSearch}
                        placeholder="Search Products"
                        className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                    />
                </div>




                <div className="rounded-sm border border-stroke w-full text-center items-center bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="w-full">
                            <div className='flex items-center bg-blue-600 text-white'>
                                <div className="p-1 w-1/12">Item Code</div>
                                <div className="p-1 w-2/12">Product Name</div>
                                <div className="p-1 w-1/12">Picture</div>
                                <div className="p-1 w-1/12">Category</div>
                                <div className="p-1 w-2/12">Suplier</div>
                                <div className="p-1 w-1/12">OnHand</div>
                                <div className="p-1 w-1/12">Cost</div>
                                <div className="p-1 w-1/12">Cost Total</div>
                                <div className="p-1 w-1/12">Sale</div>
                                <div className="p-1 w-1/12">Sale Total</div>
                            </div>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product,key) => (
                                    <Link key={key} href={`/management/stock/stockdetail/${product._id}`}>
                                    <div key={product._id} className="hover:bg-blue-200 flex items-center dark:hover:bg-slate-500 font-bold cursor-pointer">
                                        <div className="p-1 w-1/12">{product.itemCode}</div>
                                        <div className="p-1 w-2/12">{product.name}</div>
                                        <div className="p-1 w-1/12"><Image alt="icon" height={50} width={50} src={`${apiaddress}${product.picture[0]}`} /></div>
                                        <div className="p-1 w-1/12">{product.category.name}</div>
                                        <div className="p-1 w-2/12">{product.suplier && product.suplier.customerName}</div>
                                        <div className="p-1 w-1/12">{product.onHand.toFixed(2) }</div>
                                        <div className="p-1 w-1/12">{product.cost.toFixed(2)}</div>
                                        <div className="p-1 w-1/12">{product.cost*product.onHand.toFixed(2)}</div>
                                        <div className="p-1 w-1/12">{product.sale.toFixed(2)}</div>
                                        <div className="p-1 w-1/12">{product.sale*product.onHand.toFixed(2)}</div>
                                    </div>
                                    </Link>
                                ))
                            ) : (
                                <tr><td colSpan="10" className="p-5 text-center">No products found</td></tr>
                            )}
                    </div>
                <div className='text-green-600 flex bg-boxdark space-x-10 border-t-2 border-l-2 mt-3 fixed bottom-0 right-0 border-blue-600 text-2xl font-bold justify-end p-2 pt-5'>
                    <h3>
                    Total Items: {filteredProducts.length}  
                    </h3>
                    <h3>
                    Total Cost: {totalCost.toFixed(2)}  
                    </h3>
                    <h3>
                    Total Sale: {totalSale.toFixed(2)}  
                    </h3>
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
