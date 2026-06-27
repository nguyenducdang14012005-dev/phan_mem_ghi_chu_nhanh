import { useState, useEffect, useRef } from "react";
import "./HomePage.css";
import "./share.css";

import shareService, { getAcceptedSharedNotes } from "../services/shareService";
import TopBar from "../components/TopBar";
import SideBar from "../components/SideBar";
import NoteCard from "../components/NoteCard";
import NoteComposer from "../components/NoteComposer";
import NoteEditModal from "../components/NoteEditModal";
import ReminderModal from "../components/ReminderModal";
import ShareModal from "../components/ShareModal";
import LabelPickerModal from "../components/LabelPickerModal";
import ConfirmModal from "../components/ConfirmModal";
import ChangePasswordModal from "../components/ChangePasswordModal";
import Toast from "../components/Toast";

// ⚡ IMPORT: Admin Dashboard page
import AdminDashboardPage from "./AdminDashboardPage";

import noteService from "../services/noteService";
import labelService from "../services/labelService";
import reminderService from "../services/reminderService";

export default function HomePage({ isLogin, setIsLogin }) {
  useEffect(() => {
    Notification.requestPermission();
  }, []);

  // ⚡ STATE: Điều hướng sang trang Admin
  const [page, setPage] = useState("home"); // "home" | "admin"
  const [acceptedSharedNotes, setAcceptedSharedNotes] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const isLogOut = () => setIsLogin(null);

  const [notes, setNotes] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("notes");
  const [keyword, setKeyword] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newDueTime, setNewDueTime] = useState("");
  const [newColor, setNewColor] = useState("#ffffff");
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderNoteId, setReminderNoteId] = useState(null);
  const [reminderTime, setReminderTime] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareNoteId, setShareNoteId] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState("view");
  const searchTimer = useRef(null);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedLabelName, setSelectedLabelName] = useState("");
  const [labelPickerOpen, setLabelPickerOpen] = useState(false);
  const [labelPickerNoteId, setLabelPickerNoteId] = useState(null);
  const [labelPickerNoteLabels, setLabelPickerNoteLabels] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }
  const [viewingNote, setViewingNote] = useState(null);
  const [pendingShares, setPendingShares] = useState([]);
  const [mySharedNotes, setMySharedNotes] = useState([]);

  useEffect(() => {
    loadNotes();
    loadLabels();
    loadPendingShares();
    loadMySharedNotes();
    loadAcceptedSharedNotes();
    const interval = setInterval(() => {
      checkReminders();
      loadPendingShares();
      loadMySharedNotes();
      loadAcceptedSharedNotes();
    }, 10000);
    return () => clearInterval(interval);
  }, [view, selectedLabel, sortBy, isLogin]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 30000);
  };

  const loadNotes = async (kw = keyword, sort = sortBy) => {
    setLoading(true);
    try {
      if (!isLogin || !isLogin.userId) {
        setNotes([]);
        setLoading(false);
        return;
      }
      let data = [];
      if (view === "notes") {
        const activeNotes = await noteService.searchNotes({
          view: "notes",
          keyword: kw,
          label_id: selectedLabel,
          user_id: isLogin.userId,
        });
        const archivedNotes = await noteService.searchNotes({
          view: "archive",
          keyword: kw,
          label_id: selectedLabel,
          user_id: isLogin.userId,
        });
        const safeActive = Array.isArray(activeNotes) ? activeNotes : [];
        const safeArchived = Array.isArray(archivedNotes) ? archivedNotes : [];
        data = [...safeActive, ...safeArchived];
      } else {
        const result = await noteService.searchNotes({
          view,
          keyword: kw,
          label_id: selectedLabel,
          user_id: isLogin.userId,
        });
        data = Array.isArray(result) ? result : [];
      }

      const sorted = [...data].sort((a, b) => {
        if (sortBy === "newest")
          return new Date(b.updated_at) - new Date(a.updated_at);
        if (sortBy === "oldest")
          return new Date(a.updated_at) - new Date(b.updated_at);
        if (sortBy === "az")
          return (a.title || "").localeCompare(b.title || "");
        if (sortBy === "za")
          return (b.title || "").localeCompare(a.title || "");
        if (sortBy === "due_asc")
          return (
            new Date(a.due_time || "9999") - new Date(b.due_time || "9999")
          );
        return 0;
      });
      setNotes(sorted);
    } catch {
      setNotes([]);
    }
    setLoading(false);
  };

  const loadLabels = async () => {
    try {
      const data = await labelService.getLabels();
      setLabels(Array.isArray(data) ? data : []);
    } catch {
      setLabels([]);
    }
  };

  const loadPendingShares = async () => {
    if (!isLogin || !isLogin.userId) {
      setPendingShares([]);
      return;
    }
    try {
      const data = await shareService.getPendingShares();
      setPendingShares(Array.isArray(data) ? data : []);
    } catch {
      setPendingShares([]);
    }
  };

  const loadMySharedNotes = async () => {
    if (!isLogin || !isLogin.userId) {
      setMySharedNotes([]);
      return;
    }
    try {
      const data = await shareService.getMySharedNotes();
      setMySharedNotes(Array.isArray(data) ? data : []);
    } catch {
      setMySharedNotes([]);
    }
  };

  const handleAcceptShare = async (share_id) => {
    try {
      await shareService.acceptShare(share_id);
      showToast("Đã chấp nhận chia sẻ");
      loadPendingShares();
      loadNotes();
    } catch {
      showToast("Lỗi khi chấp nhận chia sẻ");
    }
  };

  const handleRejectShare = async (share_id) => {
    try {
      await shareService.rejectShare(share_id);
      showToast("Đã từ chối chia sẻ");
      loadPendingShares();
    } catch {
      showToast("Lỗi khi từ chối chia sẻ");
    }
  };

  const handleRevokeShare = async (share_id) => {
    try {
      await shareService.removeShare(share_id);
      showToast("Đã dừng chia sẻ ghi chú");
      loadMySharedNotes();
    } catch {
      showToast("Lỗi khi dừng chia sẻ");
    }
  };

  const handleOpenNotifications = async () => {
    try {
      await shareService.markNotificationsSeen();
      loadPendingShares();
    } catch {
      // ignore
    }
  };
  const loadAcceptedSharedNotes = async () => {
    if (!isLogin?.userId) {
      setAcceptedSharedNotes([]);
      return;
    }
    try {
      const data = await shareService.getAcceptedSharedNotes();
      setAcceptedSharedNotes(Array.isArray(data) ? data : []);
    } catch {
      setAcceptedSharedNotes([]);
    }
  };
  const checkReminders = async () => {
    try {
      const data = await reminderService.getReminders();
      const now = new Date();
      data.forEach((r) => {
        const remindTime = new Date(r.remind_time);
        const diff = remindTime - now;
        remindTime.setHours(remindTime.getHours() + 7);
        if (diff > 0 && diff <= 10000) showToast("Đã đến giờ nhắc nhở!");
      });
    } catch {}
  };

  const handleSearch = (val) => {
    setKeyword(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadNotes(val), 400);
  };

  const handleSetReminder = async () => {
    if (!reminderTime) return showToast("Vui lòng chọn thời gian");
    try {
      const data = await reminderService.getReminders();
      const trung = data.find((r) => {
        const dbTime = new Date(r.remind_time);
        dbTime.setHours(dbTime.getHours() + 7);
        return dbTime.toISOString().slice(0, 16) === reminderTime;
      });
      if (trung) return showToast("Đã có nhắc nhở vào giờ này rồi!");
    } catch {}
    try {
      await reminderService.createReminder({
        note_id: reminderNoteId,
        remind_time: reminderTime,
      });
      showToast("Đã đặt nhắc nhở");
      setReminderOpen(false);
      setReminderTime("");
    } catch {
      showToast("Lỗi khi đặt nhắc nhở");
    }
  };

  const handleShare = async () => {
    if (!shareEmail) return showToast("Vui lòng nhập email");
    try {
      await shareService.shareNote(shareNoteId, {
        email: shareEmail,
        permission: sharePermission,
      });
      showToast("Đã gửi lời mời chia sẻ, đang chờ người nhận phản hồi");
      setShareOpen(false);
      setShareEmail("");
      setSharePermission("view");
      loadMySharedNotes();
    } catch (err) {
      showToast(err?.message || "Lỗi khi chia sẻ");
    }
  };

  const createNote = async () => {
    if (!newTitle && !newContent) {
      setComposerOpen(false);
      return;
    }
    if (newDueTime) {
      const trung = notes.find((n) => {
        if (!n.due_time) return false;
        const dbTime = new Date(n.due_time);
        dbTime.setHours(dbTime.getHours() + 7);
        return dbTime.toISOString().slice(0, 16) === newDueTime;
      });
      if (trung) {
        showToast(`Trùng giờ với ghi chú "${trung.title || "không tên"}"!`);
        return;
      }
    }
    try {
      await noteService.createNote({
        title: newTitle,
        content: newContent,
        due_time: newDueTime || null,
        color: newColor !== "#ffffff" ? newColor : null,
      });
      setNewTitle("");
      setNewContent("");
      setNewDueTime("");
      setNewColor("#ffffff");
      setComposerOpen(false);
      showToast("Đã lưu ghi chú");
      loadNotes();
    } catch {
      showToast("Lỗi khi lưu ghi chú");
    }
  };

  const togglePin = async (id) => {
    try {
      await noteService.togglePin(id);
      loadNotes();
    } catch {}
  };

  const doChangeStatus = async (id, status) => {
    try {
      await noteService.changeStatus(id, status);
      const msg =
        status === "Archived"
          ? "Đã lưu trữ"
          : status === "Deleted"
            ? "Đã chuyển vào thùng rác"
            : status === "Active"
              ? "Đã khôi phục ghi chú"
              : "";
      if (msg) showToast(msg);
      loadNotes();
    } catch {}
  };

  const changeStatus = async (id, status) => {
    const note = notes.find((n) => n.note_id === id);
    const isArchiveAction = status === "Archived";
    const isUnarchiveAction = status === "Active" && note?.status === "Archived";

    // ⚡ Lưu trữ / hủy lưu trữ làm ghi chú ẩn/hiện lại ở trang chính
    // -> hỏi xác nhận trước khi thực hiện.
    if (isArchiveAction || isUnarchiveAction) {
      setConfirmDialog({
        title: isArchiveAction ? "Lưu trữ ghi chú" : "Hủy lưu trữ",
        message: isArchiveAction
          ? "Sau khi lưu trữ, ghi chú này sẽ không còn hiển thị ở trang chính nữa (trừ khi được ghim). Bạn có chắc muốn lưu trữ?"
          : "Ghi chú sẽ hiển thị lại ở trang chính sau khi hủy lưu trữ. Bạn có chắc muốn tiếp tục?",
        onConfirm: () => {
          setConfirmDialog(null);
          doChangeStatus(id, status);
        },
      });
      return;
    }

    doChangeStatus(id, status);
  };

  const toggleLabelOnNote = async (note_id, label_id, currentLabels) => {
    const isAttached = currentLabels.some((l) => l.label_id === label_id);
    if (isAttached) {
      // ⚡ Xóa nhãn khỏi ghi chú là hành động có thể gây mất dữ liệu phân loại
      // -> luôn hỏi xác nhận trước khi thực hiện.
      const label = currentLabels.find((l) => l.label_id === label_id);
      setConfirmDialog({
        title: "Xóa nhãn",
        message: `Bạn có chắc muốn xóa nhãn "${label?.label_name || ""}" khỏi ghi chú này?`,
        onConfirm: async () => {
          setConfirmDialog(null);
          await labelService.detachLabel(note_id, label_id);
          // Cập nhật lại danh sách nhãn đang hiển thị trong modal gán nhãn (nếu còn mở)
          setLabelPickerNoteLabels((prev) =>
            prev.filter((l) => l.label_id !== label_id),
          );
          loadNotes();
        },
      });
      return;
    }
    await labelService.attachLabel(note_id, label_id);
    loadNotes();
  };

  const addLabel = async (labelName) => {
    if (!labelName) return;
    await labelService.createLabel({ label_name: labelName });
    loadLabels();
  };

  const deleteLabel = async (id) => {
    await labelService.deleteLabel(id);
    loadLabels();
  };

  // ⚡ Đóng modal xem/chỉnh sửa ghi chú: lưu thay đổi (nếu có) và/hoặc đổi trạng thái
  const handleCloseViewingNote = async (payload, statusChange) => {
    const id = viewingNote?.note_id;
    setViewingNote(null);
    if (!id) return;
    try {
      if (payload) {
        await noteService.updateNote(id, payload);
      }
      if (statusChange) {
        await noteService.changeStatus(id, statusChange);
        const msg =
          statusChange === "Archived"
            ? "Đã lưu trữ"
            : statusChange === "Deleted"
              ? "Đã chuyển vào thùng rác"
              : statusChange === "Active"
                ? "Đã khôi phục ghi chú"
                : statusChange === "PermanentlyDeleted"
                  ? "Đã xóa vĩnh viễn"
                  : "";
        if (msg) showToast(msg);
      } else if (payload) {
        showToast("Đã lưu thay đổi");
      }
      loadNotes();
    } catch {
      showToast("Lỗi khi lưu ghi chú");
    }
  };

  const pinnedNotes = notes.filter((n) => n.is_pinned);
  // ⚡ Ở trang chính (view "notes"), loadNotes() đang gộp cả ghi chú Active VÀ
  // Archived lại với nhau. Sau khi một ghi chú được LƯU TRỮ, nó không nên còn
  // hiện ở trang chính nữa (đã có mục "Lưu trữ" riêng để xem) — trừ khi ghi chú
  // đó đang được ghim, thì vẫn luôn hiển thị ở trang chính như cũ. Nhãn (label)
  // không liên quan tới việc ẩn/hiện này.
  const otherNotes = notes.filter((n) => {
    if (n.is_pinned) return false;
    if (view === "notes" && n.status === "Archived") return false;
    return true;
  });

  // ⚡ Kiểm tra user có role Admin không (để hiện nút Admin)
  const isAdmin =
    isLogin?.roles?.includes("Admin") || isLogin?.role === "Admin";

  // ============================================================
  // ⚡ RENDER: Nếu đang ở trang Admin thì render AdminDashboardPage
  // ============================================================
  if (page === "admin") {
    return (
      <AdminDashboardPage
        authToken={localStorage.getItem("token")}
        authUser={isLogin}
        onBack={() => setPage("home")}
        onLogout={isLogOut}
      />
    );
  }

  // ============================================================
  // RENDER: HomePage bình thường
  // ============================================================
  return (
    <div className="app">
      <TopBar
        keyword={keyword}
        onSearch={handleSearch}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onRefresh={() => loadNotes()}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isOpen={isOpen}
        toggleMenu={toggleMenu}
        isLogin={isLogin}
        isLogOut={isLogOut}
        pendingShares={pendingShares}
        onAcceptShare={handleAcceptShare}
        onRejectShare={handleRejectShare}
        mySharedNotes={mySharedNotes}
        onRevokeShare={handleRevokeShare}
        onOpenChangePassword={() => setChangePasswordOpen(true)}
        onOpenNotifications={handleOpenNotifications}
        // ⚡ Truyền nút Admin vào TopBar (tuỳ TopBar có hỗ trợ slot hay không)
        adminButton={
          isAdmin ? (
            <button
              className="icon-btn admin-btn"
              title="Trang quản trị Admin"
              onClick={() => setPage("admin")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                background: "#1a73e8",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              🛡 Admin
            </button>
          ) : null
        }
      />

      {/* ⚡ NÚT ADMIN nổi ở góc phải nếu TopBar không hỗ trợ prop adminButton */}
      {isAdmin && (
        <button
          onClick={() => setPage("admin")}
          title="Mở trang quản trị"
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 24,
            background: "#1a73e8",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 14,
            boxShadow: "0 4px 16px rgba(26,115,232,0.35)",
          }}
        >
          🛡 Quản trị Admin
        </button>
      )}

      <div className="main">
        {sidebarOpen && (
          <SideBar
            labels={labels}
            view={view}
            setView={(v) => {
              setView(v);
              if (v !== "notes") {
                setSelectedLabel(null);
                setSelectedLabelName("");
              }
            }}
            selectedLabel={selectedLabel}
            onSelectLabel={(id, name) => {
              setSelectedLabel(id);
              setSelectedLabelName(name || "");
              setView("notes");
            }}
            onAddLabel={addLabel}
            onDeleteLabel={deleteLabel}
          />
        )}

        <div className="content">
          <NoteComposer
            view={view}
            composerOpen={composerOpen}
            setComposerOpen={setComposerOpen}
            newTitle={newTitle}
            setNewTitle={setNewTitle}
            newContent={newContent}
            setNewContent={setNewContent}
            newDueTime={newDueTime}
            setNewDueTime={setNewDueTime}
            newColor={newColor}
            setNewColor={setNewColor}
            datePickerOpen={datePickerOpen}
            setDatePickerOpen={setDatePickerOpen}
            createNote={createNote}
          />
          {acceptedSharedNotes.length > 0 && (
            <>
              <div className="shared-section-label">
                👥 Được chia sẻ với tôi
              </div>
              <div className="notes-grid">
                {acceptedSharedNotes.map((n) => (
                  <div
                    key={n.note_id}
                    className="note-card shared-card"
                    onClick={() => setViewingNote(n)}
                  >
                    <div className="shared-badge">
                      👥{" "}
                      {n.permission === "view"
                        ? "Chỉ xem"
                        : n.permission === "edit"
                          ? "Chỉnh sửa"
                          : "Toàn quyền"}
                    </div>
                    {n.title && (
                      <div
                        className="note-title"
                        dangerouslySetInnerHTML={{ __html: n.title }}
                      />
                    )}
                    <div
                      className="note-content"
                      dangerouslySetInnerHTML={{ __html: n.content }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {view === "labels" ? (
            <div className="label-manager">
              <div className="label-manager-header">
                <h3>Chỉnh sửa nhãn</h3>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <input
                    id="newLabelInput"
                    className="modal-input"
                    placeholder="Tên nhãn mới..."
                  />
                  <button
                    className="btn-share"
                    onClick={async () => {
                      const val =
                        document.getElementById("newLabelInput").value;
                      if (!val) return;
                      await addLabel(val);
                    }}
                  >
                    Thêm
                  </button>
                </div>
              </div>
              {labels.map((l) => (
                <div key={l.label_id} className="label-edit-row">
                  <span style={{ marginRight: 8 }}>🏷</span>
                  <span style={{ flex: 1 }}>{l.label_name}</span>
                  <button
                    className="card-btn"
                    onClick={() => deleteLabel(l.label_id)}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          ) : loading ? (
            <div className="empty-state">
              <p>Đang tải...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="empty-state">
              <p>
                {view === "archive"
                  ? "Không có ghi chú được lưu trữ"
                  : view === "trash"
                    ? "Thùng rác trống"
                    : "Bản ghi chú mà bạn thêm sẽ xuất hiện tại đây"}
              </p>
            </div>
          ) : (
            <>
              {pinnedNotes.length > 0 && (
                <>
                  <div className="section-label">Được ghim</div>
                  <div className="notes-grid">
                    {(view === "reminders"
                      ? pinnedNotes.filter((n) => n.due_time)
                      : pinnedNotes
                    ).map((n) => (
                      <NoteCard
                        key={n.note_id}
                        note={n}
                        onPin={(id) => togglePin(id)}
                        onStatus={(id, s) => changeStatus(id, s)}
                        onReminder={(id) => {
                          setReminderNoteId(id);
                          setReminderOpen(true);
                        }}
                        onShare={(id) => {
                          setShareNoteId(id);
                          setShareOpen(true);
                        }}
                        onLabel={(id, noteLabels) => {
                          setLabelPickerNoteId(id);
                          setLabelPickerNoteLabels(noteLabels);
                          setLabelPickerOpen(true);
                        }}
                        onViewDetails={(note) => setViewingNote(note)}
                      />
                    ))}
                  </div>
                  {otherNotes.length > 0 && (
                    <div className="section-label" style={{ marginTop: 16 }}>
                      Khác
                    </div>
                  )}
                </>
              )}
              <div className="notes-grid">
                {(view === "reminders"
                  ? otherNotes.filter((n) => n.due_time)
                  : otherNotes
                ).map((n) => (
                  <NoteCard
                    key={n.note_id}
                    note={n}
                    onPin={(id) => togglePin(id)}
                    onStatus={(id, s) => changeStatus(id, s)}
                    onReminder={(id) => {
                      setReminderNoteId(id);
                      setReminderOpen(true);
                    }}
                    onShare={(id) => {
                      setShareNoteId(id);
                      setShareOpen(true);
                    }}
                    onLabel={(id, noteLabels) => {
                      setLabelPickerNoteId(id);
                      setLabelPickerNoteLabels(noteLabels);
                      setLabelPickerOpen(true);
                    }}
                    onViewDetails={(note) => setViewingNote(note)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {labelPickerOpen && (
        <LabelPickerModal
          labels={labels}
          noteLabels={labelPickerNoteLabels}
          onClose={() => setLabelPickerOpen(false)}
          onToggle={(labelId) =>
            toggleLabelOnNote(labelPickerNoteId, labelId, labelPickerNoteLabels)
          }
        />
      )}

      {toast && <Toast message={toast} />}

      {confirmDialog && (
        <ConfirmModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {changePasswordOpen && (
        <ChangePasswordModal onClose={() => setChangePasswordOpen(false)} />
      )}

      {reminderOpen && (
        <ReminderModal
          reminderTime={reminderTime}
          setReminderTime={setReminderTime}
          onClose={() => setReminderOpen(false)}
          onSave={handleSetReminder}
        />
      )}

      {shareOpen && (
        <ShareModal
          noteId={shareNoteId}
          email={shareEmail}
          setEmail={setShareEmail}
          permission={sharePermission}
          setPermission={setSharePermission}
          onClose={() => setShareOpen(false)}
          onSave={handleShare}
        />
      )}

      {viewingNote && (
        <NoteEditModal
          key={viewingNote.note_id}
          note={viewingNote}
          onClose={handleCloseViewingNote}
          onPin={(id) => {
            togglePin(id);
            setViewingNote((prev) =>
              prev ? { ...prev, is_pinned: !prev.is_pinned } : prev,
            );
          }}
          onReminder={(id) => {
            setReminderNoteId(id);
            setReminderOpen(true);
          }}
          onShare={(id) => {
            setShareNoteId(id);
            setShareOpen(true);
          }}
          onLabel={(id, noteLabels) => {
            setLabelPickerNoteId(id);
            setLabelPickerNoteLabels(noteLabels);
            setLabelPickerOpen(true);
          }}
        />
      )}
    </div>
  );
}
