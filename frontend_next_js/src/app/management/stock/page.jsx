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
import { FaPrint } from "react-icons/fa6";
import { useMemo } from 'react'; // import useMemo for memoized calculation
import Menu from '@/components/Menu'
import Link from 'next/link';
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";
import { useReactToPrint } from 'react-to-print';

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
    const [recalibratingAll, setRecalibratingAll] = useState(false);
    const [recalibProgress, setRecalibProgress] = useState(null);
    const [stockFilter, setStockFilter] = useState('all');
    const searchRef = useRef(null);
    const printRef = useRef(null);

    const displayedProducts = useMemo(() => {
        let list = [...filteredProducts];
        if (stockFilter === 'positive') list = list.filter(p => p.onHand > 0);
        else if (stockFilter === 'zero') list = list.filter(p => p.onHand === 0);
        else if (stockFilter === 'negative') list = list.filter(p => p.onHand < 0);
        else if (stockFilter === 'asc') list.sort((a, b) => a.onHand - b.onHand);
        else if (stockFilter === 'desc') list.sort((a, b) => b.onHand - a.onHand);
        return list;
    }, [filteredProducts, stockFilter]);

    const totalCost = useMemo(() => {
        return displayedProducts.reduce((sum, product) => sum + (product.cost * product.onHand), 0);
    }, [displayedProducts]);
    const totalSale = useMemo(() => {
        return displayedProducts.reduce((sum, product) => sum + (product.sale * product.onHand), 0);
    }, [displayedProducts]);

    const reactToPrintFn = useReactToPrint({
        contentRef: printRef,
        pageStyle: `
            @page { size: 80mm auto; margin: 4mm; }
            @media print { body { font-size: 9px; } }
        `,
    });

    const handleSearch = (e) => {
        const searchValue = e.target.value.toLowerCase();
        setSearchTerm(searchValue);

        const filtered = products.filter((item) => {
            if (searchType === 'name') {
                return item.name.toLowerCase().includes(searchValue);
            } else if (searchType === 'category') {
                return (item.category?.name || '').toLowerCase().includes(searchValue);
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
                    const pid = item && item.suplier && item.suplier._id ? String(item.suplier._id) : '';
                    const eid = e && e._id ? String(e._id) : '';
                    return pid === eid;
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

    const exportToCSV = () => {
        const shopName = selectedShop ? selectedShop.shopName : 'stock'
        const headers = ['Item Code', 'Product Name', 'Category', 'Supplier', 'OnHand', 'Sale Price/Unit', 'Sale Total']
        const rows = displayedProducts.map(p => [
            p.itemCode,
            `"${(p.name || '').replace(/"/g, '""')}"`,
            `"${(p.category?.name || '').replace(/"/g, '""')}"`,
            `"${(p.suplier?.customerName || '').replace(/"/g, '""')}"`,
            p.onHand.toFixed(2),
            p.sale.toFixed(2),
            (p.sale * p.onHand).toFixed(2),
        ])
        const totalSaleVal = displayedProducts.reduce((s, p) => s + p.sale * p.onHand, 0)
        rows.push(['', 'TOTAL', '', '', displayedProducts.length, '', totalSaleVal.toFixed(2)])

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${shopName}_stock_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const recalibrateAllStock = () => {
        if (!confirm('This will recalibrate OnHand stock for ALL products across all shops. Continue?')) return
        setRecalibratingAll(true)
        setRecalibProgress({ total: 0, done: 0, remaining: 0, currentProduct: '', finished: false, error: null })

        const es = new EventSource(`${apiaddress}/management/products/recalibrateallstock`)

        es.onmessage = (e) => {
            const data = JSON.parse(e.data)
            if (data.type === 'start') {
                setRecalibProgress(p => ({ ...p, total: data.total, remaining: data.total }))
            } else if (data.type === 'progress') {
                setRecalibProgress(p => ({
                    ...p,
                    total: data.total,
                    done: data.done,
                    remaining: data.remaining,
                    currentProduct: data.productName
                }))
            } else if (data.type === 'done') {
                setRecalibProgress(p => ({ ...p, finished: true, currentProduct: '' }))
                setRecalibratingAll(false)
                es.close()
                if (selectedShop) {
                    fetchProducts(selectedShop._id).then(updated => {
                        setProducts(updated)
                        setFilteredProducts(updated)
                    })
                }
            } else if (data.type === 'error') {
                setRecalibProgress(p => ({ ...p, error: data.message, finished: true }))
                setRecalibratingAll(false)
                es.close()
            }
        }

        es.onerror = () => {
            setRecalibProgress(p => ({ ...p, error: 'Connection lost', finished: true }))
            setRecalibratingAll(false)
            es.close()
        }
    }

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
    return (<>
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
                    <div className="flex flex-wrap justify-end gap-2 px-2 pb-2">
                        <select
                            value={stockFilter}
                            onChange={e => setStockFilter(e.target.value)}
                            className='px-3 py-2 rounded-md bg-boxdark border border-slate-500 text-white text-sm outline-none focus:border-blue-500'
                        >
                            <option value="all">All Stock</option>
                            <option value="asc">OnHand: Low → High</option>
                            <option value="desc">OnHand: High → Low</option>
                            <option value="positive">Positive Only</option>
                            <option value="zero">Zero Only</option>
                            <option value="negative">Negative Only</option>
                        </select>
                        <button
                            onClick={exportToCSV}
                            disabled={displayedProducts.length === 0}
                            className='px-4 py-2 rounded-md bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold border border-green-500 transition-colors text-sm'
                        >
                            Export CSV
                        </button>
                        <button
                            onClick={() => reactToPrintFn()}
                            disabled={displayedProducts.length === 0}
                            className='flex items-center gap-1 px-4 py-2 rounded-md bg-blue-700 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold border border-blue-500 transition-colors text-sm'
                        >
                            <FaPrint /> Print List
                        </button>
                        <button
                            onClick={recalibrateAllStock}
                            disabled={recalibratingAll}
                            className='px-4 py-2 rounded-md bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold border border-orange-400 transition-colors text-sm'
                        >
                            {recalibratingAll ? 'Recalibrating...' : 'Recalibrate All Shops Items Stock'}
                        </button>
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
                            {displayedProducts.length > 0 ? (
                                displayedProducts.map((product,key) => (
                                    <Link key={key} href={`/management/stock/stockdetail/${product._id}`}>
                                    <div key={product._id} className="hover:bg-blue-200 flex items-center dark:hover:bg-slate-500 font-bold cursor-pointer">
                                        <div className="p-1 w-1/12">{product.itemCode}</div>
                                        <div className="p-1 w-2/12">{product.name}</div>
                                        <div className="p-1 w-1/12"><Image alt="icon" height={50} width={50} src={`${apiaddress}${product.picture?.[0] || '/images/products/default.png'}`} /></div>
                                        <div className="p-1 w-1/12">{product.category?.name}</div>
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
                    Total Items: {displayedProducts.length}  
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

        {/* Recalibrate Progress Popup */}
        {recalibProgress && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70">
                <div className="bg-boxdark border border-blue-600 rounded-xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center space-y-5">
                    <h2 className="text-white text-xl font-bold">Recalibrating Stock</h2>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div
                            className="h-4 rounded-full bg-orange-500 transition-all duration-300"
                            style={{ width: recalibProgress.total > 0 ? `${(recalibProgress.done / recalibProgress.total) * 100}%` : '0%' }}
                        />
                    </div>

                    {/* Counts */}
                    <div className="flex w-full justify-between text-sm font-semibold">
                        <span className="text-blue-400">Total: <span className="text-white">{recalibProgress.total}</span></span>
                        <span className="text-green-400">Done: <span className="text-white">{recalibProgress.done}</span></span>
                        <span className="text-orange-400">Remaining: <span className="text-white">{recalibProgress.remaining}</span></span>
                    </div>

                    {/* Current product */}
                    {!recalibProgress.finished && recalibProgress.currentProduct && (
                        <p className="text-slate-300 text-sm text-center truncate w-full">
                            Processing: <span className="text-white font-medium">{recalibProgress.currentProduct}</span>
                        </p>
                    )}

                    {/* Error */}
                    {recalibProgress.error && (
                        <p className="text-red-400 text-sm text-center">{recalibProgress.error}</p>
                    )}

                    {/* Done state */}
                    {recalibProgress.finished && !recalibProgress.error && (
                        <p className="text-green-400 font-semibold text-center">All {recalibProgress.total} products recalibrated successfully!</p>
                    )}

                    {/* Close button — only when finished */}
                    {recalibProgress.finished && (
                        <button
                            onClick={() => setRecalibProgress(null)}
                            className="mt-2 px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        )}

        {/* Hidden 80mm print template */}
        <div style={{ display: 'none' }}>
            <div ref={printRef} style={{ width: '72mm', fontFamily: 'monospace', fontSize: '9px', padding: '2mm' }}>
                <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '12px' }}>{selectedShop ? selectedShop.shopName : 'Stock List'}</strong>
                    <br />
                    <span>Products Stock Report</span>
                    <br />
                    <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    {stockFilter !== 'all' && (
                        <><br /><span style={{ fontSize: '8px' }}>
                            Filter: {stockFilter === 'asc' ? 'Low→High' : stockFilter === 'desc' ? 'High→Low' : stockFilter.charAt(0).toUpperCase() + stockFilter.slice(1) + ' Only'}
                        </span></>
                    )}
                </div>
                <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '2px 0', display: 'flex', fontWeight: 'bold', marginBottom: '2px' }}>
                    <span style={{ width: '46%' }}>Product</span>
                    <span style={{ width: '18%', textAlign: 'right' }}>OnHand</span>
                    <span style={{ width: '18%', textAlign: 'right' }}>Price</span>
                    <span style={{ width: '18%', textAlign: 'right' }}>Total</span>
                </div>
                {displayedProducts.map((p, i) => (
                    <div key={i} style={{ display: 'flex', borderBottom: '1px dotted #ccc', padding: '1px 0' }}>
                        <span style={{ width: '46%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.name}</span>
                        <span style={{ width: '18%', textAlign: 'right', color: p.onHand < 0 ? 'red' : p.onHand === 0 ? '#888' : 'inherit' }}>{p.onHand.toFixed(2)}</span>
                        <span style={{ width: '18%', textAlign: 'right' }}>{p.sale.toFixed(2)}</span>
                        <span style={{ width: '18%', textAlign: 'right' }}>{(p.sale * p.onHand).toFixed(0)}</span>
                    </div>
                ))}
                <div style={{ borderTop: '1px dashed #000', marginTop: '3px', paddingTop: '3px', fontWeight: 'bold' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Items:</span><span>{displayedProducts.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Sale:</span><span>{totalSale.toFixed(2)}</span>
                    </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '8px' }}>
                    Printed by Cyber POS
                </div>
            </div>
        </div>
    </>);
}else{
    return(
        <LoginPage />
    )
}
};

export default Page;
