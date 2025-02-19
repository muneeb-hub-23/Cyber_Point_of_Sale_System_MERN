"use client";
import { useEffect, useState } from "react";
import apiaddress from "@/apirequests/apiaddress";
import Menu from "@/components/Menu";
import LoginPage from "@/app/authentication/login/page";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useGlobalState } from "@/js/globaluser";

const CustomerGroupPage = () => {
  const token = localStorage.getItem("token");
  const { user } = useGlobalState();
  const [customerGroups, setCustomerGroups] = useState([]);
  const [allShopNames, setAllShopNames] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch customer group data from the API
  const fetchCustomerGroups = async () => {
    try {
      const response = await fetch(apiaddress + "/customers/getcustomergroup", {
        method: "GET",
        headers: {
          token,
        },
      });

      const data = await response.json();
      if (data.success) {
        setCustomerGroups(data.data);

        // Collect all unique shop names from all customer groups
        const uniqueShops = new Set();
        data.data.forEach((group) => {
          group.ids.forEach((item) => {
            uniqueShops.add(item.shopID.shopName);
          });
        });
        setAllShopNames(Array.from(uniqueShops));
      } else {
        toast.error("Failed to fetch customer groups");
      }
    } catch (error) {
      toast.error("Error occurred while fetching customer groups");
    }
  };

  useEffect(() => {
    fetchCustomerGroups();
  }, []);

  // Filter customer groups based on the search term
  const filteredCustomerGroups = customerGroups.filter((group) =>
    group.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.customerMobileNumber.toString().includes(searchTerm)
  );

  if (user && user.permissions.includes("customergroup")) {
    return (
      <Menu>
      <DefaultLayout>
        <ToastContainer />
        <div className="min-h-screen bg-boxdark p-5">
          <h2 className="text-2xl font-bold text-white mb-5">Customer Groups</h2>

          {/* Search Input */}
          <div className="mb-5">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or phone"
              className="w-full rounded p-3 bg-boxdark text-white border-2 border-slate-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse text-white">
              <thead>
                <tr className="border-b bg-gray-800 text-left">
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Customer Mobile</th>
                  {/* Dynamically render column headers for all unique shop names */}
                  {allShopNames.map((shopName, index) => (
                    <th key={index} className="p-3 text-center">
                      {shopName}
                    </th>
                  ))}
                  <th className="p-3 text-center">Total Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomerGroups.length > 0 ? (
                  filteredCustomerGroups.map((group) => {
                    const { customerName, customerMobileNumber, ids } = group;
                    let totalBalance = 0;

                    return (
                      <tr key={group._id} className="border-b bg-gray-900">
                        <td className="p-3">{customerName}</td>
                        <td className="p-3">{customerMobileNumber}</td>
                        {/* Render the balances for each shop */}
                        {allShopNames.map((shopName, index) => {
                          const shopData = ids.find(
                            (item) => item.shopID.shopName === shopName
                          );

                          if (shopData) {
                            totalBalance += shopData.customerID.balance;
                            return (
                              <td key={index} className="p-3 text-center">
                                {shopData.customerID.balance}
                              </td>
                            );
                          } else {
                            return (
                              <td key={index} className="p-3 text-center text-gray-500">
                                No record
                              </td>
                            );
                          }
                        })}
                        <td className="p-3 text-center font-bold">{totalBalance}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={allShopNames.length + 3} className="text-center p-3">
                      No matching customer groups found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DefaultLayout>
      </Menu>
    );
  } else {
    return <LoginPage />;
  }
};

export default CustomerGroupPage;
