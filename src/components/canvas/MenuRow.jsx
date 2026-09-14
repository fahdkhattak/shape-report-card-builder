import { T } from "../../lib/tokens.js";

export default function MenuRow({ icon, label, onClick, danger }) {
  return (
    <div
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12.5, color: danger ? T.red : T.gray900 }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.gray50)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {icon}{label}
    </div>
  );
}
