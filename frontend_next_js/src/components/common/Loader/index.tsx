import React from "react";
const Loader = () => {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-boxdark">
    <div className="flex justify-center items-center mb-8">
      <div className="loader border-t-4 border-b-4 border-blue-500 rounded-full w-36 h-36 animate-spin text-sm text-transparent">.</div>
    </div>
    <div className="mt-4">

    </div>
  </div>
  );
};

export default Loader;
