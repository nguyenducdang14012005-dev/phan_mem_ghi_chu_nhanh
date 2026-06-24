import React, { useState, useEffect, useRef } from "react";

export default function TopBar({
  keyword,
  onSearch,
  sortBy,
  setSortBy,
  onRefresh,
  toggleSidebar,
  isOpen,
  toggleMenu,
  isLogin,
  isLogOut,
  pendingShares = [],
  onAcceptShare,
  onRejectShare,
  mySharedNotes = [],
  onRevokeShare,
  adminButton,
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [sharedListOpen, setSharedListOpen] = useState(false);
  const notifRef = useRef(null);
  const sharedRef = useRef(null);
  const settingsRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
      if (sharedRef.current && !sharedRef.current.contains(e.target))
        setSharedListOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const permissionLabel = (p) =>
    ({ view: "Chỉ xem", edit: "Chỉnh sửa", delete: "Toàn quyền" })[p] || p;

  const statusLabel = (s) =>
    ({ Pending: "Đang chờ", Accepted: "Đã chấp nhận", Rejected: "Đã từ chối" })[
      s
    ] || s;

  const statusClass = (s) =>
    ({
      Accepted: "status-accepted",
      Rejected: "status-rejected",
      Pending: "status-pending",
    })[s] || "";

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button
          className="icon-btn"
          onClick={toggleSidebar}
          title="Mở/đóng sidebar"
        >
          ☰
        </button>
        <span className="topbar-brand">Ghi chú</span>
      </div>

      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Tìm kiếm ghi chú..."
          value={keyword}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="topbar-right">
        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="az">Tên A-Z</option>
          <option value="za">Tên Z-A</option>
          <option value="due_asc">Deadline gần nhất</option>
        </select>

        <button className="icon-btn" onClick={onRefresh} title="Làm mới">
          <img
            src="/images/reload.png"
            alt="Thông báo"
            style={{
              width: "18px",
              height: "18px",
              objectFit: "contain",
            }}
          />
        </button>

        {/* ── CHUÔNG: lời mời chia sẻ pending ── */}
        <div className="tb-dropdown-wrap" ref={notifRef}>
          <button
            className="icon-btn tb-notif-btn"
            title="Thông báo chia sẻ"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setSharedListOpen(false);
            }}
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

            {pendingShares.length > 0 && (
              <span className="tb-badge">{pendingShares.length}</span>
            )}
          </button>

          {notifOpen && (
            <div className="tb-dropdown">
              <div className="tb-dropdown-header">
                <span>Lời mời chia sẻ</span>
                <span className="tb-dropdown-count">
                  {pendingShares.length}
                </span>
              </div>

              {pendingShares.length === 0 ? (
                <div className="tb-dropdown-empty">Không có thông báo mới</div>
              ) : (
                <div className="tb-dropdown-list">
                  {pendingShares.map((s) => (
                    <div key={s.share_id} className="tb-share-item">
                      <div className="tb-share-meta">
                        <span className="tb-share-title">
                          <b>{s.shared_by_name || s.shared_by_email}</b> chia sẻ{" "}
                          <b>"{s.title || "Không có tiêu đề"}"</b>
                        </span>

                        <span className="tb-share-perm">
                          Quyền: {permissionLabel(s.permission)}
                        </span>
                      </div>

                      <div className="tb-share-actions">
                        <button
                          className="tb-btn-accept"
                          onClick={() => {
                            onAcceptShare?.(s.share_id);
                            setNotifOpen(false);
                          }}
                        >
                          Chấp nhận
                        </button>

                        <button
                          className="tb-btn-reject"
                          onClick={() => {
                            onRejectShare?.(s.share_id);
                            setNotifOpen(false);
                          }}
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── NGƯỜI: note mình đã chia sẻ ── */}
        <div className="tb-dropdown-wrap" ref={sharedRef}>
          <button
            className="icon-btn"
            title="Ghi chú đã chia sẻ"
            onClick={() => {
              setSharedListOpen(!sharedListOpen);
              setNotifOpen(false);
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
            />
          </button>

          {sharedListOpen && (
            <div className="tb-dropdown tb-dropdown--wide">
              <div className="tb-dropdown-header">
                <span>Ghi chú tôi đã chia sẻ</span>
                <span className="tb-dropdown-count">
                  {mySharedNotes.length}
                </span>
              </div>

              {mySharedNotes.length === 0 ? (
                <div className="tb-dropdown-empty">
                  Bạn chưa chia sẻ ghi chú nào
                </div>
              ) : (
                <div className="tb-dropdown-list">
                  {mySharedNotes.map((s) => (
                    <div key={s.share_id} className="tb-share-item">
                      <div className="tb-share-meta">
                        <span className="tb-share-title">
                          <b>"{s.title || "Không có tiêu đề"}"</b>
                          {" → "}
                          {s.shared_with_name || s.shared_with_email}
                        </span>
                        <span className="tb-share-perm">
                          {permissionLabel(s.permission)} ·{" "}
                          <span className={statusClass(s.share_status)}>
                            {statusLabel(s.share_status)}
                          </span>
                        </span>
                      </div>
                      <button
                        className="tb-btn-revoke"
                        onClick={() => onRevokeShare?.(s.share_id)}
                      >
                        Dừng
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── CÀI ĐẶT ── */}
        {adminButton}

        <div className="tb-dropdown-wrap" ref={settingsRef}>
          <button className="icon-btn" title="Cài đặt" onClick={toggleMenu}>
            <img
              src="/images/settings.png"
              alt="Thông báo"
              style={{
                width: "18px",
                height: "18px",
                objectFit: "contain",
              }}
            />
          </button>

          {isOpen && (
            <div className="tb-dropdown">
              <div className="tb-dropdown-header">
                <span>Tài khoản</span>
              </div>
              {isLogin ? (
                <>
                  <div className="tb-user-info">
                    <div className="tb-user-avatar">
                      {(isLogin.fullName ||
                        isLogin.full_name ||
                        "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="tb-user-name">
                        {isLogin.fullName || isLogin.full_name}
                      </div>
                      <div className="tb-user-email">{isLogin.email}</div>
                    </div>
                  </div>
                  <div className="tb-dropdown-divider" />
                  <button
                    className="tb-menu-item tb-menu-item--danger"
                    onClick={() => {
                      isLogOut();
                      toggleMenu();
                    }}
                  >
                    <img
                      src="/images/logout.png"
                      alt="Thông báo"
                      style={{
                        width: "18px",
                        height: "18px",
                        objectFit: "contain",
                      }}
                    />{" "}
                    Đăng xuất
                  </button>
                </>
              ) : (
                <button className="tb-menu-item" onClick={toggleMenu}>
                  <img
                    src="/images/log-in.png"
                    alt="Thông báo"
                    style={{
                      width: "18px",
                      height: "18px",
                      objectFit: "contain",
                    }}
                  />{" "}
                  Đăng nhập
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
