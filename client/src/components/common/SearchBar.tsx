import React, { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (term: string) => void;
  placeholder?: string;
  value?: string;
  debounceTime?: number;
  className?: string;
}

export default function SearchBar({
  onSearch,
  placeholder = "Buscar...",
  value = "",
  debounceTime = 500,
  className = "",
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(value);
  const debouncedOnSearch = useDebouncedCallback((term: string) => {
    onSearch(term);
  }, debounceTime);

  // Trigger the debounced search when searchTerm changes
  React.useEffect(() => {
    debouncedOnSearch(searchTerm);
  }, [searchTerm, debouncedOnSearch]);

  // Update local state when value prop changes
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const clearSearch = () => {
    // Cancel any pending debounced calls and clear immediately
    debouncedOnSearch.cancel();
    setSearchTerm("");
    onSearch("");
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        className="pl-8 pr-8"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-0 right-0 h-full px-2 hover:bg-transparent"
          onClick={clearSearch}
          type="button"
          aria-label="Limpiar búsqueda"
        >
          <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
        </Button>
      )}
    </div>
  );
}
