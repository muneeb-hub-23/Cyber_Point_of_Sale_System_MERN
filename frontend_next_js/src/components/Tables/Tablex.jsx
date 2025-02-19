"use client"

import { sortCustomersByName,sortCustomersByNumber } from "@/apirequests/getcustomersbyshopid";
import { useState } from "react";
import Link from "next/link";
const TableOne = ({ title, colNames, brandData, detail }) => {
  const [type,setType] = useState("all")
  const [type2,setType2] = useState("name")
  const handleChange = (e)=>{
    setType(e.target.value)
  }
  const handleChange2 = async (e)=>{
    setType2(e.target.value)
    if(e.target.value === "name"){
      brandData = await sortCustomersByName(brandData)
    }else{
      brandData = await sortCustomersByNumber(brandData)
    }
  }



  return (
    <div className="font-bold text-xl rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        {title}
      </h4>

      <div className="flex flex-col">
        <select className="my-5 border-b-2 border-blue-950 active:border-none" onChange={handleChange} name="type" id="type" value={type}>
          <option value="all">All Types</option>
          <option value="active">Active</option>
          <option value="notactive">Not Active</option>
        </select>
        <select className="my-5 border-b-2 border-blue-950 active:border-none" onChange={handleChange2} name="type2" id="type2" value={type2}>
          <option value="name">Sort By Name</option>
          <option value="number">Sort By Number</option>
        </select>
        <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-5">
          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              {colNames[0]}
            </h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              {colNames[1]}
            </h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              {colNames[2]}
            </h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              {colNames[3]}
            </h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              {colNames[4]}
            </h5>
          </div>

        </div>

        {brandData && brandData.map((brand, key) => {
          if(type === "all"){
            return (
              <Link href={'/customers/customerdetail/'+brand._id} key={key}>
            <div
              className={`grid grid-cols-3 sm:grid-cols-5 cursor-pointer ${key === brand[Object.keys(brand)[0]]
                  ? ""
                  : "border-b border-stroke dark:border-strokedark"
                }`}
            >
              <div className="flex items-center gap-3 p-2.5 xl:p-5">
  
                <p className="hidden text-black dark:text-white sm:block">
                  {brand[Object.keys(brand)[1]]}
                </p>
              </div>
  
              <div className="flex items-center justify-center p-2.5 xl:p-5">
                <p className="text-black dark:text-white">{brand[Object.keys(brand)[2]]}</p>
              </div>
  
              <div className="flex items-center justify-center p-2.5 xl:p-5">
                <p className="text-green-700">{brand[Object.keys(brand)[3]]}</p>
              </div>
  
              <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                <p className="text-red dark:text-white">{brand[Object.keys(brand)[4]]}</p>
              </div>
              <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                <p className={`${brand[Object.keys(brand)[9]] ? ("text-green-600"):("text-red")} dark:text-white`}>{brand[Object.keys(brand)[9]] ? ("Active"):("Not Active")}</p>
              </div>
            </div>
              </Link>
            )
          }else if(type === "active"){
              if(brand.status){
                return (
                  <Link href={'/customers/customerdetail/'+brand._id} key={key}>
                <div
                  className={`grid grid-cols-3 sm:grid-cols-5 ${key === brand[Object.keys(brand)[0]]
                      ? ""
                      : "border-b border-stroke dark:border-strokedark"
                    }`}
                >
                  <div className="flex items-center gap-3 p-2.5 xl:p-5">
      
                    <p className="hidden text-black dark:text-white sm:block">
                      {brand[Object.keys(brand)[1]]}
                    </p>
                  </div>
      
                  <div className="flex items-center justify-center p-2.5 xl:p-5">
                    <p className="text-black dark:text-white">{brand[Object.keys(brand)[2]]}</p>
                  </div>
      
                  <div className="flex items-center justify-center p-2.5 xl:p-5">
                    <p className="text-green-700">{brand[Object.keys(brand)[3]]}</p>
                  </div>
      
                  <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                    <p className="text-red dark:text-white">{brand[Object.keys(brand)[4]]}</p>
                  </div>
                  <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                    <p className={`${brand[Object.keys(brand)[9]] ? ("text-green-600"):("text-red")} dark:text-white`}>{brand[Object.keys(brand)[9]] ? ("Active"):("Not Active")}</p>
                  </div>
                </div>
                </Link>
                )
              }else{
                return
              }
          }else if(type === "notactive"){
            if(!brand.status){
              return (
                <Link href={'/customers/customerdetail/'+brand._id} key={key}>
              <div
                className={`grid grid-cols-3 sm:grid-cols-5 ${key === brand[Object.keys(brand)[0]]
                    ? ""
                    : "border-b border-stroke dark:border-strokedark"
                  }`}
              >
                <div className="flex items-center gap-3 p-2.5 xl:p-5">
    
                  <p className="hidden text-black dark:text-white sm:block">
                    {brand[Object.keys(brand)[1]]}
                  </p>
                </div>
    
                <div className="flex items-center justify-center p-2.5 xl:p-5">
                  <p className="text-black dark:text-white">{brand[Object.keys(brand)[2]]}</p>
                </div>
    
                <div className="flex items-center justify-center p-2.5 xl:p-5">
                  <p className="text-green-700">{brand[Object.keys(brand)[3]]}</p>
                </div>
    
                <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                  <p className="text-red dark:text-white">{brand[Object.keys(brand)[4]]}</p>
                </div>
                <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                  <p className={`${brand[Object.keys(brand)[9]] ? ("text-green-600"):("text-red")} dark:text-white`}>{brand[Object.keys(brand)[9]] ? ("Active"):("Not Active")}</p>
                </div>
              </div>
              </Link>)
            }else{
              return
            }
          }else{
            return
          }

})}
      </div>
    </div>
  );
};


export default TableOne;
