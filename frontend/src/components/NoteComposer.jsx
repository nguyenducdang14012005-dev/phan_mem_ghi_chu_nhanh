import React, { useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { NOTE_COLORS } from "../constants/noteColors.js";

const TOOLBAR_ID = "composer-toolbar-fixed";

const modules = {
  toolbar: { container: `#${TOOLBAR_ID}` },
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "list",
  "bullet",
  "align",
];

export default function NoteComposer({
  view,
  composerOpen,
  setComposerOpen,
  newTitle,
  setNewTitle,
  newContent,
  setNewContent,
  newDueTime,
  setNewDueTime,
  newColor,
  setNewColor,
  datePickerOpen,
  setDatePickerOpen,
  createNote,
}) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  if (view !== "notes") return null;

  const color = newColor || "#ffffff";

  const handleCancel = () => {
    setNewTitle("");
    setNewContent("");
    setNewDueTime("");
    if (setNewColor) setNewColor("#ffffff");
    setComposerOpen(false);
    if (setDatePickerOpen) setDatePickerOpen(false);
  };

  return (
    <div className="composer-wrapper">
      {!composerOpen ? (
        <div
          className="composer-collapsed"
          onClick={() => setComposerOpen(true)}
        >
          <span>
            {newContent ? newContent.replace(/<[^>]*>/g, "") : "Ghi chú..."}
          </span>
        </div>
      ) : (
        // ⚡ composer-expanded: flex-column + overflow:hidden
        // CHỈ .composer-body cuộn — toolbar nằm ngoài nó
        <div className="composer-expanded" style={{ backgroundColor: color }}>
          {/* Tiêu đề — không cuộn */}
          <input
            className="composer-title"
            placeholder="Tiêu đề"
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          {/* ⚡ TOOLBAR — anh em với .composer-body, NGOÀI vùng cuộn */}
          <div
            id={TOOLBAR_ID}
            className="ql-toolbar ql-snow composer-toolbar-sticky"
          >
            <span className="ql-formats">
              <select className="ql-header" defaultValue="">
                <option value="1" />
                <option value="2" />
                <option value="" />
              </select>
            </span>
            <span className="ql-formats">
              <button className="ql-bold" />
              <button className="ql-italic" />
              <button className="ql-underline" />
              <button className="ql-strike" />
            </span>
            <span className="ql-formats">
              <select className="ql-color" />
              <select className="ql-background" />
            </span>
            <span className="ql-formats">
              <button className="ql-list" value="ordered" />
              <button className="ql-list" value="bullet" />
            </span>
            <span className="ql-formats">
              <select className="ql-align" />
            </span>
            <span className="ql-formats">
              <button className="ql-clean" />
            </span>
          </div>

          {/* ⚡ VÙNG CUỘN — chỉ editor nằm đây */}
          <div className="composer-body">
            <ReactQuill
              theme="snow"
              value={newContent}
              onChange={setNewContent}
              placeholder="Ghi chú..."
              modules={modules}
              formats={formats}
            />

            <button
              className="deadline-btn"
              onClick={() => setDatePickerOpen(!datePickerOpen)}
            >
              {newDueTime
                ? new Date(newDueTime).toLocaleString("vi-VN")
                : "Chọn ngày và giờ"}
            </button>

            {datePickerOpen && (
              <div className="date-picker-popup">
                <div className="date-picker-header">
                  <span>← Chọn ngày và giờ</span>
                </div>
                <div className="date-picker-body">
                  <input
                    type="date"
                    className="date-input"
                    value={newDueTime.split("T")[0] || ""}
                    onChange={(e) =>
                      setNewDueTime(
                        e.target.value +
                          "T" +
                          (newDueTime.split("T")[1] || "00:00"),
                      )
                    }
                  />
                  <input
                    type="time"
                    className="time-input"
                    value={newDueTime.split("T")[1] || ""}
                    onChange={(e) =>
                      setNewDueTime(
                        (newDueTime.split("T")[0] || "") + "T" + e.target.value,
                      )
                    }
                  />
                </div>
                <div className="date-picker-footer">
                  <button
                    className="btn-share"
                    onClick={() => setDatePickerOpen(false)}
                  >
                    Lưu
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions — không cuộn */}
          <div className="composer-actions">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className="card-btn"
                  title="Chọn màu"
                  onClick={() => setColorPickerOpen((v) => !v)}
                >
                  <img
                    src="/images/palette.png"
                    alt="Màu"
                    style={{ width: 18, height: 18, objectFit: "contain" }}
                  />
                </button>
                {colorPickerOpen && (
                  <div className="color-picker-popup">
                    {NOTE_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        title={c.name}
                        className={`color-dot ${color === c.value ? "selected" : ""}`}
                        style={{ backgroundColor: c.value }}
                        onClick={() => {
                          if (setNewColor) setNewColor(c.value);
                          setColorPickerOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <button
                className="close-btn"
                style={{ background: "#f1f3f4", color: "#5f6368" }}
                onClick={handleCancel}
              >
                Hủy
              </button>
              <button className="btn-share" onClick={createNote}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
