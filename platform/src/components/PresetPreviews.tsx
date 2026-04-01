import "./PresetPreviews.css"

const PresetPreviews = ({ setPresetPath }: { setPresetPath: (preset: string) => void }) => {
  const presets = [
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

  return (
    <div className="preset-previews">
      {presets.map((preset, index) => (
        <div key={index}>
          <button
            className="link-button"
            onClick={() => {
              setPresetPath(preset);
            }}
          >
            {preset}
          </button>
        </div>
      ))}
    </div>
  );
};

export default PresetPreviews;
