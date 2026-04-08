import Fuse from 'fuse.js'
import React, { useEffect, useMemo, useState } from "react";
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
);

function Search({ data, onSelect }) {
  const [presets, setPresets] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (data) {
      setPresets(data);
      return;
    }
    supabase
      .from("preset_with_username")
      .select("*")
      .then(({ data: rows, error }) => {
        if (!error && rows) setPresets(rows);
      });
  }, [data]);

  const fuse = useMemo(
    () =>
      new Fuse(presets, {
        keys: ["name", "username", "description"],
        threshold: 0.4,
      }),
    [presets]
  );

  const results = query
    ? fuse.search(query).map((r) => r.item)
    : presets;

  const handleSelect = (item) => {
    if (onSelect) onSelect(item);
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search presets..."
      />
      <ul>
        {results.map((item) => (
          <li key={item.id} onClick={() => handleSelect(item)}>
            {item.name}{item.username ? ` — ${item.username}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Search;
