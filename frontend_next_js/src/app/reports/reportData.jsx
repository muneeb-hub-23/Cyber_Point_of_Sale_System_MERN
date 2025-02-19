import apiaddress from "@/apirequests/apiaddress";
export const getReport = async (doctype, criteria,startdate,enddate,setIframeSrc,setShowingReport,token) => {
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
          enddate
        }
      })
    }
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