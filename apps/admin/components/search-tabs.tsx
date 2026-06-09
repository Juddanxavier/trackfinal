"use client"

import { SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SearchTabsProps<T extends string> {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  tabsValue: T
  onTabsChange: (value: T) => void
  tabs: { value: T; label: string }[]
}

export function SearchTabs<T extends string>({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  tabsValue,
  onTabsChange,
  tabs,
}: SearchTabsProps<T>) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="relative max-w-sm flex-1">
        <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Tabs value={tabsValue} onValueChange={(v) => onTabsChange(v as T)}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
