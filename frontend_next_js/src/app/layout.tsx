"use client";
import "jsvectormap/dist/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import React from "react";
import { GlobalStateProvider } from "@/js/globaluser"; // Access global state

import InnerChild from './innerchildren'

// Wrap your entire layout in GlobalStateProvider
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GlobalStateProvider>
      <InnerChild>{children}</InnerChild>
    </GlobalStateProvider>
  );
}


