"use client"
import React, { useEffect, useState } from 'react'
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import CardDataStats from "@/components/CardDataStats";
import HistoryChart from './HistoryChart'
import ChartTwo from '@/components/Charts/ChartTwo';
import { FcMoneyTransfer } from "react-icons/fc";
import { FcCurrencyExchange } from "react-icons/fc";
import { FcBusinessman } from "react-icons/fc";
import { FcManager } from "react-icons/fc";
import { GiTireIronCross } from "react-icons/gi";
import { fetchShops } from '@/apirequests/getcustomersbyshopid';
import apiaddress from '@/apirequests/apiaddress';
import Link from 'next/link';
import {useGlobalState} from "@/js/globaluser"
import { useRouter } from 'next/navigation';
import Menu from '@/components/Menu'
import LoginPage from '../authentication/login/page';

const Page = () => {
    const router = useRouter()
    const token = localStorage.getItem("token")
    const [shops,setShops] = useState(undefined)
    const [selectedShop,setSelectedShop] = useState(undefined)
    const [blacklist,setBlackList] = useState(undefined)
    const {user} = useGlobalState()

    const handleShopChange = async (e)=>{


        let final = await shops.find((element) => {
            return element._id === e.target.value;
          });
        
        setSelectedShop(final)
        let x = await fetch(apiaddress+"/customers/getblacklist",{
            method:"GET",
            headers:{
                "shopid":e.target.value,
                token
            }
        })
        let parsed = await x.json()
        setBlackList(parsed)
}

    useEffect(()=>{

        fetchShops(token).then(data=> {
            setShops(data);
            setSelectedShop(data[0])
            fetch(apiaddress+"/customers/getblacklist",{
                method:"GET",
                headers:{
                    "shopid":data[0]._id,
                    token
                }
            }).then(async data=>{
                data.json().then(parsed=>setBlackList(parsed))
                
            })
        })

    },[])
if(user && user.permissions.includes("dashboard")){
    return (
        <Menu>
        <DefaultLayout>
            <select onChange={handleShopChange} value={selectedShop && selectedShop._id} className='w-full my-3 text-xl shadow-md py-3 pl-5 dark:text-white dark:bg-boxdark' name="shopid" id="shopid">
                {shops && shops.map((shop)=>(
                    <option key={shop._id} value={shop._id}>{shop.shopName}</option>
                ))}
            </select>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
                <CardDataStats title="Total Lene Hain" total={selectedShop && selectedShop.lenehain.toFixed(2).toString()} rate="" levelUp>
                <FcMoneyTransfer className='text-4xl' />
                </CardDataStats>
                <CardDataStats title="Total Dene Hain" total={selectedShop && selectedShop.denehain.toFixed(2).toString()} rate="" levelDown>
                   <FcCurrencyExchange className='text-4xl' />
                </CardDataStats>
                <CardDataStats title="Total Customers" total={selectedShop && selectedShop.customers.toString()} rate="" levelUp>
                   <FcBusinessman className='text-4xl' />
                </CardDataStats>
                <Link className='cursor-pointer hover:scale-105 transition-all hover:border hover:border-blue-600' href={`/dashboard/blacklist/${selectedShop && selectedShop._id}`}>
                <CardDataStats title="Blacklist Customers" total={blacklist && blacklist.length} rate="" levelDown>
                   <FcManager className='text-4xl' />
                   <GiTireIronCross className='text-3xl text-red absolute mt-2' />
                </CardDataStats>
                </Link>
            </div>

            {/* <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
                <HistoryChart selectedShop={selectedShop && selectedShop} />
                <ChartTwo />
            </div> */}

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
