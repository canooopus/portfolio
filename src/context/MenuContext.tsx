"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface MenuContextType {
  isReady: boolean;
  setIsReady: (val: boolean) => void;
  showFooter: boolean;
  setShowFooter: (val: boolean) => void;
}

const MenuContext = createContext<MenuContextType>({
  isReady: false,
  setIsReady: () => {},
  showFooter: true,
  setShowFooter: () => {},
});

export const MenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = useState(false);
  const [showFooter, setShowFooter] = useState(true); // フッター表示フラグを追加
  const pathname = usePathname();

  // トップページ以外では最初からメニューを表示する
  useEffect(() => {
    if (pathname !== "/") {
      setIsReady(true);
    }
  }, [pathname]);

  return (
    <MenuContext.Provider
      value={{ isReady, setIsReady, showFooter, setShowFooter }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => useContext(MenuContext);
