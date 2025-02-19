import React from 'react';

const QuantitySetter = ({ quantity, setQuantity, inputRef, reference }) => {
    return (
        <div ref={reference} id='quantitydiv' className='fixed z-999 -top-[100vh] left-72 w-1/3 h-3/5 p-5 px-12 pr-16 space-y-4 flex flex-col items-center justify-center space-x-4 border-2 text-center bg-blue-800 rounded-lg border-white transition-all'>
            <h3 className='text-4xl font-bold text-white'>Set Quantity</h3>
            
            <input 
                id='quantity' 
                onChange={(e) => setQuantity(e.target.value)} 
                ref={inputRef} 
                className='text-right w-full text-3xl bg-boxdark border-2 border-white text-white font-bold' 
                type="text" 
                placeholder='Enter Price' 
                value={quantity} 
            />
            
        </div>
    );
};

export default QuantitySetter;
