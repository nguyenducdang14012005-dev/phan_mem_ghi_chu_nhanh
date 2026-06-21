import React from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css"; // Stylesheet bắt buộc của Quill

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
  datePickerOpen,
  setDatePickerOpen,
  createNote,
}) {
  if (view !== "notes") return null;

  // Hàm xử lý khi người dùng nhấn nút "Hủy"
  const handleCancel = () => {
    setNewTitle("");
    setNewContent("");
    setNewDueTime("");
    setComposerOpen(false);
    if (setDatePickerOpen) setDatePickerOpen(false);
  };

  // Cấu hình các thanh công cụ định dạng (Word-like Toolbar)
  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike"], // Định dạng chữ cơ bản
      [{ color: [] }, { background: [] }], // Màu chữ và màu nền highlight
      [{ list: "ordered" }, { list: "bullet" }], // Danh sách số và dấu chấm
      [{ align: [] }], // Căn lề trái, giữa, phải, đều
      ["clean"], // Nút xóa nhanh mọi định dạng đang chọn
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

  return (
    <div className="composer-wrapper">
      {!composerOpen ? (
        /* Nhấn vào bất kỳ vị trí nào của composer-collapsed đều mở trình soạn thảo */
        <div
          className="composer-collapsed"
          onClick={() => setComposerOpen(true)}
        >
          <span>
            {newContent ? newContent.replace(/<[^>]*>/g, "") : "Ghi chú..."}
          </span>
        </div>
      ) : (
        <div className="composer-expanded">
          {/* Ô nhập tiêu đề giữ nguyên là input text thông thường */}
          <input
            className="composer-title"
            placeholder="Tiêu đề"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />

          {/* Thay thế input nội dung cũ bằng Rich Text Editor */}
          <div
            className="composer-editor-container"
            style={{ margin: "10px 0" }}
          >
            <ReactQuill
              theme="snow"
              value={newContent}
              onChange={setNewContent}
              placeholder="Ghi chú..."
              modules={modules}
              formats={formats}
            />
          </div>

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

          <div
            className="composer-actions"
            style={{
              marginTop: "14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Tách riêng hai nút chức năng Lưu và Hủy */}
            <div style={{ display: "flex", gap: 8 }}>
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
