"use client";

import { createContext, useContext, useState, useEffect, useMemo } from "react";
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

  const value = useMemo(
    () => ({ isReady, setIsReady, showFooter, setShowFooter }),
    [isReady, showFooter],
  );

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => useContext(MenuContext);
