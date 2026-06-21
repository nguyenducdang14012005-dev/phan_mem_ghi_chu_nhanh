import { useState, useEffect, useRef } from "react";
import "./HomePage.css";

import TopBar from "../components/TopBar";
import SideBar from "../components/SideBar";
import NoteCard from "../components/NoteCard";
import NoteComposer from "../components/NoteComposer";
import ReminderModal from "../components/ReminderModal";
import ShareModal from "../components/ShareModal";
import LabelPickerModal from "../components/LabelPickerModal";
import Toast from "../components/Toast";

import noteService from "../services/noteService";
import labelService from "../services/labelService";
import reminderService from "../services/reminderService";
import shareService from "../services/shareService";

export default function HomePage({ isLogin, setIsLogin }) {
  useEffect(() => {
    Notification.requestPermission();
  }, []);
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  const isLogOut = () => {
    setIsLogin(null);
  };
  const [notes, setNotes] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("notes");
  const [keyword, setKeyword] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newDueTime, setNewDueTime] = useState("");
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderNoteId, setReminderNoteId] = useState(null);
  const [reminderTime, setReminderTime] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareNoteId, setShareNoteId] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState("View");
  const searchTimer = useRef(null);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedLabelName, setSelectedLabelName] = useState("");
  const [labelPickerOpen, setLabelPickerOpen] = useState(false);
  const [labelPickerNoteId, setLabelPickerNoteId] = useState(null);
  const [labelPickerNoteLabels, setLabelPickerNoteLabels] = useState([]);

  // ⚡ STATE MỚI: Dùng để lưu ghi chú đang được chọn xem chi tiết
  const [viewingNote, setViewingNote] = useState(null);

  useEffect(() => {
    loadNotes();
    loadLabels();
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [view, selectedLabel, sortBy, isLogin]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 30000);
  };

  const loadNotes = async (kw = keyword, sort = sortBy) => {
    setLoading(true);
    try {
      // Require logged-in user to load notes
      if (!isLogin || !isLogin.userId) {
        setNotes([]);
        setLoading(false);
        return;
      }
      // ⚡ NÂNG CẤP: Xử lý hiển thị cả ghi chú Archived ngay tại màn hình chính
      let data = [];
      if (view === "notes") {
        // Tải cả Active lẫn Archived về để trộn chung hiển thị ở trang chính
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
        // Các phân vùng khác (reminders, archive, trash) hoạt động độc lập như cũ
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

  const checkReminders = async () => {
    try {
      const data = await reminderService.getReminders();
      const now = new Date();
      data.forEach((r) => {
        const remindTime = new Date(r.remind_time);
        const diff = remindTime - now;
        remindTime.setHours(remindTime.getHours() + 7);
        if (diff > 0 && diff <= 10000) {
          showToast(" Đã đến giờ nhắc nhở!");
        }
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
      if (trung) return showToast(" Đã có nhắc nhở vào giờ này rồi!");
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
      showToast("Đã chia sẻ ghi chú!");
      setShareOpen(false);
      setShareEmail("");
    } catch {
      showToast("Lỗi khi chia sẻ");
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
        due_time: newDueTime ? newDueTime : null,
      });
      setNewTitle("");
      setNewContent("");
      setNewDueTime("");
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

  const changeStatus = async (id, status) => {
    try {
      await noteService.changeStatus(id, status);

      let msg = "";
      if (status === "Archived") msg = "Đã lưu trữ";
      else if (status === "Deleted") msg = "Đã chuyển vào thùng rác";
      else if (status === "Active") msg = "Đã khôi phục ghi chú";

      if (msg) showToast(msg);
      loadNotes();
    } catch {}
  };

  const toggleLabelOnNote = async (note_id, label_id, currentLabels) => {
    const isAttached = currentLabels.some((l) => l.label_id === label_id);
    if (isAttached) {
      await labelService.detachLabel(note_id, label_id);
    } else {
      await labelService.attachLabel(note_id, label_id);
    }
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

  const pinnedNotes = notes.filter((n) => n.is_pinned);
  const otherNotes = notes.filter((n) => !n.is_pinned);

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
      />

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
            datePickerOpen={datePickerOpen}
            setDatePickerOpen={setDatePickerOpen}
            createNote={createNote}
          />

          {/* Notes */}
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
                        onViewDetails={(note) => setViewingNote(note)} // ⚡ TRUYỀN CALLBACK XEM CHI TIẾT
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
                    onViewDetails={(note) => setViewingNote(note)} // ⚡ TRUYỀN CALLBACK XEM CHI TIẾT
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
          email={shareEmail}
          setEmail={setShareEmail}
          permission={sharePermission}
          setPermission={setSharePermission}
          onClose={() => setShareOpen(false)}
          onSave={handleShare}
        />
      )}

      {/* ⚡ POPUP MODAL: Xem lại chi tiết nội dung ghi chú (Đọc mã HTML Word) */}
      {viewingNote && (
        <div className="modal-overlay" onClick={() => setViewingNote(null)}>
          <div
            className="modal-box"
            style={{ width: "550px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              {viewingNote.title ? (
                <span
                  dangerouslySetInnerHTML={{ __html: viewingNote.title }}
                  style={{ fontSize: "16px", fontWeight: "600" }}
                />
              ) : (
                <span>Chi tiết ghi chú</span>
              )}
              <button className="icon-btn" onClick={() => setViewingNote(null)}>
                ❌
              </button>
            </div>
            <div
              className="modal-body"
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                padding: "10px 0",
              }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: viewingNote.content }}
                style={{ fontSize: "14px", lineHeight: "1.6" }}
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn-share"
                onClick={() => setViewingNote(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
