"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { searchHistoryAPI } from "@/lib/api";
import { Search, Clock, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SearchHistory {
  id: number;
  search_query: string;
  filters: string | null;
  created_at: string;
}

interface SearchHistorySectionProps {
  onSearchClick?: (search: SearchHistory) => void;
}

export default function SearchHistorySection({ onSearchClick }: SearchHistorySectionProps) {
  const [searches, setSearches] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSearches();
  }, []);

  const loadSearches = async () => {
    try {
      const response = await searchHistoryAPI.getMySearches(5);
      setSearches(response.data);
    } catch (error) {
      console.error("Failed to load search history");
    }
  };

  const handleSearchClick = (search: SearchHistory) => {
    if (onSearchClick) {
      onSearchClick(search);
    }
  };

  const deleteSearch = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await searchHistoryAPI.delete(id);
      setSearches(searches.filter(s => s.id !== id));
      toast.success("Search deleted");
    } catch (error) {
      toast.error("Failed to delete search");
    }
  };

  const clearAll = async () => {
    if (!confirm("Clear all search history?")) return;
    
    setLoading(true);
    try {
      await searchHistoryAPI.clearAll();
      setSearches([]);
      toast.success("Search history cleared");
    } catch (error) {
      toast.error("Failed to clear history");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (searches.length === 0) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Searches
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          disabled={loading}
          className="text-xs text-gray-500 hover:text-red-600"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <Trash2 className="w-3 h-3 mr-1" />
              Clear All
            </>
          )}
        </Button>
      </div>

      <div className="space-y-2">
        {searches.map((search) => (
          <div
            key={search.id}
            onClick={() => handleSearchClick(search)}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {search.search_query}
                </p>
                <p className="text-xs text-gray-500">
                  {formatTime(search.created_at)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => deleteSearch(search.id, e)}
              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-gray-400 hover:text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
