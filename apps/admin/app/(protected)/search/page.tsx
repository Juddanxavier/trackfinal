"use client"

import { useState, useEffect } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  SearchIcon,
  FileTextIcon,
  TruckIcon,
  UsersIcon,
  Building2Icon,
  ArrowRightIcon,
  ClockIcon,
  FilterIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SearchResult {
  id: string
  type: "quote" | "shipment" | "user" | "organisation"
  title: string
  description: string
  status?: string
  date: string
}

export default function SearchPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    handleSearch(debouncedQuery)
  }, [debouncedQuery])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      const data = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`)
      if (data && Array.isArray(data)) {
        setResults(data as SearchResult[])
      } else {
        setResults([])
      }
    } catch (error) {
      toast.error("Search failed")
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "quote":
        return <FileTextIcon className="h-4 w-4" />
      case "shipment":
        return <TruckIcon className="h-4 w-4" />
      case "user":
        return <UsersIcon className="h-4 w-4" />
      case "organisation":
        return <Building2Icon className="h-4 w-4" />
      default:
        return <SearchIcon className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "quote":
        return "Quote"
      case "shipment":
        return "Shipment"
      case "user":
        return "User"
      case "organisation":
        return "Organisation"
      default:
        return type
    }
  }

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case "quote":
        router.push(`/quotes?id=${result.id}`)
        break
      case "shipment":
        router.push(`/shipments?id=${result.id}`)
        break
      case "user":
        router.push(`/users?id=${result.id}`)
        break
    }
  }

  const QUICK_LINKS = [
    { label: "Quotes", description: "View all quotes", href: "/quotes" },
    {
      label: "Shipments",
      description: "View all shipments",
      href: "/shipments",
    },
    { label: "Users", description: "View all users", href: "/users" },
    { label: "Reports", description: "View reports", href: "/reports" },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="flex items-center gap-3">
              <SearchIcon className="h-10 w-10" />
              Search
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Find quotes, shipments, users, and more.
          </p>
        </div>

        <div className="relative">
          <Input
            placeholder="Search for quotes, shipments, users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-14 pl-12 text-lg"
          />
          <SearchIcon className="absolute top-5 left-4 h-5 w-5 text-muted-foreground" />
        </div>

        {!hasSearched && (
          <div>
            <h2 className="mb-4 text-lg font-semibold">Quick Links</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {QUICK_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{link.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        )}

        {hasSearched && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Searching..."
                  : `${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`}
              </p>
              {results.length > 0 && (
                <Button variant="ghost" size="sm">
                  <FilterIcon className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded-lg border p-4">
                    <div className="mb-2 h-5 w-1/3 rounded bg-muted" />
                    <div className="h-4 w-2/3 rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <Card>
                <CardHeader className="text-center">
                  <SearchIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <CardTitle>No results found</CardTitle>
                  <CardDescription>
                    Try adjusting your search terms or browse the quick links.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="space-y-2">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          {getTypeIcon(result.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{result.title}</p>
                            <Badge variant="secondary" className="text-xs">
                              {getTypeLabel(result.type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {result.description}
                          </p>
                          {result.status && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              Status: {result.status}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ClockIcon className="h-4 w-4" />
                        {result.date}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
