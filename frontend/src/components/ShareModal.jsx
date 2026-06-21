import React from "react";

export default function ShareModal({
  email,
  setEmail,
  permission,
  setPermission,
  onClose,
  onSave,
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>Chia sẻ ghi chú</span>
          <button className="icon-btn" onClick={onClose}>
            ✖
          </button>
        </div>
        <div className="modal-body">
          <label style={{ fontSize: 13, color: "#5f6368" }}>
            Email người dùng:
          </label>
          <input
            className="modal-input"
            placeholder="Nhập email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label style={{ fontSize: 13, color: "#5f6368" }}>
            Quyền truy cập:
          </label>
          <select
            className="modal-select"
            value={permission}
            onChange={(e) => setPermission(e.target.value)}
          >
            <option value="View">Chỉ xem</option>
            <option value="Edit">Chỉnh sửa</option>
          </select>
        </div>
        <div className="modal-footer">
          <button className="close-btn" onClick={onClose}>
            Hủy
          </button>
          <button className="btn-share" onClick={onSave}>
            Chia sẻ
          </button>
        </div>
      </div>
    </div>
  );
}
