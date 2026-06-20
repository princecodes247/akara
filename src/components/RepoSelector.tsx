"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";

interface Repo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  url: string;
}

interface RepoSelectorProps {
  label: string;
  description?: string;
  multiSelect?: boolean;
  allowCustom?: boolean;
  selected: string | string[];
  onChange: (selected: string | string[]) => void;
}

export function RepoSelector({ label, description, multiSelect = false, allowCustom = false, selected, onChange }: RepoSelectorProps) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const token = localStorage.getItem("akara_token");
        const res = await fetch("http://localhost:4000/api/github/repos", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRepos(data);
        }
      } catch (error) {
        console.error("Failed to fetch repos", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRepos();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredRepos = repos.filter(repo => repo.fullName.toLowerCase().includes(search.toLowerCase()));
  const showCustomOption = allowCustom && search && !repos.find(r => r.fullName === search);

  const toggleSelection = (repoFullName: string) => {
    if (multiSelect) {
      const current = Array.isArray(selected) ? selected : [];
      if (current.includes(repoFullName)) {
        onChange(current.filter(r => r !== repoFullName));
      } else {
        onChange([...current, repoFullName]);
      }
      setSearch("");
    } else {
      onChange(repoFullName);
      setOpen(false);
      setSearch("");
    }
  };

  const getDisplayText = () => {
    if (multiSelect) {
      const current = Array.isArray(selected) ? selected : [];
      if (current.length === 0) return "Select repositories...";
      if (current.length === 1) return current[0];
      return `${current.length} repositories selected`;
    }
    return (selected as string) || "Select a repository...";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-foreground/80 mb-2">{label}</label>
      {description && <p className="text-xs text-foreground/50 mb-2">{description}</p>}
      
      <div 
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-surface hover:bg-surface-hover border border-border rounded-lg px-4 py-3 cursor-pointer transition-colors"
      >
        <span className={!selected || (Array.isArray(selected) && selected.length === 0) ? "text-foreground/50" : "text-foreground"}>
          {getDisplayText()}
        </span>
        {loading ? <Loader2 size={16} className="animate-spin text-foreground/50" /> : <ChevronsUpDown size={16} className="text-foreground/50" />}
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-2 bg-background border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
          <div className="sticky top-0 bg-background p-2 border-b border-border z-10">
            <input 
              type="text" 
              placeholder="Search repositories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
              onClick={e => e.stopPropagation()}
            />
          </div>
          
          <div className="p-1">
            {filteredRepos.length === 0 && !showCustomOption && (
              <div className="px-3 py-4 text-sm text-center text-foreground/50">No repositories found.</div>
            )}
            
            {showCustomOption && (
              <div 
                className="flex items-center gap-2 px-3 py-2 text-sm text-accent cursor-pointer hover:bg-surface-hover rounded-md"
                onClick={() => toggleSelection(search)}
              >
                <Plus size={14} />
                <span>Create/Use custom: <strong>{search}</strong></span>
              </div>
            )}

            {filteredRepos.map(repo => {
              const isSelected = multiSelect 
                ? (Array.isArray(selected) ? selected.includes(repo.fullName) : false)
                : selected === repo.fullName;
                
              return (
                <div 
                  key={repo.id}
                  onClick={() => toggleSelection(repo.fullName)}
                  className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded-md transition-colors ${isSelected ? "bg-accent/20 text-accent" : "hover:bg-surface-hover"}`}
                >
                  <div className="flex flex-col">
                    <span>{repo.fullName}</span>
                    <span className="text-[10px] opacity-60 uppercase">{repo.private ? "Private" : "Public"}</span>
                  </div>
                  {isSelected && <Check size={14} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
