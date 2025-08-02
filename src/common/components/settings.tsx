import React, { useState, useEffect } from 'react'
import '../../styles.scss'
import { ISetting } from '../types/setting'
import { LOCAL_STORAGE_KEYS } from '../constant'

const defaultSettings: ISetting = {
    messageCount: 10,
    splitConversation: false,
    deleteConversation: false,
    explainConversation: "explain",
    explainMessageCount: 10,
    deleteExplainConversation: false,
    translateConversation: "tran",
    translateMessageCount: 10,
    deleteTranConversation: false,
    theme: 'system', // Mặc định theo system
}

export enum PageType {
    POPUP = 'popup',
    SETTINGS = 'settings'
}

interface ISettingsProps {
    className?: string,
    pageType?: PageType
}

export default function Settings({ className, pageType = PageType.POPUP }: ISettingsProps) {
    const [settings, setSettings] = useState<ISetting>(defaultSettings)
    const [tempSettings, setTempSettings] = useState<ISetting>(defaultSettings)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light')

    useEffect(() => {
        loadSettings()
    }, [])

    // Kiểm tra thay đổi
    useEffect(() => {
        const changed = JSON.stringify(settings) !== JSON.stringify(tempSettings)
        setHasChanges(changed)
    }, [settings, tempSettings])

    // Xử lý theme
    useEffect(() => {
        applyTheme(tempSettings.theme)
    }, [tempSettings.theme])

    const applyTheme = (theme: 'light' | 'dark' | 'system') => {
        const root = document.documentElement

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            setCurrentTheme(systemTheme)
            if (systemTheme === 'dark') {
                root.classList.add('dark')
            } else {
                root.classList.remove('dark')
            }
        } else {
            setCurrentTheme(theme)
            if (theme === 'dark') {
                root.classList.add('dark')
            } else {
                root.classList.remove('dark')
            }
        }
    }

    const loadSettings = async () => {
        try {
            const result = await chrome.storage.local.get(LOCAL_STORAGE_KEYS.SETTINGS)
            if (result.settings) {
                const loadedSettings = { ...defaultSettings, ...result.settings }
                setSettings(loadedSettings)
                setTempSettings(loadedSettings)
            }
            setIsLoading(false)
        } catch (error) {
            console.error('Lỗi khi tải cài đặt:', error)
            setIsLoading(false)
        }
    }

    const saveSettings = async () => {
        setIsSaving(true)
        try {
            await chrome.storage.local.set({ settings: tempSettings })
            setSettings(tempSettings)
            setHasChanges(false)
            console.log('Đã lưu cài đặt thành công!')
        } catch (error) {
            console.error('Lỗi khi lưu cài đặt:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const resetToDefaults = () => {
        setTempSettings(defaultSettings)
        setHasChanges(true)
    }

    const handleToggle = (key: keyof ISetting) => {
        if (typeof tempSettings[key] === 'boolean') {
            const newSettings = { ...tempSettings, [key]: !tempSettings[key] }
            setTempSettings(newSettings)
        }
    }

    const handleNumberChange = (key: keyof ISetting, value: number) => {
        const newSettings = { ...tempSettings, [key]: value }
        setTempSettings(newSettings)
    }

    const handleStringChange = (key: keyof ISetting, value: string) => {
        const newSettings = { ...tempSettings, [key]: value }
        setTempSettings(newSettings)
    }

    if (isLoading) {
        return (
            <div className="w-96 min-h-[500px] p-5 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                    Đang tải...
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800">
            <div className={`p-5 font-sans transition-colors duration-200 text-gray-900 dark:text-gray-100 ${className}`}>
                {/* Header */}
                <div className="text-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-center mb-4">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Cài đặt Talk2AI</h1>
                        {pageType === PageType.POPUP && (
                            <button
                                onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('settings/index.html') })}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
                                title="Mở trang cài đặt rộng"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Cấu hình tùy chọn giao tiếp AI của bạn
                    </p>
                </div>

                {/* Theme Settings */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                        Giao diện
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex-1 mr-4">
                                <label className="text-base block font-medium text-gray-900 dark:text-gray-200 mb-1">Chế độ giao diện</label>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Chọn chế độ hiển thị giao diện</span>
                            </div>
                            <select
                                value={tempSettings.theme}
                                onChange={(e) => handleStringChange('theme', e.target.value)}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xs text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            >
                                <option value="light">Sáng</option>
                                <option value="dark">Tối</option>
                                <option value="system">Theo hệ thống</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* General Settings */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                        Cài đặt chung
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex-1 mr-4">
                                <label className="text-base block font-medium text-gray-900 dark:text-gray-200 mb-1">Tách cuộc hội thoại</label>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Tách thành nhiều cuộc hội thoại</span>
                            </div>
                            <label className="toggle-switch toggle-switch-lg">
                                <input
                                    type="checkbox"
                                    checked={tempSettings.splitConversation}
                                    onChange={() => handleToggle('splitConversation')}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>

                        {!tempSettings.splitConversation &&
                            <>
                                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex-1 mr-4">
                                        <label className="text-base block font-medium text-gray-900 dark:text-gray-200 mb-1">Số lượng tin nhắn</label>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Số lượng tin nhắn tối đa trong hội thoại</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={tempSettings.messageCount}
                                        onChange={(e) => handleNumberChange('messageCount', parseInt(e.target.value) || 1)}
                                        className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xs text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                                    />
                                </div>

                                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex-1 mr-4">
                                        <label className="text-base block font-medium text-gray-900 dark:text-gray-200 mb-1">Xóa hội thoại khi đạt giới hạn</label>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Tự động xóa hội thoại cũ khi đạt số tin nhắn tối đa</span>
                                    </div>
                                    <label className="toggle-switch toggle-switch-lg">
                                        <input
                                            type="checkbox"
                                            checked={tempSettings.deleteConversation}
                                            onChange={() => handleToggle('deleteConversation')}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                            </>
                        }
                    </div>
                </div>

                {tempSettings.splitConversation &&
                    (
                        <>
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                                    Hội thoại giải thích
                                </h2>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                                        <div className="flex-1 mr-4">
                                            <label className="text-base block font-medium text-gray-900 dark:text-gray-200 mb-1">Số tin nhắn</label>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Số lượng tin nhắn tối đa trong hội thoại</span>
                                        </div>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={tempSettings.explainMessageCount}
                                            onChange={(e) => handleNumberChange('explainMessageCount', parseInt(e.target.value) || 1)}
                                            className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xs text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                                        <div className="flex-1 mr-4">
                                            <label className="text-base block font-medium text-gray-900 dark:text-gray-200 mb-1">Xóa hội thoại khi đạt giới hạn</label>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Tự động xóa hội thoại cũ khi đạt số tin nhắn tối đa</span>
                                        </div>
                                        <label className="toggle-switch toggle-switch-lg">
                                            <input
                                                type="checkbox"
                                                checked={tempSettings.deleteExplainConversation}
                                                onChange={() => handleToggle('deleteExplainConversation')}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                                    Hội thoại dịch thuật
                                </h2>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                                        <div className="flex-1 mr-4">
                                            <label className="text-base block font-medium text-gray-900 dark:text-gray-200 mb-1">Số tin nhắn</label>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Số lượng tin nhắn tối đa trong hội thoại</span>
                                        </div>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={tempSettings.translateMessageCount}
                                            onChange={(e) => handleNumberChange('translateMessageCount', parseInt(e.target.value) || 1)}
                                            className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xs text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                                        <div className="flex-1 mr-4">
                                            <label className="text-base block font-medium text-gray-900 dark:text-gray-200 mb-1">Xóa hội thoại khi đạt giới hạn</label>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Tự động xóa hội thoại cũ khi đạt số tin nhắn tối đa</span>
                                        </div>
                                        <label className="toggle-switch toggle-switch-lg">
                                            <input
                                                type="checkbox"
                                                checked={tempSettings.deleteTranConversation}
                                                onChange={() => handleToggle('deleteTranConversation')}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                {/* Statistics */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                        Thống kê
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-xs border border-gray-200 dark:border-gray-600">
                            <div className="text-2xl font-bold text-blue-600">{tempSettings.messageCount}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Tin nhắn tối đa</div>
                        </div>
                        <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-xs border border-gray-200 dark:border-gray-600">
                            <div className="text-2xl font-bold text-green-600">{tempSettings.explainMessageCount}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Tin nhắn giải thích</div>
                        </div>
                        <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-xs border border-gray-200 dark:border-gray-600">
                            <div className="text-2xl font-bold text-orange-600">{tempSettings.translateMessageCount}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Tin nhắn dịch</div>
                        </div>
                        <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-xs border border-gray-200 dark:border-gray-600">
                            <div className="text-2xl font-bold text-purple-600">
                                {tempSettings.splitConversation ? 'Bật' : 'Tắt'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Tách hội thoại</div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600 text-center space-x-2">
                    <button
                        className="cursor-pointer bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xs text-sm font-medium transition-colors duration-200"
                        onClick={resetToDefaults}
                    >
                        Khôi phục mặc định
                    </button>

                    <button
                        className={`cursor-pointer px-4 py-2 rounded-xs text-sm font-medium transition-colors duration-200 ${hasChanges
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            }`}
                        onClick={saveSettings}
                        disabled={!hasChanges || isSaving}
                    >
                        {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
                    </button>
                </div>

                {/* Thông báo thay đổi */}
                {hasChanges && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-xs">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            ⚠️ Bạn có thay đổi chưa lưu. Vui lòng nhấn "Lưu cài đặt" để áp dụng.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}