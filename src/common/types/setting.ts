export interface ISetting {
    messageCount: number
    splitConversation: boolean
    deleteConversation: boolean
    explainConversation: string
    explainMessageCount: number
    deleteExplainConversation: boolean
    translateConversation: string
    translateMessageCount: number
    deleteTranConversation: boolean
    theme: 'light' | 'dark' | 'system'
}
