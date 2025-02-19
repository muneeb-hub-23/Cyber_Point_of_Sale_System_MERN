import React from 'react';
import Link from 'next/link';
import { MdOutlineProductionQuantityLimits } from 'react-icons/md';
import { ImCancelCircle } from 'react-icons/im';
import { FaPersonRays } from 'react-icons/fa6';
import { HiReceiptRefund } from 'react-icons/hi2';
import { MdOutlineDeleteOutline } from "react-icons/md";
import { MdAddShoppingCart } from "react-icons/md";
import { MdOutlinePointOfSale } from "react-icons/md";
import { FaHouseDamage } from "react-icons/fa";
import { TbTruckReturn } from "react-icons/tb";
import { GiExpense } from "react-icons/gi";




const FunctionsPanel = ({ selected, setCustomerSelecting, customer, clearCustomer, deleteItem, changeQty, openFinalize, discref, copyDiscount }) => {
    return (
        <div className='w-full text-white text-center'>
            <div className='flex justify-around space-x-3 p-3'>
                <div
                    className="w-1/3 min-h-20 border-slate-500 cursor-pointer border-2 p-2 rounded-md hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300"
                    onClick={changeQty}
                >
                    <MdOutlineProductionQuantityLimits className='text-green-500 text-4xl mx-auto' />
                    <p className='text-green-500 mx-auto'>Change Qty</p>
                </div>

                <div
                    className="w-1/3 min-h-20 border-slate-500 cursor-pointer border-2 p-2 rounded-md hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300"
                    onClick={deleteItem}
                >
                    <ImCancelCircle className='text-rose-500 text-4xl mx-auto' />
                    <p className='text-rose-500 mx-auto'>Delete Item</p>
                </div>
            </div>

            <div className='flex space-x-3 p-3'>
                <div
                    className={`${(selected === 'sale' || selected === 'refund') ? 'w-7/12':'w-full'} min-h-20 border-slate-500 cursor-pointer border-2 p-1 rounded-md hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300`}
                    onClick={() => setCustomerSelecting(true)}
                >
                    <FaPersonRays className='text-green-500 text-4xl mx-auto' />
                    <p className='text-green-500 mx-auto'>Customer | Supplier</p>
                    <p className='text-green-500 mx-auto text-lg'>{customer && customer.customerName} <MdOutlineDeleteOutline className='text-rose-600 inline text-lg' onClick={() => { clearCustomer && clearCustomer(undefined) }} /></p>
                </div>
                {(selected === 'sale' || selected === 'refund') && 
                <div
                    className="w-5/12 min-h-20 flex flex-col justify-center items-center space-y-2 border-slate-500 cursor-pointer border-2 p-1 rounded-md hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300"
                >

                    <div onClick={()=>{copyDiscount("amount")}} className='w-full rounded-md p-1 text-sm bg-blue-600 hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300'>
                        <p>
                            Copy Discount Amount
                        </p>
                    </div>
                    <div onClick={()=>{copyDiscount("percentage")}} className='w-full rounded-md p-1 text-sm bg-blue-600 hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300'>
                        <p>
                            Copy Discount Percentage
                        </p>
                    </div>

                </div>
}
            </div>

            <div className='flex space-x-3 p-3'>
                <div className={`w-1/3 min-h-20 ${selected === 'sale' ? 'border-blue-600 border-4' : 'border-slate-300 border-2'} cursor-pointer p-2 rounded-md hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300`}>
                    <Link href={'/pos/sale'}>
                        <MdOutlinePointOfSale className='text-green-500 text-4xl mx-auto' />
                        <p className='text-green-500 mx-auto'>Sales</p>
                    </Link>
                </div>
                <div
                    className={`w-1/3 min-h-20 cursor-pointer ${selected === 'purchase' ? 'border-blue-600 border-4' : 'border-slate-300 border-2'} p-2 rounded-md hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300`}
                >
                    <Link href={'/pos/purchase'}>
                        <MdAddShoppingCart className='text-green-500 text-4xl mx-auto' />
                        <p className='text-green-500 mx-auto'>Purchase</p>
                    </Link>
                </div>
                <div
                    className={`w-1/3 min-h-20 cursor-pointer ${selected === 'refund' ? 'border-blue-600 border-4' : 'border-slate-300 border-2'} p-2 rounded-md hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300`}
                >
                    <Link href={'/pos/refund'}>
                        <HiReceiptRefund className='text-green-500 text-4xl mx-auto' />
                        <p className='text-green-500 mx-auto'>Refund</p>
                    </Link>
                </div>
            </div>

            <div className='flex space-x-3 p-3'>
                <div
                    className={`w-1/3 min-h-20 ${selected === 'loss' ? 'border-blue-600 border-4' : 'border-slate-300 border-2'} cursor-pointer p-2 rounded-md hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300`}
                >
                    <Link href={'/pos/loss'}>
                        <FaHouseDamage className='text-green-500 text-4xl mx-auto' />
                        <p className='text-green-500 mx-auto'>Losses</p>
                    </Link>
                </div>
                <div
                    className={`w-1/3 min-h-20 ${selected === 'stockreturn' ? 'border-blue-600 border-4' : 'border-slate-300 border-2'} cursor-pointer p-2 rounded-md hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300`}
                >
                    <Link href={'/pos/stockreturn'}>
                        <TbTruckReturn className='text-green-500 text-4xl mx-auto' />
                        <p className='text-green-500 mx-auto'>Stock Return</p>
                    </Link>
                </div>
                <div
                    className={`w-1/3 min-h-20 ${selected === 'expense' ? 'border-blue-600 border-4' : 'border-slate-300 border-2'} cursor-pointer p-2 rounded-md hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300`}
                >
                    <Link href={'/pos/stockreturn'}>
                        <GiExpense className='text-green-500 text-4xl mx-auto' />
                        <p className='text-green-500 mx-auto'>Expense</p>
                    </Link>
                </div>
            </div>

            <hr className='text-slate-500' />

            <button
                onClick={() => { openFinalize(true); discref.current && discref.current.focus(); }}
                className={`text-3xl p-5 rounded-md w-10/12 mt-3 border-2 border-graydark bg-green-500 text-white font-bold hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300`}
            >
                Finalize
            </button>
        </div>
    );
};

export default FunctionsPanel;
