import React from 'react'
import Settings from '../../common/components/settings'
import { PageType } from '../../common/components/settings'

export default function App() {
    return <Settings className="w-full md:w-1/2 mx-auto min-h-screen" pageType={PageType.SETTINGS} />
}