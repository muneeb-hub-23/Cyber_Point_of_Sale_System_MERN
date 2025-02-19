'use client'
import React from "react";

function App({iframeSrc}) {

  return (
    <div className="absolute -left-[100vw]">
      {iframeSrc && (
        <iframe
          src={iframeSrc}
          title="Receipt"
          style={{
            width: "100%",
            height: "500px",
            border: "1px solid #ccc",
          }}
        />
      )}
    </div>
  );
}

export default App;
