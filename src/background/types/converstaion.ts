export interface IConversationStorage {
    conversation_id: string,
    message_count: string,
    current_message_id: string,
    tran_conversation_id: string,
    tran_message_count: string,
    tran_current_message_id: string,
    explain_conversation_id: string,
    explain_message_count: string,
    explain_current_message_id: string,
    custom_conversation_id: string,
    custom_message_count: string,
    custom_current_message_id: string,
}