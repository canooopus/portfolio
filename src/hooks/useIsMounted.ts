import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * SSR / ハイドレーション中は false、クライアントでマウント後に true を返す。
 * useEffect 内での setState を避けたい箇所用のフック。
 */
export function useIsMounted() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
