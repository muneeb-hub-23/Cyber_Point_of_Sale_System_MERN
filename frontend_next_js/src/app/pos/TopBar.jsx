import React from 'react';
import apiaddress from '@/apirequests/apiaddress';
import { MdOutlineCategory } from "react-icons/md";
import { BiSolidRename } from "react-icons/bi";
import { FaBarcode } from "react-icons/fa6";
import Image from 'next/image';

const TopBar = ({ searchTerm, handleSearchChange, products, suggestions, setSuggestions, helper, handleBlur, searchRef, searchType, setSearchType }) => {
  return (
    <div className="w-9/12 fixed flex bg-boxdark top-0 left-0 border-b-2 h-12 shadow-lg transition-all duration-300">
      <button onClick={() => { setSearchType('barcode'); searchRef.current.focus() }} className={`text-white ${searchType === 'barcode' ? 'border-b-2 border-blue-600' : ''} hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg m-2`}>
        <FaBarcode />
      </button>
      <button onClick={() => { setSearchType('name'); searchRef.current.focus() }} className={`text-white ${searchType === 'name' ? 'border-b-2 border-blue-600' : ''} hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg m-2`}>
        <BiSolidRename />
      </button>
      <button onClick={() => { setSearchType('category'); searchRef.current.focus() }} className={`text-white ${searchType === 'category' ? 'border-b-2 border-blue-600' : ''} hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg m-2`}>
        <MdOutlineCategory />
      </button>

      <input
        type="text"
        ref={searchRef}
        value={searchTerm}
        onChange={handleSearchChange}
        onFocus={() => {
          if (searchTerm.length > 0) {
            let filteredProducts = [];

            if (searchType === 'barcode') {
              filteredProducts = products.filter((product) =>
                product.itemCode && Number(product.itemCode) === Number(searchTerm)
              );
            } else if (searchType === 'name') {
              filteredProducts = products.filter((product) =>
                product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())
              );
            } else if (searchType === 'category') {
              filteredProducts = products.filter((product) =>
                product.category && product.category.name && product.category.name.toLowerCase().includes(searchTerm.toLowerCase())
              );
            }

            setSuggestions(filteredProducts);
          }
        }}
        onBlur={handleBlur}
        className="w-full text-white p-1 m-1 bg-transparent outline-none"
        placeholder="Search Products"
        autoFocus
      />

      {suggestions.length > 0 && (
        <ul className="absolute top-16 pt-8 text-white w-full bg-blue-500 z-50 text-gray-200 border border-gray-500 rounded-lg shadow-2xl max-h-[60vh] overflow-y-auto mt-1 p-2">
          <div className='flex w-full bg-blue-800 border-gray-500 border-b-2 sticky top-0 z-10'>

            <div className='w-1/12 p-2 text-center'>Item Shop</div>
            <div className='w-1/12 p-2 text-center'>Item Code</div>
            <div className='w-1/12 p-2 text-center'>Image</div>
            <div className='w-6/12 p-2'>Item Name</div>
            <div className='w-1/12 p-2 text-center'>Qty/Pack</div>
            <div className='w-1/12 p-2 text-center'>On Hand</div>
            <div className='w-1/12 p-2 text-center'>Sale Price</div>
          </div>
          {suggestions.map((product) => (
            <div key={product._id} onClick={() => { helper(product); }} className='flex cursor-pointer bg-black w-full items-center border-gray-500 border-dotted border-b-2 bg-gray-700'>
              <div className='w-1/12 p-2 text-center'>{product.shop.shopName}</div>
              <div className='w-1/12 p-2 text-center'>{product.itemCode}</div>
              <div className='w-1/12 p-2 text-center'>
                <Image height={90} width={90} className='mx-auto rounded-md' alt='Product' src={apiaddress + product.picture[0]} />
              </div>
              <div className='w-6/12 p-2'>{product.name}</div>
              <div className='w-1/12 p-2 text-center'>{product.unit}</div>
              <div className='w-1/12 p-2 text-center'>{product.onHand.toFixed(2)}</div>
              <div className='w-1/12 p-2 text-center'>{product.sale}</div>
            </div>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TopBar;
