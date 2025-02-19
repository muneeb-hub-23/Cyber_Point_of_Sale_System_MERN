"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useEffect, useState } from "react";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apiaddress from "../../../../../apirequests/apiaddress"
import { getCustomerByID } from "@/apirequests/getcustomersbyshopid";
import { useParams } from "next/navigation";
import Switcherx from "@/components/Switchers/Switcherx";
import Menu from '@/components/Menu'
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";

const ModifyCustomer = () => {
  const {user} = useGlobalState()
  const token = localStorage.getItem("token")
  const params = useParams()
  const [isCustomer,setIsCustomer] = useState(false)
  const [formData, setFormData] = useState({

    customerName: "",
    customerMobileNumber: "",
    customerCnic: "",
    customerEmail: "",
    customerAddress: "",
    linkedShop: ""

  })
  const [shops, setShops] = useState(null)
  const handleChange = (e) => {

    setFormData({ ...formData, [e.target.name]: e.target.value })

  }
  const handleCustomer = (e)=>{
    setIsCustomer(e.target.value)
}
  const modifyCustomer = async(e)=>{
    e.preventDefault()
    if(formData.linkedShop!=="" & formData.customerMobileNumber.length!== 11 & formData.customerName!== ""){
    let check = confirm("Are Sure You Want To Edit ?")
    if(check){
      let b = formData;
      b.customerType = isCustomer ? "customer":"supplier"
      let response = await fetch(apiaddress+"/customers/modifycustomer",{
        method:"DELETE",
        headers:{
          "Content-Type":"application/json",
          token
        },
        body:JSON.stringify(b)
      })
      let parsed = await response.json()
      if(parsed.status){
        alert("Customer Modified")
      }
    }
  }}


  useEffect(() => {
    const fetchShops = async () => {
      let data = await fetch(apiaddress + "/shop/retrieveshops",
        {
          method:"GET",
          headers:{
            token
          }
        }
      )
      let parsed = await data.json()
      setShops(parsed)
      getCustomerByID(params.slug,token).then(data=>{
        setFormData(data[0])
        setIsCustomer(data[0].customerType ==="supplier"?false:true)
      })
    }

    fetchShops()
  }, [])
if(user && user.permissions.includes("modifycustomerform")){
  return (
    <Menu>
    <DefaultLayout>
      <ToastContainer />
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Modify Customer Form" />

      </div>
      <div className='min-h-[100vh]'>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

        <form action="#">
          <div className="p-6.5">
            <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">

              <div className="w-full xl:w-1/2">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Customer Name
                </label>
                <input
                  required
                  name="customerName"
                  onChange={handleChange}
                  value={formData.customerName}
                  type="text"
                  placeholder="Customer Name"
                  className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  autoFocus
                />
              </div>

              <div className="w-full xl:w-1/2">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Mobile Number <span className="text-meta-1">*</span>
                </label>
                <input
                  required
                  name="customerMobileNumber"
                  onChange={handleChange}
                  value={formData.customerMobileNumber}
                  type="number"
                  placeholder="Mobile Number"
                  className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

            </div>
            <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">

              <div className="w-full xl:w-1/2">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Customer CNIC
                </label>
                <input
                  name="customerCnic"
                  onChange={handleChange}
                  value={formData.customerCnic}
                  type="number"
                  placeholder="Customer CNIC"
                  className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="w-full xl:w-1/2">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Customer Email <span className="text-meta-1">*</span>
                </label>
                <input
                  name="customerEmail"
                  onChange={handleChange}
                  value={formData.customerEmail}
                  type="email"
                  placeholder="Customer Email"
                  className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

            </div>

            <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">

              <div className="w-full xl:w-1/2">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Customer Address
                </label>
                <input
                  name="customerAddress"
                  onChange={handleChange}
                  value={formData.customerAddress}
                  type="text"
                  placeholder="Customer Address"
                  className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="w-full xl:w-1/2">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Linked Shop
                </label>
                <select
                  name="linkedShop"
                  onChange={handleChange}
                  value={formData.linkedShop}
                  type="text"
                  placeholder="Linked Shop"
                  className="w-full rounded border-2 border-slate-400 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                  {shops && shops.map((shop) => (
                    <option key={shop._id} value={shop._id}>{shop.shopName}</option>
                  ))}
                </select>
              </div>
              <div className="w-full xl:w-1/2">
                                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                    Is It Customer or Supplier
                                </label>
                                <div className="flex space-x-3 justify-left">
                                <Switcherx enabled={isCustomer} onChange={handleCustomer} setEnabled={setIsCustomer} id={'iscustomer'} />
                                <div className="pl-10">
                                {isCustomer ? "Customer":"Supplier"}
                                </div>
                                </div>
                            </div>

            </div>



            <button onClick={modifyCustomer} className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90">
              Modify Customer
            </button>
          </div>
        </form>
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


export default ModifyCustomer;

