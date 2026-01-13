"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { AccountType } from "@/types/accounting/chart-of-accounts"

export interface AccountOption {
  id: string
  code: string
  name: string
  type: AccountType
  description?: string
}

interface AccountSelectorProps {
  accounts: AccountOption[]
  value?: string
  onSelect: (account: AccountOption | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  loading?: boolean
  error?: string
}

// Map account types to display labels and colors
const accountTypeConfig: Record<AccountType, { label: string; color: string; bgColor: string }> = {
  asset: { label: "Assets", color: "text-emerald-700", bgColor: "bg-emerald-50" },
  liability: { label: "Liabilities", color: "text-rose-700", bgColor: "bg-rose-50" },
  equity: { label: "Equity", color: "text-violet-700", bgColor: "bg-violet-50" },
  revenue: { label: "Revenue", color: "text-blue-700", bgColor: "bg-blue-50" },
  expense: { label: "Expenses", color: "text-amber-700", bgColor: "bg-amber-50" },
}

// Order for displaying account type groups
const accountTypeOrder: AccountType[] = ["asset", "liability", "equity", "revenue", "expense"]

export function AccountSelector({
  accounts,
  value,
  onSelect,
  placeholder = "Select account...",
  disabled = false,
  className,
  loading = false,
  error,
}: AccountSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Find the selected account
  const selectedAccount = React.useMemo(
    () => accounts.find((account) => account.id === value),
    [accounts, value]
  )

  // Group accounts by type
  const groupedAccounts = React.useMemo(() => {
    const groups: Record<AccountType, AccountOption[]> = {
      asset: [],
      liability: [],
      equity: [],
      revenue: [],
      expense: [],
    }

    accounts.forEach((account) => {
      if (groups[account.type]) {
        groups[account.type].push(account)
      }
    })

    // Sort each group by code
    Object.keys(groups).forEach((type) => {
      groups[type as AccountType].sort((a, b) => a.code.localeCompare(b.code))
    })

    return groups
  }, [accounts])

  // Filter accounts based on search query
  const filteredGroups = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedAccounts
    }

    const query = searchQuery.toLowerCase()
    const filtered: Record<AccountType, AccountOption[]> = {
      asset: [],
      liability: [],
      equity: [],
      revenue: [],
      expense: [],
    }

    Object.entries(groupedAccounts).forEach(([type, typeAccounts]) => {
      filtered[type as AccountType] = typeAccounts.filter(
        (account) =>
          account.code.toLowerCase().includes(query) ||
          account.name.toLowerCase().includes(query) ||
          account.description?.toLowerCase().includes(query)
      )
    })

    return filtered
  }, [groupedAccounts, searchQuery])

  // Check if there are any results
  const hasResults = React.useMemo(
    () => Object.values(filteredGroups).some((group) => group.length > 0),
    [filteredGroups]
  )

  const handleSelect = (account: AccountOption) => {
    onSelect(account)
    setOpen(false)
    setSearchQuery("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between font-normal",
            !selectedAccount && "text-gray-500",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              Loading accounts...
            </span>
          ) : selectedAccount ? (
            <span className="flex items-center gap-2 truncate">
              <span
                className={cn(
                  "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium",
                  accountTypeConfig[selectedAccount.type].bgColor,
                  accountTypeConfig[selectedAccount.type].color
                )}
              >
                {selectedAccount.code}
              </span>
              <span className="truncate">{selectedAccount.name}</span>
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b border-gray-200 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <span className="text-xs">Clear</span>
              </button>
            )}
          </div>
          <CommandList className="max-h-[350px]">
            {!hasResults && (
              <CommandEmpty>
                <div className="flex flex-col items-center gap-1 py-4">
                  <Search className="h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-500">No accounts found</p>
                  <p className="text-xs text-gray-400">
                    Try a different search term
                  </p>
                </div>
              </CommandEmpty>
            )}
            {accountTypeOrder.map((type) => {
              const typeAccounts = filteredGroups[type]
              if (typeAccounts.length === 0) return null

              const config = accountTypeConfig[type]

              return (
                <CommandGroup
                  key={type}
                  heading={
                    <span className={cn("flex items-center gap-2", config.color)}>
                      <span
                        className={cn(
                          "inline-block h-2 w-2 rounded-full",
                          config.bgColor.replace("bg-", "bg-").replace("-50", "-500")
                        )}
                      />
                      {config.label}
                      <span className="text-gray-400 font-normal">
                        ({typeAccounts.length})
                      </span>
                    </span>
                  }
                >
                  {typeAccounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => handleSelect(account)}
                      className={cn(
                        "flex items-center gap-3 py-2.5 px-2 cursor-pointer rounded-sm",
                        "hover:bg-gray-100 transition-colors",
                        value === account.id && "bg-blue-50"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          value === account.id
                            ? "opacity-100 text-blue-600"
                            : "opacity-0"
                        )}
                      />
                      <span
                        className={cn(
                          "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono font-medium min-w-[60px] justify-center",
                          config.bgColor,
                          config.color
                        )}
                      >
                        {account.code}
                      </span>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="truncate text-sm font-medium text-gray-900">
                          {account.name}
                        </span>
                        {account.description && (
                          <span className="truncate text-xs text-gray-500">
                            {account.description}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </CommandGroup>
              )
            })}
          </CommandList>
          {accounts.length > 0 && (
            <div className="border-t border-gray-200 px-3 py-2">
              <p className="text-xs text-gray-500">
                {accounts.length} account{accounts.length !== 1 ? "s" : ""} available
                {searchQuery && hasResults && (
                  <span>
                    {" "}· Showing{" "}
                    {Object.values(filteredGroups).reduce((sum, g) => sum + g.length, 0)} matches
                  </span>
                )}
              </p>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default AccountSelector
