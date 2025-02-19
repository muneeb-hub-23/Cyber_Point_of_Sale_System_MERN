"use client"
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchTransactionsByID } from '@/apirequests/getcustomersbyshopid'
import TableTwoCopy from '@/components/Tables/TableTwoCopy'
import DefaultLayout from '@/components/Layouts/DefaultLayout'
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb'
import { getCustomerByID } from '@/apirequests/getcustomersbyshopid'
import Menu from '@/components/Menu'
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";

export default function Page() {
  const {user} = useGlobalState()
  const token = localStorage.getItem("token")
  const [transactions, setTransactions] = useState(null)
  const [customer, setCustomer] = useState(null)
  const params = useParams()
  const usefunction = async()=>{
    fetchTransactionsByID(slug,token).then(data => {
      setTransactions(data)
      getCustomerByID(slug,token).then(data2 => {
        console.log(data2[0])
        setCustomer(data2[0])
      })
    })
  }
  useEffect(() => {
    usefunction()
  }, [])
  if(user && user.permissions.includes("customerdetail")){
  return (
    <Menu>
    <DefaultLayout>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Customer Detail" />
      </div>

      <div className="font-bold text-xl rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">

        <div className="flex flex-col">

          <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-5">
            <div className="p-2.5 xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Customer Name
              </h5>
            </div>
            <div className="p-2.5 text-center xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Mobile Number
              </h5>
            </div>
            <div className="p-2.5 text-center xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Lene Hain
              </h5>
            </div>
            <div className="hidden p-2.5 text-center sm:block xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Dene Hain
              </h5>
            </div>
            <div className="hidden p-2.5 text-center sm:block xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Status
              </h5>
            </div>

          </div>


            <div
              className={`grid grid-cols-3 sm:grid-cols-5 cursor-pointer`}
            >
              <div className="flex items-center gap-3 p-2.5 xl:p-5">

                <p className="hidden text-black dark:text-white sm:block">
                  {customer && customer.customerName}
                </p>
              </div>

              <div className="flex items-center justify-center p-2.5 xl:p-5">
                <p className="text-black dark:text-white">{customer && customer.customerMobileNumber}</p>
              </div>

              <div className="flex items-center justify-center p-2.5 xl:p-5">
                <p className="text-green-700">{customer && customer.leneHain}</p>
              </div>

              <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                <p className="text-red dark:text-white">{customer && customer.deneHain}</p>
              </div>
              <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                <p className={customer && customer.status ? "text-green-500":"text-rose-500"}>{customer && customer.status ? "Active":"Not Active"}</p>
              </div>
            </div>

        </div>
      </div>

      {
        transactions && <TableTwoCopy transactions={transactions} />
      }

    </DefaultLayout>
  </Menu>
  )
}else{
  return(
    <LoginPage />
  )
}
}