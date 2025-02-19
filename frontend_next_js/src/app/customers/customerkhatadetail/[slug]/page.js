"use client"
import React, { useEffect, useState } from 'react'
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TableTwoCopy from '@/components/Tables/TableTwoCopy';
import { formatDateTime } from '@/apirequests/getcustomersbyshopid';
import { useParams } from 'next/navigation';
import { getCustomerByID } from '@/apirequests/getcustomersbyshopid';
import { toast } from 'react-toastify';
import { fetchTransactionsByID } from '@/apirequests/getcustomersbyshopid';
import Menu from '@/components/Menu'
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";

const Page = () => {
    const {user} = useGlobalState()
    const token = localStorage.getItem("token")
    const params = useParams()
    const [customer, setCustomer] = useState(null)
    const [transactions, setTransactions] = useState(null)
    const [filteredTransactions, setFilteredTransactions] = useState(null)
    const getdata = async () => {
        let data = await getCustomerByID(params.slug,token)
        setCustomer(data[0])
        let data2 = await fetchTransactionsByID(params.slug,token)
        setTransactions(data2)
        setFilteredTransactions(data2)
    }
    const handleChange = async (e) => {
        let x = e.target.value
        if (x === "") {
            setFilteredTransactions(transactions)
        } else {
            let finalOut = []
            for (let y = 0; y < transactions.length; y++) {
                if (transactions[y].transactionType === x) {
                    finalOut.push(transactions[y])
                }
            }
            setFilteredTransactions(finalOut)
        }
    }
    const next = async () => {
        console.log("congrats.")
    }
    useEffect(() => {
        const getdata = async () => {
            let data = await getCustomerByID(params.slug,token)
            setCustomer(data[0])
            let data2 = await fetchTransactionsByID(params.slug,token)
            setTransactions(data2)
            setFilteredTransactions(data2)
        }
        getdata()
    }, [])
    if(user && user.permissions.includes("customerkhatadetail")){
    return (
        <Menu>
        <DefaultLayout>
            <div className="mx-auto max-w-270">
                <Breadcrumb pageName="Customer Khata Details" />

            </div>

            <div className="rounded-sm border border-stroke w-full text-center items-center bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

                <table className="w-full">
                    <thead className="my-3">
                        <tr className="shadow-3 my-3 bg-graydark text-white">
                            <td className="p-3 w-1/5">Customer Name</td>
                            <td className="p-3 w-1/5">Customer Mobile Number</td>
                            <td className="p-3 w-2/5">Customer Balance</td>
                            <td className="p-3 w-1/5">Date Created</td>
                        </tr>
                    </thead>
                    <tbody className="my-3">
                        <tr className="shadow-3 py-3 hover:bg-blue-200 font-bold dark:hover:bg-slate-500 cursor-pointer">
                            <td className="w-1/5">
                                <p className="m-3">
                                    {customer && customer.customerName}
                                </p>
                            </td>
                            <td className="p-3 w-1/5">
                                <p className="m-3">{customer && customer.customerMobileNumber}</p>
                            </td>
                            <td className="p-3 w-1/5 text-green-500">
                                <p className={`m-3 text-xl ${customer && customer.balance >0 ? 'text-green-600':'text-rose-600'}`}>{customer && customer.balance}</p>
                            </td>
                            <td className="p-3 w-1/5">
                                <p className="m-3">{formatDateTime(customer && customer.createdAt)}</p>
                            </td>
                        </tr>

                    </tbody>
                </table>

            </div>

            <div className="rounded-sm border-none my-3 shadow-lg w-full text-center items-center bg-white dark:border-strokedark dark:bg-boxdark">
                <select name="linkedShop"
                    type="text"
                    id="selectedshop"
                    placeholder="Linked Shop"
                    onChange={handleChange}
                    className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                    <option value="">All Entry Types</option>
                    <option className="text-rose-600" value="malllia">Mall Lia</option>
                    <option className="text-green-600" value="malldia">Mall Dia</option>
                    <option className="text-rose-600" value="mallwapis">Mall Wapis</option>
                    <option className="text-green-600" value="breakagedi">Breakage Di</option>
                    <option className="text-rose-600" value="breakagewapis">Breakage Wapis</option>
                    <option className="text-rose-600" value="wasool">Wasool</option>
                    <option className="text-rose-600" value="wasoolmeezan">Wasool Meezan</option>
                    <option className="text-rose-600" value="wasooleasypaisa">Wasool Easypaisa</option>
                    <option className="text-rose-600" value="wasooljazzcash">Wasool Jazz Cash</option>
                    <option className="text-rose-600" value="wasoolupaisa">Wasool Upaisa</option>
                    <option className="text-rose-600" value="wasoolkameti">Wasool Kameti</option>
                    <option className="text-green-600" value="raqamdi">Raqam Di</option>
                    <option className="text-rose-600" value="raqamli">Raqam Li</option>

                </select>
            </div>

            <div className='min-h-[100vh]'>


                <div className="rounded-sm border border-stroke w-full bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

                    <TableTwoCopy transactions={filteredTransactions && filteredTransactions} toast={toast} next={next} />

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
