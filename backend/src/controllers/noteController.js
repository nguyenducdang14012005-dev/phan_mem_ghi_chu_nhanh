import sql from "../config/db.js";

export const searchAndFilterNotes = async (req, res) => {
  try {
    // Cho phép override user_id từ query param (hữu ích khi frontend gửi user_id trong dev)
    const { keyword, label_id, status } = req.query;
    const user_id = req.query.user_id
      ? parseInt(req.query.user_id, 10)
      : (req.user?.user_id ?? req.user?.id);

    let queryStr = `
            SELECT DISTINCT n.note_id, n.user_id, n.title, n.content,
       n.color, n.is_pinned, n.status, n.created_at,
       n.updated_at, n.deleted_at, n.due_time
            FROM Notes n
            LEFT JOIN Note_Labels nl ON n.note_id = nl.note_id
            WHERE n.user_id = @user_id
            AND n.status = @status
        `;

    const pool = await sql.connect();
    const request = pool.request();
    request.input("user_id", sql.Int, user_id);
    request.input("status", sql.NVarChar, status || "Active");

    if (keyword) {
      queryStr += ` AND (n.title LIKE @keyword OR n.content LIKE @keyword)`;
      request.input("keyword", sql.NVarChar, `%${keyword}%`);
    }

    if (label_id) {
      queryStr += ` AND nl.label_id = @label_id`;
      request.input("label_id", sql.Int, label_id);
    }

    queryStr += ` ORDER BY n.is_pinned DESC, n.updated_at DESC`;

    const result = await request.query(queryStr);
    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const togglePinNote = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id ?? req.user.id;

    const pool = await sql.connect();
    const note = await pool
      .request()
      .input("id", sql.Int, id)
      .input("user_id", sql.Int, user_id)
      .query(
        "SELECT is_pinned FROM Notes WHERE note_id = @id AND user_id = @user_id",
      );

    if (note.recordset.length === 0)
      return res.status(404).json({ message: "Khong tim thay ghi chu" });

    const newPin = note.recordset[0].is_pinned ? 0 : 1;

    await pool
      .request()
      .input("newPin", sql.Bit, newPin)
      .input("id", sql.Int, id)
      .query(
        "UPDATE Notes SET is_pinned = @newPin, updated_at = GETDATE() WHERE note_id = @id",
      );

    res
      .status(200)
      .json({ message: "Doi trang thai ghim thanh cong", is_pinned: newPin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const changeNoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user_id = req.user.user_id ?? req.user.id;

    const pool = await sql.connect();

    // ⚡ "Xóa vĩnh viễn": xóa thật khỏi DB (chỉ dùng trong Thùng rác)
    // ⚠️  QUAN TRỌNG: Danh sách bảng phụ bên dưới được suy ra từ grep qua các controller
    // khác (reminderController, shareController). Nếu schema thực tế có thêm bảng tham chiếu
    // note_id (VD: AuditLogs, Attachments...) mà có FK constraint thì cần bổ sung DELETE ở đây.
    // Cách kiểm tra: SELECT fk.name, tp.name AS parent_table
    //   FROM sys.foreign_keys fk
    //   JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
    //   JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
    //   WHERE tr.name = 'Notes';
    if (status === "PermanentlyDeleted") {
      const request = pool
        .request()
        .input("id", sql.Int, id)
        .input("user_id", sql.Int, user_id);

      // Xóa các bảng phụ thuộc trước để tránh lỗi khóa ngoại
      await request.query(`
        DELETE FROM Note_Labels WHERE note_id = @id;
        DELETE FROM Reminders WHERE note_id = @id;
        DELETE FROM Note_Shares WHERE note_id = @id;
        DELETE FROM Note_Versions WHERE note_id = @id;
        DELETE FROM Notes WHERE note_id = @id AND user_id = @user_id;
      `);

      return res.status(200).json({ message: "Da xoa vinh vien ghi chu" });
    }

    if (status === "Deleted") {
      await pool
        .request()
        .input("status", sql.NVarChar, status)
        .input("id", sql.Int, id)
        .input("user_id", sql.Int, user_id)
        .query(
          "UPDATE Notes SET status = @status, deleted_at = GETDATE() WHERE note_id = @id AND user_id = @user_id",
        );
    } else {
      await pool
        .request()
        .input("status", sql.NVarChar, status)
        .input("id", sql.Int, id)
        .input("user_id", sql.Int, user_id)
        .query(
          "UPDATE Notes SET status = @status, deleted_at = NULL WHERE note_id = @id AND user_id = @user_id",
        );
    }

    res.status(200).json({ message: `Da chuyen trang thai sang ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ⚡ Cập nhật nội dung ghi chú (tiêu đề, nội dung, màu, hạn chót)
// Cho phép người dùng bấm vào ghi chú ở trang chủ và chỉnh sửa tiếp.
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, color, due_time } = req.body;
    const user_id = req.user.user_id ?? req.user.id;

    const pool = await sql.connect();

    // ── Kiểm tra 1: user là owner? ──────────────────────────────
    const ownerCheck = await pool
      .request()
      .input("id", sql.Int, id)
      .input("user_id", sql.Int, user_id)
      .query(
        "SELECT note_id FROM Notes WHERE note_id = @id AND user_id = @user_id",
      );

    // ── Kiểm tra 2: nếu không phải owner, có quyền 'edit' hoặc 'delete' không? ──
    if (ownerCheck.recordset.length === 0) {
      const shareCheck = await pool
        .request()
        .input("note_id", sql.Int, id)
        .input("user_id", sql.Int, user_id).query(`
          SELECT permission FROM Note_Shares
          WHERE note_id  = @note_id
            AND user_id  = @user_id
            AND permission IN ('edit', 'delete')
            AND share_status = 'Accepted'
        `);

      if (shareCheck.recordset.length === 0) {
        return res.status(403).json({
          message: "Bạn không có quyền chỉnh sửa ghi chú này",
        });
      }
    }

    const dueTimeValue = due_time ? new Date(due_time) : null;

    // Lưu phiên bản cũ vào Note_Versions trước khi update
    const current = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT title, content FROM Notes WHERE note_id = @id");

    if (current.recordset.length > 0) {
      const old = current.recordset[0];
      await pool
        .request()
        .input("note_id", sql.Int, id)
        .input("title", sql.NVarChar, old.title ?? "")
        .input("content", sql.NVarChar, old.content ?? "")
        .input("edited_by", sql.Int, user_id).query(`
          INSERT INTO Note_Versions (note_id, title, content, edited_by, updated_at)
          VALUES (@note_id, @title, @content, @edited_by, GETDATE())
        `);
    }

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("title", sql.NVarChar, title ?? "")
      .input("content", sql.NVarChar, content ?? "")
      .input("color", sql.NVarChar, color ?? null)
      .input("due_time", sql.DateTime, dueTimeValue).query(`
        UPDATE Notes
        SET title      = @title,
            content    = @content,
            color      = @color,
            due_time   = @due_time,
            updated_at = GETDATE()
        WHERE note_id  = @id
      `);

    res.status(200).json({ message: "Cập nhật ghi chú thành công" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const shareNoteMock = async (req, res) => {
  try {
    const { note_id, email, permission } = req.body;
    const pool = await sql.connect();
    const userCheck = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query("SELECT user_id FROM Users WHERE email = @email");

    if (userCheck.recordset.length === 0) {
      return res
        .status(404)
        .json({ message: "Khong tim thay email nay tren he thong" });
    }
    res.status(200).json({
      message: `Da chia se quyen ${permission} cho ${email} thanh cong!`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createNoteVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const user_id = req.user.user_id ?? req.user.id; // ← lấy từ middleware

    if (!title || !content) {
      return res.status(400).json({ message: "Thieu title hoac content" });
    }

    await sql.query`
            INSERT INTO Note_Versions (note_id, title, content, edited_by, updated_at)
            VALUES (${id}, ${title}, ${content}, ${user_id}, GETDATE())
        `;

    res.status(201).json({ message: "Da luu phien ban thanh cong" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const getNoteVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id ?? req.user.id;

    const pool = await sql.connect();

    // Kiểm tra: user là owner HOẶC có share Accepted?
    const ownerCheck = await pool
      .request()
      .input("note_id", sql.Int, id)
      .input("user_id", sql.Int, user_id).query(`
        SELECT 1 AS has_access FROM Notes
        WHERE note_id = @note_id AND user_id = @user_id
        UNION
        SELECT 1 FROM Note_Shares
        WHERE note_id = @note_id AND user_id = @user_id AND share_status = 'Accepted'
      `);

    if (ownerCheck.recordset.length === 0) {
      return res
        .status(403)
        .json({ message: "Không có quyền xem lịch sử ghi chú này" });
    }

    // Lấy versions kèm email người chỉnh sửa
    const result = await pool.request().input("note_id", sql.Int, id).query(`
        SELECT
          nv.version_id,
          nv.note_id,
          nv.title,
          nv.content,
          nv.edited_by,
          nv.updated_at,
          u.email    AS editor_email,
          u.full_name AS editor_name
        FROM Note_Versions nv
        LEFT JOIN Users u ON u.user_id = nv.edited_by
        WHERE nv.note_id = @note_id
        ORDER BY nv.updated_at DESC
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteNoteVersion = async (req, res) => {
  try {
    const { id, version_id } = req.params;
    const pool = await sql.connect();
    const result = await pool
      .request()
      .input("version_id", sql.Int, version_id)
      .query("DELETE FROM Note_Versions WHERE version_id = @version_id");
    res.status(200).json({ message: "Da xoa phien ban thanh cong " });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const cleanupTrash = async (req, res) => {
  try {
    const pool = await sql.connect();
    // Xóa các bảng phụ trước để tránh lỗi FK, sau đó mới xóa Notes
    await pool.request().query(`
      DELETE nl FROM Note_Labels nl
        INNER JOIN Notes n ON nl.note_id = n.note_id
        WHERE n.status = 'Deleted' AND n.deleted_at < DATEADD(DAY, -30, GETDATE());
      DELETE r FROM Reminders r
        INNER JOIN Notes n ON r.note_id = n.note_id
        WHERE n.status = 'Deleted' AND n.deleted_at < DATEADD(DAY, -30, GETDATE());
      DELETE ns FROM Note_Shares ns
        INNER JOIN Notes n ON ns.note_id = n.note_id
        WHERE n.status = 'Deleted' AND n.deleted_at < DATEADD(DAY, -30, GETDATE());
      DELETE nv FROM Note_Versions nv
        INNER JOIN Notes n ON nv.note_id = n.note_id
        WHERE n.status = 'Deleted' AND n.deleted_at < DATEADD(DAY, -30, GETDATE());
    `);
    const result = await pool
      .request()
      .query(
        `DELETE FROM Notes WHERE status = 'Deleted' AND deleted_at < DATEADD(DAY, -30, GETDATE())`,
      );
    return res.status(200).json({
      message: "Da xoa ghi chu tren 30 ngay roi a",
      deleted: result.rowsAffected[0],
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
export const createNote = async (req, res) => {
  try {
    const { title, content, due_time, color } = req.body;
    console.log("due_time nhận được:", due_time);
    const user_id = req.user.user_id ?? req.user.id;
    const dueTimeValue = due_time ? new Date(due_time) : null;

    await sql.query`
            INSERT INTO Notes (user_id, title, content, color, due_time, status, created_at, updated_at)
            VALUES (${user_id}, ${title}, ${content}, ${color || null}, ${dueTimeValue}, 'Active', GETDATE(), GETDATE())
        `;

    res.status(201).json({ message: "Tao ghi chu thanh cong" });
  } catch (error) {
    console.log("LỖI CHI TIẾT:", error.message);
    res.status(500).json({ error: error.message });
  }
};
export const getNoteLabels = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await sql.connect();
    const result = await pool.request().input("note_id", sql.Int, id)
      .query(`SELECT l.label_id, l.label_name 
                    FROM Labels l
                    INNER JOIN Note_Labels nl ON l.label_id = nl.label_id
                    WHERE nl.note_id = @note_id`);
    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
