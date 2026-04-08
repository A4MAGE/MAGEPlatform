import "./PresetPreviews.css";
import { useState, useEffect } from "react";

const PresetPreviews = ({ onSelect }: { onSelect: (preset: object) => void }) => {
  const presetUrls = [
    "presets/preset0.v2.json",
    "presets/preset1.v2.json",
    "presets/preset2.v2.json",
    "presets/preset3.v2.json",
    "presets/preset4.v2.json",
    "presets/preset5.v2.json",
    "presets/preset6.v2.json",
    "presets/preset7.v2.json",
    "presets/preset8.v2.json",
    "presets/preset9.v2.json",
    "presets/preset10.v2.json",
  ];

  const [presets, setPresets] = useState<object[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const presetData = await Promise.all(
          presetUrls.map(async (url) => {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to load ${url}`);
            return response.json();
          }),
        );
        setPresets(presetData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load presets");
        setLoading(false);
      }
    };

    fetchPresets();
  }, []);

  if (loading) {
    return (
      <div className="mage-rail">
        <p className="mage-rail__label">Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="mage-rail">
        <p className="mage-rail__label">Error</p>
      </div>
    );
  }

  return (
    <div className="mage-rail">
      <p className="mage-rail__label">Debug Presets</p>
      {presets.map((preset, index) => (
        <button
          key={index}
          type="button"
          className="mage-rail__item"
          onClick={() => onSelect(preset)}
        >
          <span className="mage-rail__num">
            {(index + 1).toString().padStart(2, "0")}
          </span>
          <span>Preset {index}</span>
        </button>
      ))}
    </div>
  );
};

export default PresetPreviews;
