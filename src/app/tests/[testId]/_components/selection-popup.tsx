type SelectionPopupProps = {
  x: number;
  y: number;
  onHighlight: () => void;
  onNote: () => void;
  onClear: () => void;
};

export function SelectionPopup({ x, y, onHighlight, onNote, onClear }: SelectionPopupProps) {
  return (
    <div
      style={{
        position: "fixed",
        left: x,
        top: y,
        transform: "translate(-50%,-100%)",
        background: "#1A2530",
        borderRadius: 7,
        boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
        display: "flex",
        overflow: "hidden",
        zIndex: 50,
      }}
    >
      <button
        className="toolbtn"
        style={{
          padding: "8px 12px",
          background: "transparent",
          border: "none",
          borderRight: "1px solid rgba(255,255,255,0.15)",
          color: "#FDE68A",
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
        }}
        onClick={onHighlight}
      >
        Highlight
      </button>
      <button
        className="toolbtn"
        style={{
          padding: "8px 12px",
          background: "transparent",
          border: "none",
          borderRight: "1px solid rgba(255,255,255,0.15)",
          color: "#93C5FD",
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
        }}
        onClick={onNote}
      >
        Note
      </button>
      <button
        className="toolbtn"
        style={{
          padding: "8px 12px",
          background: "transparent",
          border: "none",
          color: "#FCA5A5",
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
        }}
        onClick={onClear}
      >
        Clear
      </button>
    </div>
  );
}
