import React from 'react'
import Time from './Time'

const Footer = ({user,selectedDate,setSelectedDate,currentTime,setCurrentTime,total}) => {
  return (
    <div className='w-9/12 flex fixed text-md justify-between items-center bg-boxdark bottom-0 left-0 text-white border-slate-500 border-t-2 h-36'>
    <div className="w-1/3">
        <Time user={user} selectedDate={selectedDate} setSelectedDate={setSelectedDate} currentTime={currentTime} setCurrentTime={setCurrentTime} />
    </div>
    <div className='w-1/3 p-1'>


    </div>
    <div className='w-1/3 p-1'>

        <div className='flex justify-around ml-auto hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300 text-rose-500 font-bold w-full p-2'>
            <div className='w-1/2'>Total Items</div>
            <div className='w-1/2'>{total && total.cartdiscount}</div>
        </div>

        <div className='flex justify-around hover:shadow-[0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.6)] transition-shadow duration-300 ml-auto text-green-500 font-bold text-xl w-full p-2'>
            <div className='w-1/2'>Total Amount:</div>
            <div className='w-1/2'>{total && total.totalamount}</div>
        </div>
    </div>

</div>
  )
}

export default Footer
