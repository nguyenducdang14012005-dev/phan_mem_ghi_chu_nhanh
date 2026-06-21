import React from "react";

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
}) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="icon-btn" onClick={toggleSidebar}>
          ☰
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#6C63FF" }}>
          {"Ghi chú"}
        </span>
      </div>

      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Tìm kiếm"
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
          <option value="due_asc">những việc cần làm bây giờ</option>
        </select>
        <button className="icon-btn" onClick={onRefresh} title="Làm mới">
          ⟳
        </button>
        <div style={{ position: "relative", display: "inline-block" }}>
          <button className="icon-btn" title="Cài đặt" onClick={toggleMenu}>
            ⚙
          </button>

          {isOpen && (
            <ul className="dropdown-menu">
              {/* Dòng 1: Lúc nào cũng hiện Hồ sơ */}
              <li
                onClick={() => {
                  alert("Xem hồ sơ");
                  toggleMenu();
                }}
              >
                👤 Hồ sơ
              </li>

              {/* Dòng 2: Xử lý logic Đã Đăng Nhập / Chưa Đăng Nhập */}
              {isLogin ? (
                /* NẾU ĐÃ ĐĂNG NHẬP (isLogin có giá trị đúng) -> HIỂN THỊ TÊN VÀ NÚT ĐĂNG XUẤT */
                <>
                  <li style={{ fontWeight: "bold", color: "#6C63FF" }}>
                    Chào, {isLogin}
                  </li>
                  <li
                    onClick={() => {
                      isLogOut();
                      toggleMenu();
                    }}
                  >
                    🚪 Đăng xuất
                  </li>
                </>
              ) : (
                /* NẾU CHƯA ĐĂNG NHẬP (isLogin là false/null) -> HIỂN THỊ NÚT ĐĂNG NHẬP */
                <li
                  onClick={() => {
                    alert("Chuyển hướng đến trang Đăng nhập");
                    toggleMenu();
                  }}
                >
                  🔑 Đăng nhập
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
