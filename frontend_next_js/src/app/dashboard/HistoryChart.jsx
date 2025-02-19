"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import dayjs from "dayjs";
import apiaddress from "@/apirequests/apiaddress";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const options = {
  legend: {
    show: false,
    position: "top",
    horizontalAlign: "left",
  },
  colors: ["#3C50E0", "#80CAEE"],
  chart: {
    fontFamily: "Satoshi, sans-serif",
    height: 335,
    type: "area",
    dropShadow: {
      enabled: true,
      color: "#623CEA14",
      top: 10,
      blur: 4,
      left: 0,
      opacity: 0.1,
    },
    toolbar: {
      show: false,
    },
  },
  stroke: {
    width: [2, 2],
    curve: "straight",
  },
  grid: {
    xaxis: {
      lines: {
        show: true,
      },
    },
    yaxis: {
      lines: {
        show: true,
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
  markers: {
    size: 4,
    colors: "#fff",
    strokeColors: ["#3056D3", "#80CAEE"],
    strokeWidth: 3,
    strokeOpacity: 0.9,
    strokeDashArray: 0,
    fillOpacity: 1,
    hover: {
      sizeOffset: 5,
    },
  },
  xaxis: {
    type: "category",
    categories: [], // Will be set dynamically based on time range
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  yaxis: {
    title: {
      style: {
        fontSize: "0px",
      },
    },
    min: 0,
    max: 100, // This will be dynamically updated based on the largest value
  },
};

const ChartOne = ({selectedShop}) => {
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);
  const token = localStorage.getItem("token")
  const [timePeriod, setTimePeriod] = useState("day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalWasool, setTotalWasool] = useState(0);
  const [totalMallDia, setTotalMallDia] = useState(0);

  const fetchData = async (period,a) => {
    try {

      const response = await axios.get(`${apiaddress}/dashboard/analytics?period=${period}&shop=${a}`, {
        headers: {
          token
        }
      });
      
      const data = response.data;
  
      const wasoolData = data.map(item => item.wasool);
      const mallDiaData = data.map(item => item.mallDia);
      const categories = data.map(item => item.label); // e.g., "16-Oct", "17-Oct" for days
  
      // Calculate the sum of Wasool and Mall Dia
      const totalWasoolSum = wasoolData.reduce((acc, curr) => acc + curr, 0);
      const totalMallDiaSum = mallDiaData.reduce((acc, curr) => acc + curr, 0);
  
      setSeries([
        { name: "Total Wasool", data: wasoolData },
        { name: "Total Mall Dia", data: mallDiaData },
      ]);
      setCategories(categories);
  
      // Set the total values
      setTotalWasool(totalWasoolSum);
      setTotalMallDia(totalMallDiaSum);
  
      // Set start and end date for the period
      setStartDate(data[0].date);
      setEndDate(data[data.length - 1].date);
  
      // Adjust the chart's max y-axis value to avoid touching the top
      const maxYValue = Math.max(...wasoolData, ...mallDiaData) * 1.2;
      options.yaxis.max = maxYValue; // Set y-axis max to 120% of the highest value
  
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const handleTimePeriodChange = (period) => {
    setTimePeriod(period);
    fetchData(period,selectedShop && selectedShop._id,token);
  };

  useEffect(() => {
    fetchData("day",selectedShop && selectedShop._id,token); // Default to 'day' on load
  }, [selectedShop]);

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
        <div className="flex w-full flex-wrap gap-3 sm:gap-5">
          <div className="flex min-w-47.5">
            <span className="mr-2 mt-1 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-primary">
              <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-primary"></span>
            </span>
            <div className="w-full">
              <p className="font-semibold text-primary">Total Wasool</p>
              <p className="text-sm font-medium">{startDate} - {endDate}</p>
              <p className="text-lg font-bold">{totalWasool.toLocaleString()} Rs</p> {/* Display the total sum */}
            </div>
          </div>
          <div className="flex min-w-47.5">
            <span className="mr-2 mt-1 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-secondary">
              <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-secondary"></span>
            </span>
            <div className="w-full">
              <p className="font-semibold text-secondary">Total Mall Dia</p>
              <p className="text-sm font-medium">{startDate} - {endDate}</p>
              <p className="text-lg font-bold">{totalMallDia.toLocaleString()} Rs</p> {/* Display the total sum */}
            </div>
          </div>
        </div>
        <div className="flex w-full max-w-45 justify-end">
          <div className="inline-flex items-center rounded-md bg-whiter p-1.5 dark:bg-meta-4">
            <button onClick={() => handleTimePeriodChange("day")} className={`rounded px-3 py-1 text-xs font-medium ${timePeriod === "day" ? "bg-primary text-white" : "text-black"} shadow-card hover:bg-white hover:shadow-card dark:bg-boxdark dark:text-white dark:hover:bg-boxdark`}>
              Day
            </button>
            <button onClick={() => handleTimePeriodChange("week")} className={`rounded px-3 py-1 text-xs font-medium ${timePeriod === "week" ? "bg-primary text-white" : "text-black"} hover:bg-white hover:shadow-card dark:text-white dark:hover:bg-boxdark`}>
              Week
            </button>
            <button onClick={() => handleTimePeriodChange("month")} className={`rounded px-3 py-1 text-xs font-medium ${timePeriod === "month" ? "bg-primary text-white" : "text-black"} hover:bg-white hover:shadow-card dark:text-white dark:hover:bg-boxdark`}>
              Month
            </button>
            <button onClick={() => handleTimePeriodChange("year")} className={`rounded px-3 py-1 text-xs font-medium ${timePeriod === "year" ? "bg-primary text-white" : "text-black"} hover:bg-white hover:shadow-card dark:text-white dark:hover:bg-boxdark`}>
              Year
            </button>
          </div>
        </div>
      </div>

      <div>
        <div id="chartOne" className="-ml-5">
          <ReactApexChart
            options={{ ...options, xaxis: { ...options.xaxis, categories } }}
            series={series}
            type="area"
            height={350}
            width={"100%"}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartOne;
