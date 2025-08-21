# Progress Project - Backend Customer Care

## Update Terbaru

### 📅 [21/08/2025] - Smart Policy Resolution untuk Multiple Policies

#### 🔧 **Perubahan pada `mock/controllers/ticket_controller.js`**

**Lokasi Method yang Diubah:**
- `resolvePolicy()` - line ~101-115 (enhanced policy resolution)
- `selectBestPolicy()` - line ~117-140 (new method untuk smart selection)

**Deskripsi Perubahan:**
Menambahkan smart business logic untuk menangani kasus dimana ada multiple policies dengan kombinasi channel_id + complaint_id yang sama.

**Sebelum:**
```javascript
resolvePolicy(complaintId, channelId) {
    const policy = this.db.get('complaint_policy')
        .find(p => p.complaint_id === complaintId && p.channel_id === channelId)
        .value();
    
    if (policy) return policy;
    
    return this.db.get('complaint_policy')
        .find({ complaint_id: complaintId })
        .value();
}
```

**Sesudah:**
```javascript
resolvePolicy(complaintId, channelId) {
    const policies = this.db.get('complaint_policy')
        .filter(p => p.complaint_id === complaintId && p.channel_id === channelId)
        .value();
    
    if (policies.length === 0) {
        return this.db.get('complaint_policy')
            .find({ complaint_id: complaintId })
            .value();
    }
    
    if (policies.length === 1) {
        return policies[0];
    }
    
    return this.selectBestPolicy(policies, complaintId, channelId);
}

selectBestPolicy(policies, complaintId, channelId) {
    // Rule 1: SLA Priority (shortest = most critical)
    const shortestSLA = Math.min(...policies.map(p => p.sla));
    let candidates = policies.filter(p => p.sla === shortestSLA);
    
    if (candidates.length === 1) return candidates[0];
    
    // Rule 2: Specificity (BNI, Bank Lain, etc)
    const specificKeywords = ['BNI', 'Bank Lain', 'ATM BNI', 'ATM Bank Lain'];
    const specificPolicy = candidates.find(p => 
        specificKeywords.some(keyword => p.description.includes(keyword))
    );
    
    if (specificPolicy) return specificPolicy;
    
    // Rule 3: UIC Hierarchy (lower = more specialized)
    candidates.sort((a, b) => a.uic_id - b.uic_id);
    
    // Rule 4: Monitoring
    console.warn(`Multiple policies found for channel ${channelId} + complaint ${complaintId}. Selected policy ${candidates[0].policy_id}`);
    
    return candidates[0];
}
```

#### 🎯 **Impact:**
- **Endpoint Affected:** 
  - `POST /api/tickets` (createTicket untuk customer dan employee)
- **Breaking Change:** No (backward compatible)
- **Data Consistency:** Yes (selalu return policy yang sama untuk input yang sama)

#### 📝 **Business Rules yang Diterapkan:**
1. **SLA Priority**: Pilih policy dengan SLA terpendek (paling urgent)
2. **Specificity**: Prioritaskan deskripsi yang lebih spesifik (mengandung 'BNI', 'Bank Lain', dll)
3. **UIC Hierarchy**: Pilih UIC dengan ID lebih kecil (lebih specialized)
4. **Monitoring**: Log warning untuk tracking multiple policies

#### 🔍 **Contoh Kasus:**
```javascript
// Channel 1 (ATM) + Complaint 23 (CCTV ATM)
// Policy 81: UIC 8, SLA 10, "CCTV ATM Bank Lain"  
// Policy 82: UIC 6, SLA 10, "CCTV ATM BNI"
// Result: Policy 82 (lebih spesifik "ATM BNI")
```

#### ✅ **Action Items untuk Tim:**
- [ ] Monitor console logs untuk multiple policy cases
- [ ] Update unit test untuk policy resolution
- [ ] Dokumentasi business rules untuk tim QA
- [ ] Review hasil policy selection di production

---

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

*Last updated: 22/08/2025*