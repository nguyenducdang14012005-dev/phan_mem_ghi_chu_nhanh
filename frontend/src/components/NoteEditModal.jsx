// src/components/NoteEditModal.jsx — BẢN SỬA ĐẦY ĐỦ
import React, { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { NOTE_COLORS, getLabelColor } from "../constants/noteColors.js";
import { apiFetch, API } from "../services/apiClient.js";

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
  onClose, // (updatedPayload | null, statusChange?) => void
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

  // ── Lịch sử chỉnh sửa (versions) ──────────────────────────
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState([]);
  const [versLoading, setVersLoading] = useState(false);

  const dirtyRef = useRef(false);

  // ── BUG 1 FIX: chỉ readonly khi permission = 'view' ─────────
  // Trước đây: note.permission !== undefined  →  khoá cả edit/delete
  // Sửa:       note.permission === "view"     →  chỉ khoá view
  const isReadOnly = note.permission === "view";

  // Có thể chỉnh sửa: owner (không có permission) hoặc share edit/delete
  const canEdit =
    !note.permission ||
    note.permission === "edit" ||
    note.permission === "delete";

  const isDeleted = note.status === "Deleted";
  const isArchived = note.status === "Archived";

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
    if (canEdit && dirtyRef.current) {
      onClose(buildPayload());
    } else {
      onClose(null);
    }
  };

  const handleStatusClick = (status) => {
    if (canEdit && dirtyRef.current) {
      onClose(buildPayload(), status);
    } else {
      onClose(null, status);
    }
  };

  // ── Load lịch sử chỉnh sửa ────────────────────────────────
  const loadVersions = async () => {
    setVersLoading(true);
    try {
      const data = await apiFetch(`${API}/notes/${note.note_id}/versions`);
      setVersions(Array.isArray(data) ? data : []);
    } catch {
      setVersions([]);
    }
    setVersLoading(false);
  };

  useEffect(() => {
    if (showHistory) loadVersions();
  }, [showHistory]);

  const handleRestoreVersion = async (v) => {
    if (!canEdit) return;
    setTitle(v.title || "");
    setContent(v.content || "");
    markDirty();
    setShowHistory(false);
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="note-edit-modal"
        style={{ backgroundColor: color }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────── */}
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

        {/* ── Badge quyền (note chia sẻ) ─────────────────────── */}
        {note.permission && (
          <div
            style={{
              padding: "4px 12px",
              fontSize: 12,
              color: "#fff",
              background:
                note.permission === "view"
                  ? "#80868b"
                  : note.permission === "edit"
                    ? "#1a73e8"
                    : "#e8710a",
              borderRadius: 4,
              margin: "0 12px 8px",
              display: "inline-block",
            }}
          >
            <img
              src="/images/friends.png"
              alt="Thông báo"
              style={{
                width: "18px",
                height: "18px",
                objectFit: "contain",
              }}
            />{" "}
            {note.permission === "view"
              ? "Chỉ xem"
              : note.permission === "edit"
                ? "Có thể chỉnh sửa"
                : "Toàn quyền (chỉnh sửa + xóa)"}
          </div>
        )}

        {/* ── Editor ─────────────────────────────────────────── */}
        <div className="note-edit-body">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={(val) => {
              setContent(val);
              markDirty();
            }}
            modules={isReadOnly ? { toolbar: false } : modules}
            formats={formats}
            readOnly={isReadOnly}
            style={{ minHeight: 180 }}
          />
        </div>

        {/* ── Toolbar dưới (chỉ hiện khi không phải view-only) ── */}
        {!isDeleted && canEdit && (
          <div
            className="note-edit-toolbar"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              padding: "8px 12px",
            }}
          >
            {/* Màu nền */}
            <div style={{ position: "relative" }}>
              <button
                className="icon-btn"
                title="Đổi màu"
                onClick={() => setColorPickerOpen((o) => !o)}
              >
                <img
                  src="/images/palette.png"
                  alt="Thông báo"
                  style={{
                    width: "18px",
                    height: "18px",
                    objectFit: "contain",
                  }}
                />
              </button>
              {colorPickerOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "110%",
                    left: 0,
                    zIndex: 10,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 4,
                    padding: 8,
                    background: "#fff",
                    border: "1px solid #e8eaed",
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    width: 180,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      title={c.label}
                      onClick={() => {
                        setColor(c.value);
                        markDirty();
                        setColorPickerOpen(false);
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: c.value,
                        border:
                          color === c.value
                            ? "3px solid #1a73e8"
                            : "2px solid #e8eaed",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Nhắc nhở */}
            {onReminder && (
              <button
                className="icon-btn"
                title="Đặt nhắc nhở"
                onClick={() => onReminder(note.note_id)}
              >
                <img
                  src="/images/bell.png"
                  alt="Thông báo"
                  style={{
                    width: "18px",
                    height: "18px",
                    objectFit: "contain",
                  }}
                />
              </button>
            )}

            {/* Chia sẻ (chỉ owner) */}
            {!note.permission && onShare && (
              <button
                className="icon-btn"
                title="Chia sẻ"
                onClick={() => onShare(note.note_id)}
              >
                <img
                  src="/images/friends.png"
                  alt="Thông báo"
                  style={{
                    width: "18px",
                    height: "18px",
                    objectFit: "contain",
                  }}
                />
              </button>
            )}

            {/* Nhãn */}
            {!note.permission && onLabel && (
              <button
                className="icon-btn"
                title="Gắn nhãn"
                onClick={() => onLabel(note.note_id, note.labels || [])}
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
              </button>
            )}

            {/* Hẹn giờ */}
            <div style={{ position: "relative" }}>
              <button
                className="icon-btn"
                title="Hạn chót"
                onClick={() => setDatePickerOpen((o) => !o)}
              >
                📅{dueTime ? " ✓" : ""}
              </button>
              {datePickerOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "110%",
                    left: 0,
                    zIndex: 10,
                    background: "#fff",
                    border: "1px solid #e8eaed",
                    borderRadius: 8,
                    padding: 10,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="datetime-local"
                    value={dueTime}
                    onChange={(e) => {
                      setDueTime(e.target.value);
                      markDirty();
                    }}
                    style={{ fontSize: 13 }}
                  />
                  {dueTime && (
                    <button
                      onClick={() => {
                        setDueTime("");
                        markDirty();
                      }}
                      style={{ marginLeft: 6, fontSize: 12, cursor: "pointer" }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Lịch sử chỉnh sửa ─── */}
            <button
              className="icon-btn"
              title="Lịch sử chỉnh sửa"
              onClick={() => setShowHistory((o) => !o)}
              style={{ marginLeft: "auto" }}
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
              Lịch sử
            </button>
          </div>
        )}

        {/* Nút lịch sử cho note read-only (view-only share) */}
        {isReadOnly && (
          <div style={{ padding: "4px 12px 8px", textAlign: "right" }}>
            <button
              className="icon-btn"
              title="Lịch sử chỉnh sửa"
              onClick={() => setShowHistory((o) => !o)}
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
              Lịch sử
            </button>
          </div>
        )}

        {/* ── Panel Lịch sử chỉnh sửa ──────────────────────── */}
        {showHistory && (
          <div
            style={{
              borderTop: "1px solid #e8eaed",
              maxHeight: 260,
              overflowY: "auto",
              padding: "10px 14px",
              background: "#fafafa",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontWeight: 600,
                fontSize: 13,
                color: "#3c4043",
              }}
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
              Lịch sử chỉnh sửa
            </p>
            {versLoading ? (
              <p style={{ fontSize: 13, color: "#80868b" }}>Đang tải...</p>
            ) : versions.length === 0 ? (
              <p style={{ fontSize: 13, color: "#80868b" }}>
                Chưa có lịch sử chỉnh sửa.
              </p>
            ) : (
              versions.map((v, i) => (
                <div
                  key={v.version_id ?? i}
                  style={{
                    padding: "8px 10px",
                    marginBottom: 6,
                    borderRadius: 6,
                    background: "#fff",
                    border: "1px solid #e8eaed",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 12, color: "#80868b" }}>
                      {v.updated_at
                        ? new Date(v.updated_at).toLocaleString("vi-VN")
                        : "—"}
                      {v.editor_email ? ` · ${v.editor_email}` : ""}
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => handleRestoreVersion(v)}
                        style={{
                          fontSize: 12,
                          padding: "3px 10px",
                          borderRadius: 6,
                          border: "1px solid #1a73e8",
                          color: "#1a73e8",
                          background: "white",
                          cursor: "pointer",
                        }}
                      >
                        Khôi phục
                      </button>
                    )}
                  </div>
                  <span
                    style={{ fontSize: 13, fontWeight: 500, color: "#3c4043" }}
                  >
                    {v.title || "(không có tiêu đề)"}
                  </span>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#5f6368",
                      maxHeight: 60,
                      overflow: "hidden",
                    }}
                    dangerouslySetInnerHTML={{ __html: v.content || "" }}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Footer: Status actions ──────────────────────────── */}
        {!note.permission && (
          <div
            className="note-edit-footer"
            style={{
              display: "flex",
              gap: 6,
              padding: "8px 12px",
              flexWrap: "wrap",
            }}
          >
            {isDeleted ? (
              <>
                <button
                  className="card-btn"
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
                  className="card-btn danger"
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
              </>
            ) : (
              <>
                {!isArchived && (
                  <button
                    className="card-btn"
                    onClick={() => handleStatusClick("Archived")}
                  >
                    <img
                      src="/images/archive.png"
                      alt="Thông báo"
                      style={{
                        width: "18px",
                        height: "18px",
                        objectFit: "contain",
                      }}
                    />
                    Lưu trữ
                  </button>
                )}
                {isArchived && (
                  <button
                    className="card-btn"
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
                    Bỏ lưu trữ
                  </button>
                )}
                <button
                  className="card-btn"
                  onClick={() => handleStatusClick("Deleted")}
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
                  Xóa
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
