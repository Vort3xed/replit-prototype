"use client";

import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";

declare global {
    interface Window {
        CheerpX: {
            CloudDevice: {
                create: (url: string) => Promise<any>;
            };
            IDBDevice: {
                create: (name: string) => Promise<any>;
            };
            OverlayDevice: {
                create: (cloudDevice: any, idbDevice: any) => Promise<any>;
            };
            Linux: {
                create: (config: {
                    mounts: Array<{ type: string; path: string; dev: any }>;
                }) => Promise<any>;
            };
        }
    }
}

export default function Page() {
    const terminalRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      const loadCheerpX = async () => {
        return new Promise<void>((resolve, reject) => {
          if (window.CheerpX) {
            resolve();
            return;
          }
  
          const script = document.createElement("script");
          script.src = "https://cxrtnc.leaningtech.com/1.0.6/cx.js";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load CheerpX script"));
          document.body.appendChild(script);
        });
      };
  
      const initializeCheerpX = async () => {
        try {
          const term = new Terminal({
            cursorBlink: true,
            fontFamily: "monospace",
            convertEol: true,
            fontSize: 16,
            cols: 100,
            theme: {
              background: "#000000",
              foreground: "#FFFFFF",
            },
          });
  
          term.open(terminalRef.current!);
          term.focus();
  
          await loadCheerpX();
  
          const cloudDevice = await window.CheerpX.CloudDevice.create(
            "wss://disks.webvm.io/debian_large_20230522_5044875331.ext2"
          );
  
          const idbDevice = await window.CheerpX.IDBDevice.create("block1");
          const overlayDevice = await window.CheerpX.OverlayDevice.create(
            cloudDevice,
            idbDevice
          );
  
          const linux = await window.CheerpX.Linux.create({
            mounts: [{ type: "ext2", path: "/", dev: overlayDevice }],
          });
  
          const writeData = (buf: Uint8Array) => {
            term.write(buf);
          };
  
          const cxReadFunc = linux.setCustomConsole(writeData, term.cols, term.rows);
  
          term.onData((data) => {
            for (let i = 0; i < data.length; i++) {
              cxReadFunc(data.charCodeAt(i));
            }
          });
  
        //   term.onResize((size) => {
        //     linux.setConsoleSize(size.cols, size.rows);
        //   });
  
          window.addEventListener("resize", () => {
            term.resize(term.cols, term.rows);
            // linux.setConsoleSize(term.cols, term.rows);
          });
  
          await linux.run("/bin/bash", ["--login"], {
            env: [
              "HOME=/home/user",
              "USER=user",
              "SHELL=/bin/bash",
              "TERM=xterm",
              "EDITOR=nano",
              "LANG=en_US.UTF-8",
              "LC_ALL=C",
            ],
            cwd: "/home/user",
            uid: 1000,
            gid: 1000,
          });
        } catch (error) {
          console.error("Failed to initialize CheerpX:", error);
        }
      };
  
      initializeCheerpX();
    }, []);
  
    return (
      <div className="h-screen w-screen bg-black">
        <div ref={terminalRef} className="w-full h-full"></div>
      </div>
    );
  }