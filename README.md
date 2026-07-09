# Bank Reconciliation Engine / საბანკო ტრანზაქციების დადარება

**🇬🇪** კომპანიას ჰყავს კლიენტები ყოველთვიურ კონტრაქტებზე. შემოსული საბანკო ტრანზაქციები უნდა დადარდეს ამ კონტრაქტებთან, რათა ფინანსურმა დეპარტამენტმა მარტივად გააკონტროლოს ვინ გადაიხადა, ვის დაავიწყდა და ვინ გადმორიცხა არასწორი თანხა.
**🇬🇧** A company has clients on monthly contracts. Incoming bank transactions must be matched against these contracts so the finance department can identify settled, pending, and incorrect payments.

🔗 **[Live Demo / ცოცხალი ვერსია](https://reconciliation-dashboard-green.vercel.app/)**

🇬🇪 [ქართული ვერსია](#ქართული-ვერსია) | 🇬🇧 [English Version](#english-version)

---

### Design Philosophy: Scale vs. MVP / დიზაინის ფილოსოფია
If this system were guaranteed to only ever handle the 89 rows provided in the seed data, fetching all records once and filtering them in-memory (the approach in the `main` branch) is the most efficient and responsive architecture. However, real banking environments handle tens of thousands of records. At that scale, downloading and processing the full dataset in the browser eventually becomes CPU- and memory-bound.

Because of this reality, this project is split into two architectures:

* **`main`**: The MVP. Handles filtering and dataset calculations in-memory on the client side.
* **`v2-server-aggregation`**: The scalable alternative. Moves pagination (`.range()`) and summary statistics to native PostgreSQL RPCs, ensuring the browser UI remains responsive regardless of database size. *(Live Demo: [https://reconciliation-dashboard-git-v2-server-aggregation-nika8.vercel.app/])*

---

### Project Structure / სტრუქტურა
```text
src/
├── app/
│   ├── api/                 # Server-only API routes (Write Operations)
│   │   ├── match/route.ts
│   │   └── transactions/[id]/route.ts
│   ├── page.tsx             # Main dashboard UI
│   └── providers.tsx        # React Query caching layer
├── components/              # UI Components (Tables, Modals, Summary)
├── hooks/                   # React Query hooks
├── lib/
│   ├── calculations.ts      # Client-side math logic
│   ├── export.ts            # CSV generation
│   ├── fuzzy.ts             # Levenshtein distance engine
│   ├── supabase-admin.ts    # Admin Supabase instance (Service Role - Writes)
│   └── supabase.ts          # Client Supabase instance (Read-only)
├── schemas/                 # Zod validation types & schemas
└── services/                # API/Supabase communication (Queries & Mutations)
```

### Environment Variables / გარემოს ცვლადები
| Variable | Environment | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Database API URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client (Browser) | Public key. Used for frontend read operations. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | Secret key. Used by Next.js API routes to execute secure writes. |

---

## 🇬🇪 ქართული ვერსია

### არქიტექტურა და იმპლემენტაცია

**1. State Management და ფილტრაცია**
სისტემა ითხოვს მიმდინარე თვის ტრანზაქციებსა და კონტრაქტებს ერთხელ და ინახავს მათ TanStack Query-ს ქეშში. ჯამური სტატისტიკის დასათვლელად საჭიროა სრული მონაცემები, ხოლო ცხრილისთვის — გაფილტრული. კლიენტის მხარეს ფილტრაცია თავიდან ირიდებს ყოველ Search-ზე ბაზაში ზედმეტი მოთხოვნების გაგზავნას.

**2. ავტომატური დადარება (RPC Bonus)**
ავტომატური შედარება ხდება ბაზის დონეზე PostgreSQL ფუნქციით (`match_bank_transactions`). შედარება ხდება ექსკლუზიურად `sender_inn = tax_id` პრინციპით. `sender_name` იგნორირებულია, რაც აგვარებს ერთი კომპანიის მიერ სხვადასხვა სახელით (მაგ. ფილიალის მითითებით) გადმორიცხული თანხების Edge Case-ს.

**3. Fuzzy Matching ნულოვანი დამოკიდებულებით (Levenshtein Bonus)**
მესამე მხარის ბიბლიოთეკების გარეშე დაწერილია Levenshtein Distance-ის მატრიცული ალგორითმი.
* **ნორმალიზაცია:** იშლება იურიდიული პრეფიქსები (შპს, სს), პუნქტუაცია და სივრცეები.
* **შედეგები:** `0.60` ზღვარი აიგნორებს საერთო ქართულ სუფიქსებს და იჭერს ბეჭდვით შეცდომებს.

**4. Optimistic UI & გლობალური სტატუსები**
TanStack Query-ს `setQueriesData`-ს დახმარებით, სტატუსების ცვლილება UI-ში მყისიერად აისახება. იტვირთება `GlobalNetworkIndicator`-ით, ხოლო Error-ები იმართება ცენტრალურად Cache დონეზე.

**5. ინკლუზიური თარიღების ლოგიკა**
კონტრაქტების აქტიურობა მოწმდება ინკლუზიური საზღვრებით (`start_date <= endOfMonth` & `end_date >= startOfMonth`). მაგალითად, `Rustavi Trans`-ის კონტრაქტი სრულდება 1 აპრილს (`2026-04-01`), სისტემა მას თვლის აპრილის თვეში აქტიურ კონტრაქტად.

**6. CSV ექსპორტი (Bonus)**
მონაცემთა ექსპორტი იყენებს `\uFEFF` (UTF-8 BOM), რათა ქართული შრიფტი Microsoft Excel-ში სწორად გაიხსნას (RFC 4180 სტანდარტი).

### უსაფრთხოება და დათმობები (Architecture & Trade-offs)

* **უსაფრთხოება (Database & API):** ბაზის დონეზე RLS გამორთულია რევიუერისთვის ლოკალური ტესტირების გასამარტივებლად. თუმცა, საჯარო `anon` გასაღებს აქვს მხოლოდ წაკითხვის უფლება, რადგან Postgres-ის დონეზე მას წართმეული (Revoked) აქვს `INSERT`, `UPDATE` და `DELETE` უფლებები. ყველა Write ოპერაცია გადის სერვერულ API-ებზე (`/api/match`, `/api/transactions/[id]`), სადაც გამოიყენება `service_role` გასაღები და მკაცრი Zod ვალიდაცია. შენიშვნა: ეს Route-ები არ არის ავტორიზაციით დაცული (ნებისმიერს შეუძლია მათი პირდაპირ გამოძახება). ეს მიდგომა სრულად ხურავს "გაჟონილი anon key"-ის რისკს, თუმცა არ წარმოადგენს სრულ წვდომის კონტროლს.
* **UUID ვალიდაცია:** საწყის ბაზაში (Seed Data) არსებული UUID-ები არღვევს **RFC 4122 v4** სტანდარტს (მაგ: მე-4 ბლოკის Variant Bit არასწორია). მონაცემების დასამუშავებლად და აპლიკაციის ქრაშის თავიდან ასაცილებლად, კლიენტის Zod სქემებში `z.uuid()` შეიცვალა `z.string()`-ით.
* **Manual Override:** UI-ში შენარჩუნებულია ხელით არჩევის (Manual Select) Dropdown-ი.

---

## 🇬🇧 English Version

### Architecture & Implementation

**1. State Management & Filtering**
The system fetches the current month's data once and caches it globally. The analytics board requires 100% of the data to calculate totals, while the grid requires a filtered subset. In-memory client-side filtering ensures UI response times without redundant database hits.

**2. Auto-Matching (RPC Bonus)**
Auto-matching operates directly on the database via a PostgreSQL stored procedure. It matches strictly on `sender_inn = tax_id`. The `sender_name` is ignored, resolving edge cases where a company sends payments using varying branch names.

**3. Zero-Dependency Fuzzy Matching (Levenshtein Bonus)**
Implemented a custom Levenshtein distance matrix without external libraries.
* **Normalization:** Strips Georgian corporate prefixes (შპს, სს), punctuation, and whitespace.
* **Threshold Tuning:** Set to `0.60`. Testing confirmed this rejects common logistics suffixes while catching typos.

**4. Optimistic UI & Global States**
Using TanStack Query's `setQueriesData`, user actions update the UI optimistically. Centralized error boundaries within the cache level and a `GlobalNetworkIndicator` handle loading and error states.

**5. Inclusive Date Range Math**
Contract overlap logic uses inclusive mathematical bounds (`start_date <= endOfMonth`). For example, `Rustavi Trans` has a contract ending on `2026-04-01`. Inclusive bounds ensure it is counted as active for the month of April.

**6. Robust CSV Export Engine (Bonus)**
The exporter injects a UTF-8 BOM (`\uFEFF`) to ensure native Georgian Mkhedruli rendering in Microsoft Excel.

### Security Architecture & Trade-offs

* **Database & API Security:** Row Level Security (RLS) is disabled for reviewer convenience. However, the public `anon` key is strictly read-only because `INSERT`, `UPDATE`, and `DELETE` privileges have been explicitly revoked from the `anon` role in Postgres. All write operations pass through Next.js server endpoints (`/api/match`, `/api/transactions/[id]`) using the `service_role` key and strict Zod validation. Note: these API routes are not behind authentication (any client could call them directly). This setup successfully closes the "leaked anon key" attack surface, but it does not implement full access control.
* **Relaxed UUID Validation:** The provided seed data contains IDs that violate strict **RFC 4122 v4** standards (the variant bit in the 4th block is incorrect). To process this data without triggering application crashes, `z.string().uuid()` was downgraded to `z.string()`.
* **Manual Override Retention:** The manual `<select>` override dropdown is permanently retained in the UI.

---

## 🛠️ Local Setup / გაშვების ინსტრუქცია 

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Database Configuration (Supabase SQL Editor):**
   Run the following files sequentially to build the database and RPC functions:
   * `sql/seed_schema.sql` (Creates tables and seeds companies & contracts)
   * `sql/seed_transactions.sql` (Seeds 89 bank transactions)
   * `sql/match_function.sql` (Creates the `match_bank_transactions()` RPC)

3. **Environment Variables:**
   Copy `.env.example` to `.env.local` and fill in all three values from the table above — including `SUPABASE_SERVICE_ROLE_KEY` (found in Supabase → Settings → API), which is required for the Auto-Matching and manual-match/ignore endpoints to execute properly.

4. **Run the Server:**
   ```bash
   npm run dev
   ```

### 🧪 Fuzzy Match Testing Guide (Reviewer Guide)
The 12 unmatched transactions in the provided seed data belong to unknown entities. To test the typo-correction engine against the dataset, execute this SQL script in Supabase:

```sql
INSERT INTO bank_transactions (doc_key, entry_date, amount, sender_name, sender_inn, status)
VALUES (
    'TYPO-TEST-001', '2026-06-15', 1200.00, 
    'შპს ეკკკო ტარნსპოტი (ფილიალი)', -- Typo of "შპს ეკო ტრანსპორტი"
    '000000000', 'unmatched'
);
```
*(Filter the dashboard by **June > Unmatched** to see the algorithmic suggestion).*