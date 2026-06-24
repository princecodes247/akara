"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
import { config } from "@/lib/config";

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
        const res = await fetch(`${config.apiUrl}/github/repos`, {
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

  const handleSelect = (repoFullName: string) => {
    if (multiSelect) {
      const current = Array.isArray(selected) ? selected : [];
      if (current.includes(repoFullName)) {
        onChange(current.filter(r => r !== repoFullName));
      } else {
        onChange([...current, repoFullName]);
      }
      setSearch("");
    } else {
      if (selected === repoFullName) {
        onChange("");
      } else {
        onChange(repoFullName);
      }
      setOpen(false);
      setSearch("");
    }
  };
  const handleCustomAdd = () => {
    handleSelect(search);
    setSearch("");
  };

  return (
    <div className="relative font-mono" ref={dropdownRef}>
      <label className="block text-sm font-bold text-foreground mb-2 uppercase tracking-wider">{label}</label>
      {description && <p className="text-foreground/60 text-sm mb-4">{description}</p>}

      <div 
        className="w-full flex items-center justify-between bg-background border border-border hover:border-accent transition-colors"
      >
        <div 
          onClick={() => setOpen(!open)}
          className="flex-1 px-4 py-3 cursor-pointer truncate text-foreground/80"
        >
          {multiSelect 
            ? Array.isArray(selected) && selected.length > 0 
              ? `${selected.length} repositories selected`
              : "Select repositories..."
            : selected || "Select a repository..."}
        </div>
        <div className="flex items-center gap-2 pr-4">
          {!multiSelect && selected && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-1 hover:text-red-455 text-foreground/40 transition-colors"
              title="Clear selection"
            >
              <X size={14} />
            </button>
          )}
          <ChevronsUpDown size={16} className="text-foreground/50 cursor-pointer" onClick={() => setOpen(!open)} />
        </div>
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-2 bg-background border border-border shadow-2xl max-h-60 overflow-y-auto">
          <div className="sticky top-0 bg-background p-2 border-b border-border z-10">
            <input 
              type="text" 
              placeholder="Search repositories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent text-foreground"
              autoFocus
            />
          </div>

          <div className="p-2">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 size={18} className="animate-spin text-accent" />
              </div>
            ) : (
              <>
                {filteredRepos.length === 0 && !search ? (
                  <div className="p-4 text-center text-sm text-foreground/50">
                    No repositories found.
                  </div>
                ) : filteredRepos.length === 0 && allowCustom && search ? (
                  <button
                    type="button"
                    onClick={handleCustomAdd}
                    className="w-full flex items-center gap-2 p-3 text-sm text-left hover:bg-surface text-accent font-bold"
                  >
                    <Plus size={16} />
                    Create/Use custom: {search}
                  </button>
                ) : (
                  <div className="space-y-1">
                    {filteredRepos.map(repo => {
                      const isSelected = multiSelect 
                        ? Array.isArray(selected) && selected.includes(repo.fullName)
                        : selected === repo.fullName;

                      return (
                        <div 
                          key={repo.id}
                          onClick={() => handleSelect(repo.fullName)}
                          className={`flex items-center justify-between p-3 cursor-pointer transition-colors border-l-2 ${
                            isSelected 
                              ? "bg-surface border-accent text-foreground font-bold" 
                              : "border-transparent text-foreground/80 hover:bg-surface hover:text-foreground"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="truncate">{repo.fullName}</span>
                            {repo.private && <span className="text-[10px] text-accent uppercase tracking-wider mt-1">Private</span>}
                          </div>
                          {isSelected && <Check size={16} className="text-accent" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
