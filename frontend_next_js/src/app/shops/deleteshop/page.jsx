"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useEffect, useState } from "react";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apiaddress from "../../../apirequests/apiaddress";
import Menu from '@/components/Menu'
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";

const Page = () => {
    const {user} = useGlobalState()
    const [shops, setShops] = useState(null)
    const token = localStorage.getItem("token")
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredShops, setFilteredShops] = useState([]); // For filtered data
    const handleSearch = (e) => {
        const searchValue = e.target.value.toLowerCase();
        setSearchTerm(searchValue);

        // Filter customers by name or phone
        const filtered = shops.filter(
            (item) =>
                item.shopName.toLowerCase().includes(searchValue));
        setFilteredShops(filtered); // Update filtered results
    };
    const handleDelete = async (e) => {
        let check = prompt("Type delete if You want to Delete This Shop!")
        if (check === "delete") {
            let response = await fetch(apiaddress + "/shop/deleteshop", {
                method: "DELETE",
                headers: {
                    'shopid': e,
                    token
                }

            })
            let parsed = await response.json()
            if (parsed.success) {
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
                await fetchShops()

            } else {
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
    }
    const fetchShops = async () => {
        let data = await fetch(apiaddress + "/shop/retrieveshops",{
            method:"GET",
            headers:{
                token
            }
        })
        let parsed = await data.json()
        setShops(parsed)
        setFilteredShops(parsed)
    }
    useEffect(() => {

        fetchShops()
    }, [])
if(user && user.permissions.includes("deleteshop")){
    return (
        <Menu>
        <DefaultLayout>
            <ToastContainer />
            <div className="mx-auto max-w-270">
                <Breadcrumb pageName="Delete Shop" />

            </div>
            <div className="min-h-[100vh]">
                <div className="rounded-sm border mb-5 shadow-lg border-stroke w-full text-center items-center bg-white dark:border-strokedark dark:bg-boxdark">
                    <input name="linkedShop"
                        type="text"
                        value={searchTerm}
                        onChange={handleSearch}
                        placeholder="Search Shop"
                        className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    >
                    </input>
                </div>
                <div className="rounded-sm border border-stroke w-full text-center items-center bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

                    <table className="w-full">
                        <thead className="my-3">
                            <tr className="shadow-3 my-3 bg-rose-500 text-white">
                                <td className="p-3 w-1/5">Shop Name</td>
                                <td className="p-3 w-1/5">Customers Count</td>
                                <td className="p-3 w-1/5">Total Lene Hain</td>
                                <td className="p-3 w-1/5">Total Dene Hain</td>
                                <td className="p-3 w-1/5">Delete Button</td>
                            </tr>
                        </thead>
                        <tbody className="my-3">
                            {filteredShops && filteredShops.map((shop) => (
                                <tr key={shop._id} className="shadow-3 py-3">
                                    <td className="p-3 w-1/5">{shop.shopName}</td>
                                    <td className="p-3 w-1/5">{shop.customers}</td>
                                    <td className="p-3 w-1/5 text-green-500">{shop.lenehain}</td>
                                    <td className="p-3 w-1/5 text-rose-500">{shop.denehain}</td>
                                    <td className="p-3 w-1/5"><span onClick={() => { handleDelete(shop._id) }} className="bg-rose-500 cursor-pointer text-white p-3 w-1/5 px-6 text-lg rounded-md shadow-md my-2">Delete</span></td>
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
