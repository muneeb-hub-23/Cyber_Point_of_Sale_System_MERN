"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useEffect, useState } from "react";
import { fetchShops } from "@/apirequests/getcustomersbyshopid";
import apiaddress from "@/apirequests/apiaddress";
import 'react-toastify/dist/ReactToastify.css';
import Link from "next/link";
import Menu from '@/components/Menu'
import { useRouter } from "next/navigation";
import { useGlobalState } from "@/js/globaluser";
import { LuRefreshCcw } from "react-icons/lu";
import LoginPage from "@/app/authentication/login/page";

const Page = () => {
  const [products, setProducts] = useState([]); // Initial empty array
  const [shops, setShops] = useState(null);
  const [selectedShop,setSelectedShop] = useState(undefined)
  const {user} = useGlobalState()
  const router = useRouter()

  const fetchProducts = async (shop) => {
    let data = await fetch(apiaddress + "/management/products/getproductsbyshop", {
      method: "GET",
      headers: {
        "shop": shop,
      },
    });
    let parsed = await data.json();
    let filtered = parsed.filter(f=>f.status==='pending')
    setProducts(filtered); // Set original product list
  };

  const handleChange = async (e) => {
    if (e.target.value !== "") {
      localStorage.setItem('selectedshop',e.target.value)
      setSelectedShop(shops.find(s=>s._id===e.target.value))
      await fetchProducts(e.target.value);
    }
  };
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  useEffect(() => {
    if(user){
      fetchShops().then((data) => {
        let sid = localStorage.getItem('selectedshop')
        setShops(data);   
        if(sid){
          let pshop = data.find(d=>d._id===sid)
          if(pshop){
            setSelectedShop(pshop)
            fetchProducts(pshop._id);
          }else{
            setSelectedShop(data[0])
            fetchProducts(data[0]._id);
          }
        }else{
          setSelectedShop(data[0])
          fetchProducts(data[0]._id);
        }
      });
    }else{
      router.push('/')
    }
  }, []);


if(user && user.permissions.includes("pendingproducts")){
  return (
    <Menu>
    <DefaultLayout>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Pending Products For Pictures" />
      </div>
      <div className='min-h-screen w-full'>
        <div className="rounded-sm border mb-5 flex shadow-lg border-stroke w-full text-center items-center bg-white dark:border-strokedark dark:bg-boxdark">
          <select name="linkedShop"
            onChange={handleChange}
            value={selectedShop && selectedShop._id}
            type="text"
            id="selectedshop"
            placeholder="Linked Shop"
            className="w-11/12 rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
          >
            {shops && shops.map((shop) => (
              <option key={shop._id} value={shop._id}>{shop.shopName}</option>
            ))}
          </select>
          <div onClick={async()=>{await fetchProducts(selectedShop._id)}} className="text-white flex text-3xl px-1 hover:cursor-pointer hover:text-green-500 items-center justify-center w-1/12">
          <LuRefreshCcw />
          </div>
        </div>

        <div className="rounded-sm border border-stroke w-full text-center items-center bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

          <table className="w-full text-sm">
            <thead className="my-3">
              <tr className="shadow-3 my-3 bg-graydark text-white">
                <td className="p-3 w-1/12">Code</td>
                <td className="p-3 w-6/12 text-left">Name</td>
                <td className="p-3 w-2/12">Price</td>
                <td className="p-3 w-1/12">Stock</td>
                <td className="p-3 w-2/12">Entry</td>
              </tr>
            </thead>
            <tbody className="my-3">
              {products && products.length>0 && products.map((product) => (
                
                <tr key={product._id} className="shadow-3 py-3 dark:hover:bg-slate-500 hover:bg-blue-200 font-bold cursor-pointer">
                <td className="w-1/12">
                <Link href={'/management/pendingproducts/addpictures/'+product._id}>
                {product.itemCode}
                </Link>
                </td>
                <td className="w-6/12 text-left">
                <Link href={'/management/pendingproducts/addpictures/'+product._id}>
                {product.name}
                </Link>
                </td>
                <td className="p-3 w-2/12 text-green-500">
                <Link href={'/management/pendingproducts/addpictures/'+product._id}>
                {product.sale}
                </Link>
                </td>
                <td className="w-1/12">
                <Link href={'/management/pendingproducts/addpictures/'+product._id}>
                {product.onHand}
                </Link>
                </td>
                <td className="w-2/12">
                <Link href={'/management/pendingproducts/addpictures/'+product._id}>
                {formatDate(product.createdAt)}
                </Link>
                </td>
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
