const PresetPreviews = ({ setPresetPath }: { setPresetPath: (preset: string) => void }) => {
  const presets = [
    "presets/preset0.v2.json",
    "presets/preset1.v2.json",
    "presets/preset2.v2.json",
    "presets/preset3.v2.json",
  ];

  return (
    <div className="content-center-card">
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
