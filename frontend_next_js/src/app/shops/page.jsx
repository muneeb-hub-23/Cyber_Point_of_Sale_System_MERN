"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import TableOneCustomer from "@/components/Tables/TableOneCustomer";
import { useEffect, useState } from "react";
import { ToastContainer, toast ,Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apiaddress from "../../apirequests/apiaddress";
import Menu from '@/components/Menu'
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";
const Page = () => {
  const [shops,setShops] = useState(null)
  const {user} = useGlobalState()
  const token = localStorage.getItem("token")
  const fetchShops = async()=>{
    let string = `${apiaddress}/shop/retrieveshops`
    let data = await fetch(string,{
      method:"GET",
      headers:{
        token
      }
    })
    let parsed = await data.json()
    setShops(parsed)
}

  useEffect(()=>{

    fetchShops()
},[])
if(user && user.permissions.includes("shops")){
  return (
    <Menu>
    <DefaultLayout>
      <ToastContainer />
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Shops List" />
      </div>
      <div className="min-h-[100vh]">

      <TableOneCustomer title={"Shops List"} brandData={shops} colNames={["Shop Name","Customers","Lene Hain","Dene Hain","Delete Shop"]} />
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
