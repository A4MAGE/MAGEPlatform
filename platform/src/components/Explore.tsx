import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
// @ts-ignore
import Search from "@search/search-bar-main";

const Explore = () => {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.from("preset").select("*").then(({ data, error }: { data: any; error: any }) => {
      if (!error && data) setPresets(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="home-container">
        <div className="content-center-card">
          <p>Loading presets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="content-center-card">
        <h1>Explore</h1>
        <Search data={presets} />
      </div>
    </div>
  );
};

export default Explore;
