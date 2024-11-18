"use client";

import { useEffect } from "react";

// TypeScript Type Definitions
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
        };
    }
}

export default function Page() {
    useEffect(() => {
        const loadCheerpX = async () => {
            return new Promise<void>((resolve, reject) => {
                if (window.CheerpX) {
                    resolve(); // CheerpX is already loaded
                    return;
                }

                const script = document.createElement("script");
                script.src = "https://cxrtnc.leaningtech.com/1.0.6/cx.js";
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error("Failed to load."));
                document.body.appendChild(script);
            });
        };

        const initializeCheerpX = async () => {
            try {
                // Load the external script
                await loadCheerpX();

                // Run Bash
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

                const consoleElement = document.getElementById("console");
                if (consoleElement) {
                    linux.setConsole(consoleElement);
                } else {
                    console.error("Console element not found");
                }

                await linux.run("/bin/bash", ["--login"], {
                    env: [
                        "HOME=/home/user",
                        "USER=user",
                        "SHELL=/bin/bash",
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
        <div className="h-screen m-0">
            <pre id="console" className="h-full m-0"></pre>
        </div>
    );
}
