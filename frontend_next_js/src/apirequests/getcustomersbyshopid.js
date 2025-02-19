import apiaddress from "./apiaddress";
import { Bounce, toast } from "react-toastify";
export const toastParser = async (parsed, next) => {
  if (parsed.success) {
    toast(parsed.message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      transition: Bounce,
    });
    await next()
  } else {
    toast.error(parsed.message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
      transition: Bounce,
    });
  }
}
export const sortCustomersByName = (customers) => {
  return customers.sort((a, b) => {
    const nameA = a.customerName.toLowerCase();
    const nameB = b.customerName.toLowerCase();

    // Compare the first letter of each name
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
}
export const sortCustomersByNumber = (customers) => {
  return customers.sort((a, b) => {
    const nameA = a.customerMobileNumber;
    const nameB = b.customerMobileNumber;

    // Compare the first letter of each name
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
}
export const fetchCustomers = async (shopid, token) => {
  let data = await fetch(`${apiaddress}/customers/getcustomersbyshop`, {
    method: "GET",
    headers: {
      shopid,
      token
    }
  })
  let parsed = await data.json()
  let tota = await sortCustomersByName(parsed)
  return tota;
}
export const getCustomerByID = async (customerid, token) => {
  let data = await fetch(`${apiaddress}/customers/getcustomerbyid`, {
    method: "GET",
    headers: {
      customerid,
      token
    }
  })
  let parsed = await data.json()
  let tota = await sortCustomersByName(parsed)
  return tota;
}
export const customSort = (arr) => {
  return arr.sort((a, b) => {
    if (a.toUpperCase() === b.toUpperCase()) {
      return a.localeCompare(b);
    }
    return a.toUpperCase().localeCompare(b.toUpperCase());
  });
}
export const fetchShops = async (token) => {
  let data = await fetch(apiaddress + "/shop/retrieveshops", {
    method: "GET",
    headers: {
      token
    }
  })
  let parsed = await data.json()
  return parsed
}
export const fetchTransactions = async (shopid, page = 1, limit = 10, token) => {
  const skip = (page - 1) * limit;

  try {
    let data = await fetch(apiaddress + '/transaction/gettransactions?page=' + page + '&limit=' + limit, {
      method: 'GET',
      headers: {
        'shopid': shopid,
        token
      }
    });

    const parsedData = await data.json();
    return parsedData.reverse();  // Optionally reverse the order, as you're doing in the original function
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}
export const fetchTransactionsByID = async (customerid, token) => {
  let data = await fetch(apiaddress + "/customers/gettransactionsbyid", {
    method: "GET",
    headers: {
      customerid,
      token
    }
  })
  let parsed = await data.json()
  return parsed.reverse()
}
export const formatDateTime = (dateString) => {
  // Parse the date string into a Date object
  const date = new Date(dateString);

  // Array for month names
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Extract day, month, and year
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  // Extract hour and minute and format them
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // Hour '0' should be '12'

  // Format minutes to always show two digits
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

  // Create formatted date-time string
  const formattedDateTime = `${day}-${month}-${year}, ${hours}:${formattedMinutes} ${ampm}`;

  return formattedDateTime;
}
export const formatDateTime2 = (input) => {
  // Extract year, month, and day from the input
  const year = input.substring(0, 4);
  const month = input.substring(4, 6);
  const day = input.substring(6, 8);

  // Define an array of month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Convert the month number to the month name
  const monthName = monthNames[parseInt(month) - 1];

  // Return the formatted date
  return `${day}-${monthName}-${year}`;
}
export const handleDeleteTransaction = async (tid, toast, next, token) => {
  let verify = prompt("Type delete if you are sure to delete this transaction")
  if (verify === "delete") {
    let response = await fetch(apiaddress + "/transaction/deletetransaction", {
      method: "DELETE",
      headers: {
        'tid': tid,
        token
      }
    })
    let parsed = await response.json()
    await toastParser(parsed, next)
  }
}