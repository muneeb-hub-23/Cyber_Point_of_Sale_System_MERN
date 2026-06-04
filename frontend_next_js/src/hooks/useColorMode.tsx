import { useEffect, useState } from "react";

const useColorMode = () => {
  const [colorMode] = useState("dark");

  useEffect(() => {
    window.document.body.classList.add("dark");
    if (typeof window !== "undefined") {
      window.localStorage.setItem("color-theme", JSON.stringify("dark"));
    }
  }, []);

  return [colorMode, (_value: string) => {}];
};

export default useColorMode;
