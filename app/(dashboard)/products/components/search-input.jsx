"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/button";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search products...",
  debounceMs = 300,
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, onChange, debounceMs]);

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-10 pr-10"
      />
      {localValue && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleClear}
          className="absolute right-1 top-2 h-6 w-6 p-0 hover:none"
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
