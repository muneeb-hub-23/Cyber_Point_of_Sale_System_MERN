"use client"
import React from 'react'
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apiaddress from '../../../apirequests/apiaddress';
import Menu from '@/components/Menu'
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";

const Page = () => {
    const {user} = useGlobalState()
    const token = localStorage.getItem("token")
    const [formData, setFormData] = useState({
        shopName: ""
    })
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }
    const createShop = async (e) => {
        e.preventDefault()
        if (formData.shopName.length > 3) {
            let data = await fetch(apiaddress + '/shop/createshop', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    token
                },
                body: JSON.stringify(formData)
            })
            let parsed = await data.json()
            if (parsed.success) {
                setFormData({ shopName: "" })
                toast('Shop Created', {
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
            } else {
                toast.error('Error Occured', {
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
        } else {
            toast.error('Shop Name is Too Short', {
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
    if(user && user.permissions.includes("createshop")){
    return (
        <Menu>
        <DefaultLayout>
            <ToastContainer />
            <div className="mx-auto max-w-270">
                <Breadcrumb pageName="Create Shop" />
            </div>
            <div className="min-h-[100vh]">
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
                                    className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                    autoFocus
                                />
                            </div>

                        </div>


                        <button onClick={createShop} className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90">
                            Create Shop
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
