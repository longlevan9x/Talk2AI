import { startContent } from "./content/eventListeners";

console.log("Content script loaded");
const manifest = chrome.runtime.getManifest();
// console.log('Version extension:', manifest.version);
// console.log('Tên extension:', manifest.name);

const VERSION = manifest.version;

startContent(VERSION);