import React, { useRef, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { NOTE_COLORS, getLabelColor } from "../constants/noteColors.js";

const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["clean"],
  ],
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

export default function NoteEditModal({
  note,
  onClose, // (updatedPayload | null) => void  — null nghĩa là không có gì cần lưu
  onPin, // (id) => void
  onReminder, // (id) => void
  onShare, // (id) => void
  onLabel, // (id, noteLabels) => void
}) {
  const [title, setTitle] = useState(note.title || "");
  const [content, setContent] = useState(note.content || "");
  const [color, setColor] = useState(note.color || "#ffffff");
  const [dueTime, setDueTime] = useState(
    note.due_time ? note.due_time.slice(0, 16) : "",
  );
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const dirtyRef = useRef(false);

  const isDeleted = note.status === "Deleted";
  const isArchived = note.status === "Archived";
  // Ghi chú được chia sẻ với mình (acceptedSharedNotes) không có đầy đủ dữ liệu
  // (không có status/is_pinned/labels...) nên chỉ cho xem, không cho chỉnh sửa/xóa/lưu trữ.
  const isReadOnly = note.permission !== undefined;

  const markDirty = () => {
    dirtyRef.current = true;
  };

  const buildPayload = () => ({
    title,
    content,
    color,
    due_time: dueTime || null,
  });

  const handleClose = () => {
    if (!isReadOnly && dirtyRef.current) {
      onClose(buildPayload());
    } else {
      onClose(null);
    }
  };

  const handleStatusClick = (status) => {
    // Lưu thay đổi đang chỉnh (nếu có) trước khi đổi trạng thái và đóng modal
    if (!isReadOnly && dirtyRef.current) {
      onClose(buildPayload(), status);
    } else {
      onClose(null, status);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="note-edit-modal"
        style={{ backgroundColor: color }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="note-edit-header">
          <input
            className="note-edit-title"
            placeholder="Tiêu đề"
            value={title}
            disabled={isReadOnly}
            onChange={(e) => {
              setTitle(e.target.value);
              markDirty();
            }}
          />
          {!isDeleted && !isReadOnly && (
            <button
              className="icon-btn"
              title={note.is_pinned ? "Bỏ ghim" : "Ghim"}
              onClick={() => onPin(note.note_id)}
            >
              <img
                src="/images/pin.png"
                alt="Ghim"
                style={{
                  width: "18px",
                  height: "18px",
                  objectFit: "contain",
                }}
              />
            </button>
          )}
          <button className="icon-btn" title="Đóng" onClick={handleClose}>
            ✖
          </button>
        </div>

        <div className="note-edit-body">
          <ReactQuill
            theme="snow"
            value={content}
            readOnly={isReadOnly}
            onChange={(val) => {
              setContent(val);
              markDirty();
            }}
            placeholder="Ghi chú..."
            modules={modules}
            formats={formats}
          />
        </div>

        {/* Hiển thị hạn chót hiện có (click để sửa) */}
        {note.due_time && !dueTime && !datePickerOpen && !isReadOnly && (
          <div
            className="note-due-time"
            style={{ cursor: "pointer", marginLeft: 4 }}
            onClick={() => setDatePickerOpen(true)}
          >
            <img
              src="/images/timer.png"
              alt="Thông báo"
              style={{
                width: "18px",
                height: "18px",
                objectFit: "contain",
              }}
            />{" "}
            {new Date(note.due_time).toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
        {dueTime && !datePickerOpen && (
          <div
            className="note-due-time"
            style={{
              cursor: isReadOnly ? "default" : "pointer",
              marginLeft: 4,
            }}
            onClick={() => !isReadOnly && setDatePickerOpen(true)}
          >
            <img
              src="/images/timer.png"
              alt="Thông báo"
              style={{
                width: "18px",
                height: "18px",
                objectFit: "contain",
              }}
            />{" "}
            {new Date(dueTime).toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
        {/* Nút "Thêm hạn chót" khi ghi chú chưa có due_time nào */}
        {!note.due_time && !dueTime && !datePickerOpen && !isReadOnly && (
          <button
            className="card-btn"
            style={{
              marginLeft: 4,
              marginBottom: 4,
              fontSize: "0.82rem",
              color: "#5f6368",
            }}
            title="Thêm hạn chót"
            onClick={() => setDatePickerOpen(true)}
          >
            <img
              src="/images/timer.png"
              alt="Thông báo"
              style={{
                width: "18px",
                height: "18px",
                objectFit: "contain",
              }}
            />
            Thêm hạn chót
          </button>
        )}

        {datePickerOpen && (
          <div
            className="date-picker-popup"
            style={{ position: "static", margin: "8px 4px" }}
          >
            <div
              className="date-picker-header"
              onClick={() => setDatePickerOpen(false)}
            >
              ← Chọn hạn chót
            </div>
            <div className="date-picker-body">
              <input
                type="date"
                className="date-input"
                value={dueTime.split("T")[0] || ""}
                onChange={(e) => {
                  setDueTime(
                    e.target.value + "T" + (dueTime.split("T")[1] || "00:00"),
                  );
                  markDirty();
                }}
              />
              <input
                type="time"
                className="time-input"
                value={dueTime.split("T")[1] || ""}
                onChange={(e) => {
                  setDueTime(
                    (dueTime.split("T")[0] || "") + "T" + e.target.value,
                  );
                  markDirty();
                }}
              />
            </div>
            <div
              className="date-picker-footer"
              style={{ justifyContent: "space-between" }}
            >
              {dueTime && (
                <button
                  className="close-btn"
                  onClick={() => {
                    setDueTime("");
                    markDirty();
                    setDatePickerOpen(false);
                  }}
                >
                  Xóa hạn chót
                </button>
              )}
              <button
                className="btn-share"
                onClick={() => setDatePickerOpen(false)}
              >
                Xong
              </button>
            </div>
          </div>
        )}

        {note.labels && note.labels.length > 0 && (
          <div className="label-list" style={{ padding: "0 4px" }}>
            {note.labels.map((l) => {
              const lc = getLabelColor(l.label_id);
              return (
                <span
                  key={l.label_id}
                  className="label-badge"
                  style={{
                    backgroundColor: lc.bg,
                    border: `1px solid ${lc.border}`,
                    color: lc.text,
                  }}
                >
                  <img
                    src="/images/label.png"
                    alt="Thông báo"
                    style={{
                      width: "18px",
                      height: "18px",
                      objectFit: "contain",
                    }}
                  />
                  {l.label_name}
                </span>
              );
            })}
          </div>
        )}

        <div className="note-edit-footer">
          {isDeleted ? (
            <div className="note-edit-actions">
              <button
                className="card-btn"
                title="Khôi phục ghi chú"
                onClick={() => handleStatusClick("Active")}
              >
                <img
                  src="/images/reload.png"
                  alt="Thông báo"
                  style={{
                    width: "18px",
                    height: "18px",
                    objectFit: "contain",
                  }}
                />{" "}
                Khôi phục
              </button>
              <button
                className="card-btn"
                title="Xóa vĩnh viễn"
                style={{ color: "var(--accent)" }}
                onClick={() => handleStatusClick("PermanentlyDeleted")}
              >
                <img
                  src="/images/trash.png"
                  alt="Thông báo"
                  style={{
                    width: "18px",
                    height: "18px",
                    objectFit: "contain",
                  }}
                />{" "}
                Xóa vĩnh viễn
              </button>
            </div>
          ) : (
            <div className="note-edit-actions">
              {!isReadOnly && (
                <button
                  className="card-btn"
                  title="Đặt hạn chót / nhắc nhở"
                  onClick={() => onReminder(note.note_id)}
                >
                  <img
                    src="/images/timer.png"
                    alt="Nhắc nhở"
                    style={{
                      width: "18px",
                      height: "18px",
                      objectFit: "contain",
                    }}
                  />
                </button>
              )}
              {!isReadOnly && (
                <div style={{ position: "relative" }}>
                  <button
                    className="card-btn"
                    title="Đổi màu"
                    onClick={() => setColorPickerOpen((v) => !v)}
                  >
                    <img
                      src="/images/palette.png"
                      alt="Ghim"
                      style={{
                        width: "18px",
                        height: "18px",
                        objectFit: "contain",
                      }}
                    />
                  </button>
                  {colorPickerOpen && (
                    <div className="color-picker-popup">
                      {NOTE_COLORS.map((c) => (
                        <button
                          key={c.value}
                          title={c.name}
                          className={`color-dot ${color === c.value ? "selected" : ""}`}
                          style={{ backgroundColor: c.value }}
                          onClick={() => {
                            setColor(c.value);
                            markDirty();
                            setColorPickerOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!isReadOnly && (
                <button
                  className="card-btn"
                  title="Gán nhãn"
                  onClick={() => onLabel(note.note_id, note.labels || [])}
                >
                  <img
                    src="/images/label.png"
                    alt="Nhãn"
                    style={{
                      width: "18px",
                      height: "18px",
                      objectFit: "contain",
                    }}
                  />
                </button>
              )}
              {!isReadOnly && (
                <button
                  className="card-btn"
                  title="Chia sẻ"
                  onClick={() => onShare(note.note_id)}
                >
                  <img
                    src="/images/share (1).png"
                    alt="Chia sẻ"
                    style={{
                      width: "18px",
                      height: "18px",
                      objectFit: "contain",
                    }}
                  />
                </button>
              )}
              {!isReadOnly && (
                <button
                  className="card-btn"
                  title={isArchived ? "Hủy lưu trữ" : "Lưu trữ"}
                  onClick={() =>
                    handleStatusClick(isArchived ? "Active" : "Archived")
                  }
                >
                  <img
                    src="/images/archive.png"
                    alt="Lưu trữ"
                    style={{
                      width: "18px",
                      height: "18px",
                      objectFit: "contain",
                    }}
                  />
                </button>
              )}
              {!isReadOnly && (
                <button
                  className="card-btn"
                  title="Xóa"
                  onClick={() => handleStatusClick("Deleted")}
                >
                  <img
                    src="/images/trash.png"
                    alt="Xóa"
                    style={{
                      width: "18px",
                      height: "18px",
                      objectFit: "contain",
                    }}
                  />
                </button>
              )}
              <span className="note-edit-updated">
                Sửa lúc{" "}
                {note.updated_at &&
                  new Date(note.updated_at).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </span>
              <button
                className="btn-share note-edit-close"
                onClick={handleClose}
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
