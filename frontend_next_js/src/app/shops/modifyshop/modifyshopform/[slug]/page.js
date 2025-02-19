"use client"
import React from 'react'
import { useParams } from 'next/navigation'
import DefaultLayout from '@/components/Layouts/DefaultLayout'
import { useState, useEffect } from 'react'
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb'
import apiaddress from '@/apirequests/apiaddress'
import Menu from '@/components/Menu'
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";
const Page = () => {
    const {user} = useGlobalState()
    const token = localStorage.getItem("token")
    const params = useParams()
    const [formData, setFormData] = useState({
        shopName: ""
    })

    const modifyShop = async (e) => {
        e.preventDefault()
    let response = await fetch(apiaddress+"/shop/modifyshop",{
        method:"POST",
        headers:{
            'content-type':'application/json',
            token
        },body:JSON.stringify({shopid:params.slug,shopName:formData.shopName})
    })
    let parsed = await response.json()
    if(parsed.success){
        toast(parsed.message, {
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
        toast.error(parsed.message, {
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
    useEffect(() => {
        const fetchShop = async () => {
            let response = await fetch(apiaddress + "/shop/getshopbyid", {
                method: "GET",
                headers: {
                    'shopid': params.slug,
                    token
                }
            })
            let parsed = await response.json()
            setFormData(parsed)
        }
        fetchShop()
    }, [])
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }
    if(user && user.permissions.includes("modifyshopform")){
    return (
        <Menu>
        <DefaultLayout>
            <ToastContainer />
            <div className="mx-auto max-w-270">
                <Breadcrumb pageName="Modify Shop Form" />
            </div>
            <div className='min-h-[100vh]'>
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

                <form action="#">
                    <div className="p-6.5">
                        <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">

                            <div className="w-full xl:w-full">
                                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                    Shop Name
                                </label>
                                <input
                                    name="shopName"
                                    onChange={handleChange}
                                    value={formData.shopName}
                                    type="text"
                                    placeholder="Shop Name"
                                    className="w-full mb-3 rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                    autoFocus
                                />
                                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                    Customers Count
                                </label>
                                <input
                                    name="customerscount"
                                    onChange={handleChange}
                                    value={formData.customers && formData.customers}
                                    type="text"
                                    placeholder="Customers Count"
                                    className="w-full mb-3 rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                    disabled
                                />
                                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                    Lene Hain
                                </label>
                                <input
                                    name="lenehain"
                                    onChange={handleChange}
                                    value={formData.lenehain && formData.lenehain}
                                    type="text"
                                    placeholder="Lene Hain"
                                    className="w-full mb-3 text-green-500 rounded border-2 border-slate-400 bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                    disabled
                                />
                                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                    Dene Hain
                                </label>
                                <input
                                    name="denehain"
                                    onChange={handleChange}
                                    value={formData.denehain && formData.denehain}
                                    type="text"
                                    placeholder="Dene Hain"
                                    className="w-full mb-3 text-rose-500 rounded border-2 border-slate-400 bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                    disabled
                                />

                            </div>

                        </div>


                        <button onClick={modifyShop} className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90">
                            Modify Shop
                        </button>
                    </div>
                </form>
            </div>
            </div>
        </DefaultLayout>
        </Menu>
    )
}else{
        return(
            <LoginPage />
        )
    }
}

export default Page
