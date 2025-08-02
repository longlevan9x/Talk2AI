import { ISetting } from "./types/setting";

export const defaultSettings: ISetting = {
    messageCount: 20,
    splitConversation: false,
    isHideConversation: false,
    explainConversation: "explain",
    explainMessageCount: 20,
    explainIsHideConversation: false,
    tranConversation: "tran",
    tranMessageCount: 20,
    tranIsHideConversation: false,
    customConversation: "custom",
    customMessageCount: 20,
    customIsHideConversation: false,
    theme: 'system', // Mặc định theo system
}