"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const MenuContext = createContext({
  isReady: false,
  setIsReady: (val: boolean) => {},
});

export const MenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = useState(false);
  const pathname = usePathname();

  // トップページ以外では最初からメニューを表示する
  useEffect(() => {
    if (pathname !== "/") {
      setIsReady(true);
    }
  }, [pathname]);

  return (
    <MenuContext.Provider value={{ isReady, setIsReady }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => useContext(MenuContext);