import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { NOTE_COLORS, getLabelColor } from "../constants/noteColors.js";

// ⚡ KHÔNG định nghĩa modules ở đây — cần dùng id riêng cho mỗi instance
// để tránh xung đột khi nhiều modal mở cùng lúc

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
  onClose,
  onPin,
  onReminder,
  onShare,
  onLabel,
}) {
  const [title, setTitle] = useState(note.title || "");
  const [content, setContent] = useState(note.content || "");
  const [color, setColor] = useState(note.color || "#ffffff");
  const [dueTime, setDueTime] = useState(
    note.due_time ? note.due_time.slice(0, 16) : "",
  );
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const dirtyRef = useRef(false);

  // ⚡ Vị trí (top/left tính theo viewport) để render popup qua Portal,
  // tránh bị .note-edit-modal { overflow: hidden } / .note-edit-body { overflow-y: auto } cắt mất
  const [datePickerPos, setDatePickerPos] = useState({ top: 0, left: 0 });
  const [colorPickerPos, setColorPickerPos] = useState({ top: 0, left: 0 });
  const dateTriggerRef = useRef(null);
  const colorTriggerRef = useRef(null);

  const openDatePicker = () => {
    const rect = dateTriggerRef.current?.getBoundingClientRect();
    if (rect) {
      setDatePickerPos({ top: rect.bottom + 6, left: rect.left });
    }
    setDatePickerOpen(true);
  };

  const openColorPicker = () => {
    const rect = colorTriggerRef.current?.getBoundingClientRect();
    if (rect) {
      // Popup cao ~210px -> mở LÊN TRÊN nút bấm (giống Google Keep), trừ khi không đủ chỗ
      const popupHeight = 210;
      const top =
        rect.top - popupHeight > 0 ? rect.top - popupHeight - 8 : rect.bottom + 8;
      setColorPickerPos({ top, left: rect.left });
    }
    setColorPickerOpen((v) => !v);
  };

  // ID duy nhất cho toolbar div — tránh xung đột nếu render nhiều modal
  const toolbarId = useRef(`ql-toolbar-modal-${note.note_id}`).current;

  const isDeleted = note.status === "Deleted";
  const isArchived = note.status === "Archived";
  const isReadOnly = note.permission !== undefined;

  // ⚡ modules trỏ vào div toolbar bên ngoài .note-edit-body (anh em, không phải cha/con)
  const modules = {
    toolbar: isReadOnly ? false : { container: `#${toolbarId}` },
  };

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
    if (!isReadOnly && dirtyRef.current) onClose(buildPayload());
    else onClose(null);
  };

  const handleStatusClick = (status) => {
    if (!isReadOnly && dirtyRef.current) onClose(buildPayload(), status);
    else onClose(null, status);
  };

  return (
    <div className="modal-overlay note-edit-overlay" onClick={handleClose}>
      <div
        className="note-edit-modal"
        style={{ backgroundColor: color }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header: tiêu đề + ghim + đóng ─────────────────────────── */}
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
                style={{ width: 18, height: 18, objectFit: "contain" }}
              />
            </button>
          )}
          <button className="icon-btn" title="Đóng" onClick={handleClose}>
            ✖
          </button>
        </div>

        {/* ── ⚡ TOOLBAR: anh em với .note-edit-body, NGOÀI vùng cuộn ── */}
        {!isReadOnly && (
          <div
            id={toolbarId}
            className="ql-toolbar ql-snow note-edit-toolbar-sticky"
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
        )}

        {/* ── Body: CHỈ phần này cuộn ─────────────────────────────────── */}
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

          {/* Hạn chót */}
          {note.due_time && !dueTime && !datePickerOpen && !isReadOnly && (
            <div
              ref={dateTriggerRef}
              className="note-due-time"
              style={{ cursor: "pointer", marginLeft: 4 }}
              onClick={openDatePicker}
            >
              <img
                src="/images/timer.png"
                alt="Thông báo"
                style={{ width: 18, height: 18, objectFit: "contain" }}
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
              ref={dateTriggerRef}
              className="note-due-time"
              style={{
                cursor: isReadOnly ? "default" : "pointer",
                marginLeft: 4,
              }}
              onClick={() => !isReadOnly && openDatePicker()}
            >
              <img
                src="/images/timer.png"
                alt="Thông báo"
                style={{ width: 18, height: 18, objectFit: "contain" }}
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
          {!note.due_time && !dueTime && !datePickerOpen && !isReadOnly && (
            <button
              ref={dateTriggerRef}
              className="card-btn"
              style={{
                marginLeft: 4,
                marginBottom: 4,
                fontSize: "0.82rem",
                color: "#5f6368",
              }}
              title="Thêm hạn chót"
              onClick={openDatePicker}
            >
              + Thêm hạn chót
            </button>
          )}
          {datePickerOpen &&
            !isReadOnly &&
            createPortal(
              <div
                className="date-picker-popup"
                style={{ top: datePickerPos.top, left: datePickerPos.left }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="date-picker-header">
                  <span>← Chọn ngày và giờ</span>
                </div>
                <div className="date-picker-body">
                  <input
                    type="date"
                    className="date-input"
                    value={dueTime.split("T")[0] || ""}
                    onChange={(e) =>
                      setDueTime(
                        e.target.value +
                          "T" +
                          (dueTime.split("T")[1] || "00:00"),
                      )
                    }
                  />
                  <input
                    type="time"
                    className="time-input"
                    value={dueTime.split("T")[1] || ""}
                    onChange={(e) =>
                      setDueTime(
                        (dueTime.split("T")[0] || "") + "T" + e.target.value,
                      )
                    }
                  />
                </div>
                <div className="date-picker-footer">
                  <button
                    className="close-btn"
                    onClick={() => {
                      setDueTime("");
                      setDatePickerOpen(false);
                      markDirty();
                    }}
                  >
                    Xóa
                  </button>
                  <button
                    className="btn-share"
                    onClick={() => {
                      setDatePickerOpen(false);
                      markDirty();
                    }}
                  >
                    Lưu
                  </button>
                </div>
              </div>,
              document.body,
            )}
        </div>

        {/* ── Footer: action buttons ─────────────────────────────────── */}
        <div className="note-edit-footer">
          <div
            style={{
              display: "flex",
              gap: 4,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {!isReadOnly && (
              <>
                {/* Màu nền */}
                <div style={{ position: "relative" }}>
                  <button
                    ref={colorTriggerRef}
                    className="icon-btn"
                    title="Đổi màu"
                    onClick={openColorPicker}
                  >
                    <img
                      src="/images/palette.png"
                      alt="Màu"
                      style={{ width: 18, height: 18, objectFit: "contain" }}
                    />
                  </button>
                  {colorPickerOpen &&
                    createPortal(
                      <div
                        className="color-picker-popup"
                        style={{
                          top: colorPickerPos.top,
                          left: colorPickerPos.left,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {NOTE_COLORS.map((c) => (
                          <button
                            key={c.value}
                            type="button"
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
                      </div>,
                      document.body,
                    )}
                </div>
                {/* Nhắc nhở */}
                <button
                  className="icon-btn"
                  title="Đặt nhắc nhở"
                  onClick={() => onReminder && onReminder(note.note_id)}
                >
                  <img
                    src="/images/bell.png"
                    alt="Nhắc nhở"
                    style={{ width: 18, height: 18, objectFit: "contain" }}
                  />
                </button>
                {/* Chia sẻ */}
                <button
                  className="icon-btn"
                  title="Chia sẻ"
                  onClick={() => onShare && onShare(note.note_id)}
                >
                  <img
                    src="/images/share.png"
                    alt="Chia sẻ"
                    style={{ width: 18, height: 18, objectFit: "contain" }}
                  />
                </button>
                {/* Nhãn */}
                <button
                  className="icon-btn"
                  title="Gắn nhãn"
                  onClick={() =>
                    onLabel && onLabel(note.note_id, note.labels || [])
                  }
                >
                  <img
                    src="/images/label.png"
                    alt="Nhãn"
                    style={{ width: 18, height: 18, objectFit: "contain" }}
                  />
                </button>
              </>
            )}
          </div>

          {/* Nút trạng thái */}
          <div style={{ display: "flex", gap: 6 }}>
            {!isReadOnly && (
              <>
                {isDeleted ? (
                  <>
                    <button
                      className="card-btn"
                      onClick={() => handleStatusClick("Active")}
                    >
                      <img
                        src="/images/reload.png"
                        alt="Nhãn"
                        style={{ width: 18, height: 18, objectFit: "contain" }}
                      />{" "}
                      Khôi phục
                    </button>
                    <button
                      className="card-btn"
                      style={{ color: "#d32f2f" }}
                      onClick={() => handleStatusClick("PermanentlyDeleted")}
                    >
                      <img
                        src="/images/trash.png"
                        alt="Nhãn"
                        style={{ width: 18, height: 18, objectFit: "contain" }}
                      />{" "}
                      Xóa vĩnh viễn
                    </button>
                  </>
                ) : (
                  <>
                    {isArchived ? (
                      <button
                        className="card-btn"
                        onClick={() => handleStatusClick("Active")}
                      >
                        <img
                          src="/images/archive.png"
                          alt="Nhãn"
                          style={{
                            width: 18,
                            height: 18,
                            objectFit: "contain",
                          }}
                        />{" "}
                        Bỏ lưu trữ
                      </button>
                    ) : (
                      <button
                        className="card-btn"
                        onClick={() => handleStatusClick("Archived")}
                      >
                        <img
                          src="/images/archive.png"
                          alt="Nhãn"
                          style={{
                            width: 18,
                            height: 18,
                            objectFit: "contain",
                          }}
                        />{" "}
                        Lưu trữ
                      </button>
                    )}
                    <button
                      className="card-btn"
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      <img
                        src="/images/trash.png"
                        alt="Nhãn"
                        style={{ width: 18, height: 18, objectFit: "contain" }}
                      />
                      Xóa
                    </button>
                  </>
                )}
              </>
            )}
            <button className="close-btn" onClick={handleClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* ⚡ Xác nhận xóa — portal ra document.body, nổi trên TẤT CẢ (modal note,
          các popup khác...), có nền mờ riêng, đóng khi bấm Hủy hoặc bấm ra ngoài */}
      {deleteConfirmOpen &&
        createPortal(
          <div
            className="modal-overlay"
            style={{ zIndex: 700 }}
            onClick={() => setDeleteConfirmOpen(false)}
          >
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span>Xóa ghi chú</span>
                <button
                  className="icon-btn"
                  onClick={() => setDeleteConfirmOpen(false)}
                >
                  ✖
                </button>
              </div>
              <div className="modal-body">
                <p style={{ margin: 0 }}>
                  Bạn có chắc muốn xóa ghi chú này không?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="close-btn"
                  onClick={() => setDeleteConfirmOpen(false)}
                >
                  Hủy
                </button>
                <button
                  className="btn-share"
                  style={{ background: "#d64545" }}
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    handleStatusClick("Deleted");
                  }}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
