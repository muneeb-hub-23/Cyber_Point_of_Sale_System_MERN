import Image from "next/image";
import { Product } from "@/types/product";

const productData: Product[] = [
  {
    image: "/images/user/user-01.png",
    name: "Muhammad Muneeb Baig",
    transactiontype: "Mall Dia",
    value: 10000,
    oldbalance: 0,
    newbalance: 10000,
  }
];

const TableTwo = () => {
  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="px-4 py-6 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Entries
        </h4>
      </div>

      <div className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
        <div className="col-span-3 flex items-center">
          <p className="font-medium">Customer Name</p>
        </div>
        <div className="col-span-2 hidden items-center sm:flex">
          <p className="font-medium">Entry Type</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Value</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Old Balance</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">New Balance</p>
        </div>
      </div>

      {productData.map((product, key) => (
        <div
          className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
          key={key}
        >
          <div className="col-span-3 flex items-center">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <p className="text-sm text-black dark:text-white">
                {product.name}
              </p>
            </div>
          </div>
          <div className="col-span-2 hidden items-center sm:flex">
            <p className="text-sm text-black dark:text-white">
              {product.transactiontype}
            </p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">
              {product.value}
            </p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">{product.oldbalance}</p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className={`text-sm ${product.newbalance>0 ? ("text-green-600"):("text-red")} font-bold`}>{product.newbalance}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TableTwo;
