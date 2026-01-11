import apiaddress from "@/apirequests/apiaddress";
export const getReport = async (doctype, criteria,startdate,enddate,setIframeSrc,setShowingReport,token,shopid='all',customerid='all',supplierid='all') => {
  let response;
  if (doctype === "sales") {
    if (criteria === "daily") {
      response = await fetch(apiaddress + '/reporting/sales/daily', {
        method: "GET",
        headers: {
          token,
          doctype,
          criteria
        }
      })
    }
  }else if(doctype==="detailed"){
    if(criteria==="daily"){
      response = await fetch(apiaddress + '/reporting/detailed/daily', {
        method: "GET",
        headers: {
          token,
          doctype,
          criteria,
          startdate,
          enddate,
          shopid: shopid || 'all'
        }
      })
    }
  }else if(doctype==="latepayments"){
    response = await fetch(apiaddress + '/reporting/latepayments/report', {
      method: "GET",
      headers: {
        token,
        shopid: shopid || 'all',
        customerid: customerid || 'all'
      }
    })
  }else if(doctype==="productsales"){
    response = await fetch(apiaddress + '/reporting/productsales/report', {
      method: "GET",
      headers: {
        token,
        startdate,
        enddate,
        shopid: shopid || 'all',
        customerid: customerid || 'all',
        supplierid: supplierid || 'all'
      }
    })
  }else if(doctype==="suppliersales"){
    response = await fetch(apiaddress + '/reporting/suppliersales/report', {
      method: "GET",
      headers: {
        token,
        startdate,
        enddate,
        shopid: shopid || 'all',
        customerid: customerid || 'all',
        supplierid: supplierid || 'all'
      }
    })
  }else if(doctype==="purchases"){
    response = await fetch(apiaddress + '/reporting/purchases/report', {
      method: "GET",
      headers: {
        token,
        startdate,
        enddate,
        shopid: shopid || 'all',
        supplierid: supplierid || 'all'
      }
    })
  }else if(doctype==="supplierpurchases"){
    response = await fetch(apiaddress + '/reporting/supplierpurchases/report', {
      method: "GET",
      headers: {
        token,
        startdate,
        enddate,
        shopid: shopid || 'all',
        supplierid: supplierid || 'all'
      }
    })
  }
  if (response.ok) {
    // Convert response to blob URL for iframe
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    setIframeSrc(blobUrl);
    setShowingReport(true)

  } else {
    console.error("Failed to fetch receipt");
  }
}