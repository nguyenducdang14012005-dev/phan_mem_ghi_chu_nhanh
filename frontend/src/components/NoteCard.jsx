import React, { useState } from "react";

export default function NoteCard({
  note,
  onPin,
  onStatus,
  onReminder,
  onShare,
  onLabel,
  onViewDetails,
}) {
  const [hovered, setHovered] = useState(false);
  const bg =
    note.color && note.color !== "#FFFFFF" && note.color !== "#ffffff"
      ? note.color
      : "#fff";

  // Kiểm tra xem ghi chú này có đang nằm trong Thùng rác (Deleted) hay không
  const isDeleted = note.status === "Deleted";

  return (
    <div
      className="note-card"
      data-status={note.status} // Hỗ trợ CSS nhận diện nét đứt cho ghi chú Archived
      style={{ backgroundColor: bg }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onViewDetails && onViewDetails(note)} // Gọi modal xem chi tiết
    >
      {note.is_pinned && !isDeleted && <div className="pin-badge">📌</div>}

      {note.title && (
        <div
          className="note-title"
          dangerouslySetInnerHTML={{ __html: note.title }}
        />
      )}

      <div
        className="note-content"
        dangerouslySetInnerHTML={{ __html: note.content }}
      />

      {note.due_time && (
        <div className="note-due-time">
          {new Date(note.due_time).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}

      {note.labels && note.labels.length > 0 && (
        <div className="label-list">
          {note.labels.map((l) => (
            <span key={l.label_id} className="label-badge">
              {l.label_name}
            </span>
          ))}
        </div>
      )}

      {hovered && (
        <div className="card-actions">
          {isDeleted ? (
            /* ⚡ CHỈ HIỆN 2 NÚT NÀY KHI Ở TRONG THÙNG RÁC */
            <>
              <button
                className="card-btn"
                title="Khôi phục ghi chú"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatus(note.note_id, "Active"); // Chuyển ngược về Active
                }}
              >
                🔄 Khôi phục
              </button>
              <button
                className="card-btn"
                title="Xóa vĩnh viễn"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatus(note.note_id, "PermanentlyDeleted"); // Gửi tín hiệu xóa cứng lên backend
                }}
                style={{ color: "var(--accent)" }}
              >
                🗑 Xóa vĩnh viễn
              </button>
            </>
          ) : (
            /* ⚡ HIỆN ĐẦY ĐỦ CÁC NÚT KHI Ở TRẠNG THÁI BÌNH THƯỜNG */
            <>
              <button
                className="card-btn"
                title={note.is_pinned ? "Bỏ ghim" : "Ghim"}
                onClick={(e) => {
                  e.stopPropagation();
                  onPin(note.note_id);
                }}
              >
                {note.is_pinned ? "📌" : "📍"}
              </button>
              <button
                className="card-btn"
                title="Nhắc nhở"
                onClick={(e) => {
                  e.stopPropagation();
                  onReminder(note.note_id);
                }}
              >
                🔔
              </button>
              <button
                className="card-btn"
                title="Gán nhãn"
                onClick={(e) => {
                  e.stopPropagation();
                  onLabel(note.note_id, note.labels || []);
                }}
              >
                🏷
              </button>
              <button
                className="card-btn"
                title="Chia sẻ"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(note.note_id);
                }}
              >
                ✉️
              </button>
              <button
                className="card-btn"
                title={note.status === "Archived" ? "Hủy lưu trữ" : "Lưu trữ"}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatus(
                    note.note_id,
                    note.status === "Archived" ? "Active" : "Archived",
                  );
                }}
              >
                🗄
              </button>
              <button
                className="card-btn"
                title="Xóa"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatus(note.note_id, "Deleted");
                }}
              >
                🗑
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
