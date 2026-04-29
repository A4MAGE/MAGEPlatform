import Fuse from "fuse.js";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
);

const options = {
  includeScore: true,
  includeMatches: true,
  threshold: 0.2,
  keys: ["username", "name", "description"],
};

function Search({ data, onSelect }) {
  const [fuse, setFuse] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (data) {
      setFuse(new Fuse(data, options));
      return;
    }
    supabase
      .from("preset_with_username")
      .select("*")
      .then(({ data: rows, error }) => {
        if (!error && rows) setFuse(new Fuse(rows, options));
      });
  }, [data]);

  const handleSearch = (e) => {
    const val = e.target.value;
    if (!val.length || !fuse) { setResults([]); return; }
    setResults(fuse.search(val).map((r) => r.item));
  };

  return (
    <div className="search-bar-container">
      <input type="text" onChange={handleSearch} placeholder="Search presets…" />
      {results.length > 0 && (
        <ul>
          {results.map((item, i) => (
            <li
              key={i}
              onClick={() => onSelect && onSelect(item)}
              style={{ cursor: onSelect ? "pointer" : "default" }}
            >
              {item.thumbnail_url ? (
                <img
                  src={item.thumbnail_url}
                  alt={item.name}
                  className="search-result__thumb"
                />
              ) : (
                <div className="search-result__thumb search-result__thumb--empty" />
              )}
              <div className="search-result__meta">
                <span className="search-result__name">{item.name}</span>
                {item.username && (
                  <span className="search-result__author">{item.username}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Search;
