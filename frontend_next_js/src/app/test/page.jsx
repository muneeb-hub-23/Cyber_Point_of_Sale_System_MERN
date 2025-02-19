// 'use client'
// import React, { useState } from "react";
// import DefaultLayout from "@/components/Layouts/DefaultLayout";
// import apiaddress from "@/apirequests/apiaddress";

// function App({billData}) {
//   const [iframeSrc, setIframeSrc] = useState("");

//   const fetchReceipt = async () => {
//     const response = await fetch(apiaddress+"/print", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(billData),
//     });

//     if (response.ok) {
//       // Convert response to blob URL for iframe
//       const blob = await response.blob();
//       const blobUrl = URL.createObjectURL(blob);
//       setIframeSrc(blobUrl);
//     } else {
//       console.error("Failed to fetch receipt");
//     }
//   };

//   return (
//     <DefaultLayout>
//       <h1>Receipt Viewer</h1>
//       <button onClick={fetchReceipt}>Generate Receipt</button>
//       {iframeSrc && (
//         <iframe
//           src={iframeSrc}
//           title="Receipt"
//           style={{
//             width: "100%",
//             height: "500px",
//             border: "1px solid #ccc",
//           }}
//         />
//       )}
//     </DefaultLayout>
//   );
// }

// export default App;

import React from 'react'

const page = () => {
  return (
    <div>
      
    </div>
  )
}

export default page
