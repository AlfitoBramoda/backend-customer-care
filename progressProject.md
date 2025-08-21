# Progress Project - Backend Customer Care

## Update Terbaru

### 📅 [21/08/2025] - Enhancement Policy Response untuk Employee

#### 🔧 **Perubahan pada `mock/controllers/ticket_controller.js`**

**Lokasi Method yang Diubah:**
- `enrichTicketData()` - line ~250-280 (bagian policy untuk employee role)
- `getDetailedTicketData()` - line ~450-480 (bagian policy untuk employee role)

**Deskripsi Perubahan:**
Menambahkan informasi UIC code, name, dan division details pada response policy untuk employee role.

**Sebelum:**
```javascript
policy: policy ? {
    policy_id: policy.policy_id,
    sla_days: policy.sla,
    sla_hours: policy.sla * 24,
    uic_id: policy.uic_id
} : null
```

**Sesudah:**
```javascript
policy: policy ? (() => {
    const policyData = {
        policy_id: policy.policy_id,
        sla_days: policy.sla,
        sla_hours: policy.sla * 24,
        uic_id: policy.uic_id
    };
    
    if (policy.uic_id) {
        const division = this.db.get('division')
            .find({ division_id: policy.uic_id })
            .value();
        
        if (division) {
            policyData.uic_code = division.division_code;
            policyData.uic_name = division.division_name;
        }
    }
    
    return policyData;
})() : null
```

**Response Baru:**
```json
{
    "policy": {
        "policy_id": 1,
        "sla_days": 1,
        "sla_hours": 24,
        "uic_id": 9,
        "uic_code": "UIC8",
        "uic_name": "DGO USER 1",
        "division_code": "UIC8",
        "division_name": "DGO USER 1"
    }
}
```

#### 🎯 **Impact:**
- **Endpoint Affected:** 
  - `GET /api/tickets` (getAllTickets untuk employee)
  - `GET /api/tickets/:id` (getTicketById untuk employee)
- **Role Affected:** Employee only (customer role tidak terpengaruh)
- **Breaking Change:** No (hanya menambah field baru)

#### 📝 **Notes untuk Tim BE:**
1. **Database Structure:** `uic_id` di tabel `complaint_policy` merujuk langsung ke `division_id` di tabel `division`
2. **Konsistensi:** Pastikan implementasi yang sama diterapkan di file controller lain jika ada
3. **Testing:** Test khusus untuk employee role response pada endpoint tickets

#### ✅ **Action Items untuk Tim:**
- [ ] Update dokumentasi API untuk response baru
- [ ] Update unit test untuk policy response
- [ ] Sync dengan tim FE untuk handling field baru
- [ ] Review implementasi serupa di controller lain

---

## Template untuk Update Selanjutnya

### 📅 [Tanggal] - [Judul Update]

#### 🔧 **Perubahan pada `[file_path]`**
- **Method:** `[method_name]`
- **Line:** ~[line_number]
- **Deskripsi:** [deskripsi singkat]

#### 🎯 **Impact:**
- **Endpoint:** [endpoint yang terpengaruh]
- **Breaking Change:** [Yes/No]

#### 📝 **Notes:**
[catatan penting untuk tim]

---

*Last updated: [Tanggal]*