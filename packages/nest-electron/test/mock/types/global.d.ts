import type { ElectronIPC } from '../src/preload';

/**
 * 全局类型声明，无需引入直接获得类型提示
 */
declare global {
  interface Window {
    electron: ElectronIPC;
  }
}

export {};
