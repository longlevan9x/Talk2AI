export interface ISetting {
    messageCount: number
    splitConversation: boolean
    isHideConversation: boolean
    explainConversation: string
    explainMessageCount: number
    explainIsHideConversation: boolean
    tranConversation: string
    tranMessageCount: number
    tranIsHideConversation: boolean
    theme: 'light' | 'dark' | 'system'
    customConversation: string,
    customMessageCount: number
    customIsHideConversation: boolean,
}
