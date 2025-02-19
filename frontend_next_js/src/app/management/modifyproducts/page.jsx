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
import { useRouter } from 'next/navigation';
import Menu from '@/components/Menu'
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";

const Page = () => {
    const {user} = useGlobalState()
    const router = useRouter()
    const [shops, setShops] = useState([]);
    const [selectedShop, setSelectedShop] = useState(undefined);
    const [customers, setCustomers] = useState([])
    const [selectedCustomer, setSelectedCustomer] = useState(undefined)
    const [selectedCategory, setSelectedCategory] = useState(undefined)
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchType, setSearchType] = useState('barcode');
    const searchRef = useRef(null);

    const handleSearch = (e) => {
        const searchValue = e.target.value.toLowerCase();
        setSearchTerm(searchValue);

        const filtered = products.filter((item) => {
            if (searchType === 'name') {
                return item.name.toLowerCase().includes(searchValue);
            } else if (searchType === 'category') {
                return item.category.name.toLowerCase().includes(searchValue);
            } else if (searchType === 'barcode') {
                return Number(item.itemCode) === Number(searchValue);
            }
            return false;
        });
        setFilteredProducts(filtered);
    };
    const handleChange = (e, category) => {
        if (category === 'customer') {
            setSelectedCustomer(e)
            if (e === undefined) {
                setFilteredProducts(products)
                return
            }
            const filtered = products.filter((item) => {
                return item.suplier === e._id;
            });
            setFilteredProducts(filtered);

        } else if (category === 'category') {
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

    const handleshopchange = (e) => {
        localStorage.setItem('selectedshop',e.target.value)
        setSelectedShop(shops.find(f => f._id === e.target.value))
        fetchProducts(e.target.value).then(productsData => {
            console.log(productsData)
            setProducts(productsData);
            setFilteredProducts(productsData);
        })
        fetchCustomers(e.target.value).then(data2 => {
            setCustomers(data2)
            setSelectedCustomer(data2[0])
        })
        searchRef.current.focus()
    }

    const handleDelete = async (id) => {
        const confirmDelete = prompt("Type 'delete' to confirm deletion:");
        if (confirmDelete === 'delete') {
            await fetch(apiaddress + '/management/products/deleteproduct', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });
            setProducts((prev) => prev.filter((product) => product._id !== id));
            setFilteredProducts((prev) => prev.filter((product) => product._id !== id)); // Update filtered list
        } else {
            alert('Delete action cancelled.');
        }
    };

    useEffect(() => {
        fetchShops().then(data => {
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
            fetchProducts(defaultShop._id).then(productsData => {
                console.log(productsData)
                setProducts(productsData);
                setFilteredProducts(productsData);
            })
            fetchCustomers(defaultShop._id).then(data2 => {
                setCustomers(data2)
                setSelectedCustomer(data2[0])
            })
            searchRef.current.focus()
        })
    }, []);
if(user && user.permissions.includes("modifyproducts")){
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
                            <Searchoption data={customers} setData={setSelectedCustomer} onChange={(e) => { handleChange(e, 'customer') }} type="customer" />
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
                    <table className="w-full">
                        <thead className="my-3">
                            <tr className="shadow-3 my-3 bg-graydark text-white">
                                <td className="p-2 w-1/12">Item Code</td>
                                <td className="p-2 w-3/12">Product Name</td>
                                <td className="p-2 w-1/12">Picture</td>
                                <td className="p-2 w-1/12">Category</td>
                                <td className="p-2 w-1/12">Suplier</td>
                                <td className="p-2 w-2/12">Modify</td>
                                <td className="p-2 w-2/12">Delete</td>

                            </tr>
                        </thead>
                        <tbody className="my-3">
                            {filteredProducts && filteredProducts.length > 0 && filteredProducts.map((product, key) => (
                                    <tr key={product._id} className="shadow-3 py-3 dark:hover:bg-slate-500 hover:bg-blue-200 font-bold cursor-pointer">
                                        <td className="p-2 w-1/12">{product.itemCode}</td>
                                        <td className="p-2 w-3/12">{product.name}</td>
                                        <td className="p-2 w-1/12"><Image alt='icon' className='h-auto w-auto' height={50} width={50} src={apiaddress + product.picture[0]} /></td>
                                        <td className="p-2 w-1/12">{product.category.name}</td>
                                        <td className="p-2 w-2/12">{product.suplier.customerName}</td>
                                        <td className="p-2 w-2/12">
                                        <button onClick={() => router.push(`/management/modifyproducts/modifyform/${product._id}`)} className="bg-blue-500 text-white w-1/2 inline m-3 px-2 py-1 rounded">
                                            Modify
                                        </button></td>
                                        <td className="p-2 w-2/12">
                                            <button onClick={() => handleDelete(product._id)} className="bg-rose-500 text-white w-1/2 inline m-3 px-2 py-1 rounded">
                                                Delete
                                            </button></td>
                                    </tr>
                            ))}

                        </tbody>
                    </table>
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
