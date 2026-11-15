"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";

interface MenuContextType {
  isReady: boolean;
  setIsReady: (val: boolean) => void;
  showFooter: boolean;
  setShowFooter: (val: boolean) => void;
  isTocOpen: boolean;
  setIsTocOpen: (val: boolean) => void;
  isNavMenuOpen: boolean;
  setIsNavMenuOpen: (val: boolean) => void;
}

const MenuContext = createContext<MenuContextType>({
  isReady: false,
  setIsReady: () => {},
  showFooter: true,
  setShowFooter: () => {},
  isTocOpen: false,
  setIsTocOpen: () => {},
  isNavMenuOpen: false,
  setIsNavMenuOpen: () => {},
});

export const MenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [hasCompletedIntro, setHasCompletedIntro] = useState(false);
  const [showFooter, setShowFooter] = useState(true); // フッター表示フラグを追加
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const pathname = usePathname();

  // トップページのロゴ描画が終わるまではメニューを隠す。トップ以外では常に表示する
  const isReady = pathname !== "/" || hasCompletedIntro;

  const setIsReady = useCallback((ready: boolean) => {
    if (ready) {
      setHasCompletedIntro(true);
    }
  }, []);

  const value = useMemo(
    () => ({
      isReady,
      setIsReady,
      showFooter,
      setShowFooter,
      isTocOpen,
      setIsTocOpen,
      isNavMenuOpen,
      setIsNavMenuOpen,
    }),
    [isReady, setIsReady, showFooter, isTocOpen, isNavMenuOpen],
  );

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => useContext(MenuContext);
