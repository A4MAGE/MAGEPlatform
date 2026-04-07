
import Fuse from 'fuse.js'
import React, { useState } from "react";
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
);


function Search({ data, onSelect }) {
  const [presets, setPresets] = useState([]);

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

  return (
    <div>
      <input
        type="text"
        onChange={handleSearch}
        placeholder="Search..."
      />
      <ul>
        {searchResults.map((item, index) => (
          <li key={index}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
export default Search;
