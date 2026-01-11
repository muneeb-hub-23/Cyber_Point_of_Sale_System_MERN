import { useGlobalState } from "@/js/globaluser"
import axios from "axios"; // For making API requests
import apiaddress from "@/apirequests/apiaddress";
import React, { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { useRouter } from "next/navigation";

export default function InnerRootLayout({ children }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true);
  const {user, setUser } = useGlobalState();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      localStorage.removeItem('token')
      router.push('/')
      setLoading(false)
    }
    else {
      // If token exists in localStorage, verify it with the backend
      axios
        .post(`${apiaddress}/authentication/verify`, null, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          if (response.status === 200) {
            // If the token is valid, set the user in global state
            setUser(response.data.user); // Assuming the response contains the user object
          }else{
            localStorage.removeItem('token')
            router.push('/')
          }
        })
        .catch((error) => {
          console.error("Token verification failed:", error);
          localStorage.removeItem("token"); // Clear token if verification fails
          router.push('/')
        })
        .finally(() => {
          // Stop the loading state after the verification process
          setLoading(false);
        });
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <title>Cyber POS</title>
        <meta
          name="description"
          content="This is a Complete Khata Management App By Muneeb Baig | Cyber Dreams"
        ></meta>
        <link rel="icon" href="/images/logo/logo.ico" sizes="any" />
      </head>
      <body suppressHydrationWarning={true}>
        <div className="dark:bg-boxdark-2 dark:text-bodydark">
          {loading ? <Loader /> : children}
        </div>
      </body>
    </html>
  );
}