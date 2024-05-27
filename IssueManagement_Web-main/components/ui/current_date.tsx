import React from "react";

const CurrentDate = () => {
  const today = new Date();
  const formattedDate = `${today.getFullYear()}.${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}.${today.getDate().toString().padStart(2, "0")}`;

  return (
    <div style={{ fontSize: "24px", letterSpacing: "-1px", marginLeft: "3px" }}>
      {formattedDate}
    </div>
  );
};

export default CurrentDate;
