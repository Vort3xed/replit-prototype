// types/browserfs.d.ts
declare module 'browserfs' {
    const BrowserFS: any;
    export default BrowserFS;

  export function configure(arg0: { fs: string; }, arg1: (err: any) => void) {
    throw new Error('Function not implemented.');
  }

  export function BFSRequire(arg0: string) {
    throw new Error('Function not implemented.');
  }
  }