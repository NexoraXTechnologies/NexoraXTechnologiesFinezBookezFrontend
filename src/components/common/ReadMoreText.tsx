// src/components/common/ReadMoreText.jsx
import { useState } from "react";

const ReadMoreText = ({
  text = "",
  charLimit = 20,          // new prop
  className = ""            // optional wrapper styling
}) => {
  if (!text) return <span className={className}>NA</span>;

  const [expanded, setExpanded] = useState(false);

  const needsTruncate = text.length > charLimit;

  const display = expanded ? text : `${text.slice(0, charLimit)}…`;

  /*  CSS: break anywhere + optional max-width safety-net  */
  return (
    <span className={`break-all ${className}`}>
      {display}
      {needsTruncate && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-blue-600 ml-1 hover:underline text-xs font-medium"
        >
          {expanded ? "less" : "more"}
        </button>
      )}
    </span>
  );
};

export default ReadMoreText;