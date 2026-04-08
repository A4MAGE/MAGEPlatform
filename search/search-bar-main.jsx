import Fuse from "fuse.js";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
);


function Search({ data, onSelect }) {
  const [presets, setPresets] = useState([]);
  const [fuse, setFuse] = useState();

  // Options for fuse search bar
  const options = {
    includeScore: true,
    includeMatches: true,
    threshold: 0.2,
    keys: ["username", "name", "description"],
  };

  useEffect(() => {
    if (data) {
      setFuse(new Fuse(data, options));
      return;
    }

    // If no data provided, get presets from supabase.
    const fetchPresets = async () => {
      const { data: rows, error } = await supabase.from("preset_with_username").select("*");

      if (!error && rows) {
        setFuse(new Fuse(rows, options));
      }
    };

    fetchPresets();
  }, [data]);

  const handleSearch = (event) => {
    const { value } = event.target;
  
    // When nothing is typed - results stay empty.
    if (value.length === 0) { 
      setPresets([]);
      return;
    }

    const results = fuse.search(value);
    const items = results.map((result) => result.item);
    setPresets(items);
  };

  return (
    <div className="search-bar-container">
      <input type="text" onChange={handleSearch} placeholder="Search..." />
      <ul>
        {presets.map((item, index) => (
          <li
            key={index}
            onClick={() => onSelect && onSelect(item)}
            style={{ cursor: onSelect ? "pointer" : "default" }}
          >
            {item.name} — {item.username}
          </li>
        ))}
      </ul>
    </div>
  );
}
export default Search;
