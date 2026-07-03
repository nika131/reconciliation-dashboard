# Bank Reconciliation Engine (V2: Enterprise Scalability)

🔗 **[Live Demo / ცოცხალი ვერსია](https://reconciliation-dashboard-git-v2-server-aggregation-nika8.vercel.app/?_vercel_share=FUemVuTB3hmKlaA73WDw6dZweot199Im)**

🇬🇪 [ქართული ვერსია](#ქართული-ვერსია) | 🇬🇧 [English Version](#english-version)

---

## 🇬🇪 ქართული ვერსია

**🚀 შენიშვნა შემფასებლებისთვის: თქვენ იმყოფებით V2 განშტოებაზე.** ეს განშტოება წარმოადგენს სისტემის Enterprise ვერსიას. განსხვავებით `main` განშტოებისგან (სადაც კალკულაციები ხდება ბრაუზერში), აქ იმპლემენტირებულია **Server-Side Pagination (.range())** და სტატისტიკის დამთვლელი **PostgreSQL RPCs**. ეს არქიტექტურა უზრუნველყოფს სისტემის შეუფერხებელ მუშაობას 50,000+ ტრანზაქციაზე.

### 🛠️ გაშვების ინსტრუქცია (Local Setup)

1. `npm install`
2. **გაუშვით SQL ფაილები Supabase-ში (აუცილებლად ამ თანმიმდევრობით):**
   * `sql/seed_schema.sql` 
   * `sql/seed_transactions.sql`
   * `sql/rpc_match.sql`
   * `sql/summary_rpc.sql` (ქმნის `get_monthly_summary()` RPC-ს)
   * `sql/stats_rpc.sql` (ქმნის `get_monthly_stats()` RPC-ს)
3. დააკოპირეთ `.env.example`, დაარქვით `.env.local` და ჩასვით თქვენი Supabase გასაღებები.
4. `npm run dev`

### 💡 მნიშვნელოვანი დეტალები
* **UUID ინტეგრაცია:** მოწოდებულ სატესტო მონაცემებში არსებული იდენტიფიკატორები (მაგ: `b4c5d6e7-f8a9...`) არღვევენ RFC 4122 v4 სტანდარტს (Variant bit-ის შეცდომა). აპლიკაციის გათიშვის თავიდან ასაცილებლად, Zod ვალიდაცია მორგებულია `z.string()`-ზე.
* **RLS გამორთულია:** თქვენთვის ლოკალური ტესტირების გასამარტივებლად, RLS გამიზნულად გამორთულია.

### 📄 Pagination-ის ტესტირება
ივნისის (June) მონაცემებში 53 ტრანზაქციაა ჩადებული, ხოლო გვერდზე მაქსიმუმ 50 ჩანაწერი გამოისახება. შესაბამისად, ფილტრში **June > All Statuses** არჩევისას თქვენ პირდაპირ დაინახავთ რეალურ, სერვერიდან დაბრუნებულ 2-გვერდიან Pagination-ს დამატებითი მონაცემების შეყვანის გარეშე.

### 🧪 Fuzzy Match ტესტი
ალგორითმის (Levenshtein distance) დასატესტად, გაუშვით ეს სკრიპტი ბაზაში და Dashboard-ზე გაფილტრეთ **June > Unmatched**:

```sql
INSERT INTO bank_transactions (doc_key, entry_date, amount, sender_name, sender_inn, status)
VALUES ('TYPO-TEST-001', '2026-06-15', 1200.00, 'შპს ეკო ტრანსპოტი', '000000000', 'unmatched');
```

---
---

## 🇬🇧 English Version

**🚀 Note for Reviewers: You are currently viewing the V2 Scalability Branch.** This branch represents an Enterprise-grade enhancement. Unlike the `main` branch (which relies on client-side math), this architecture uses **Server-Side Pagination (.range())** and **native PostgreSQL RPCs** for global statistics. This ensures the application remains highly performant even when scaling to 50,000+ rows.

### 🛠️ Local Setup

1. `npm install`
2. **Run these SQL files in your Supabase editor (strictly in this order):**
   * `sql/seed_schema.sql`
   * `sql/seed_transactions.sql`
   * `sql/match_function.sql`
   * `sql/summary_function.sql` (Creates the `get_monthly_summary()` RPC)
   * `sql/stats_function.sql` (Creates the `get_monthly_stats()` RPC)
3. Copy `.env.example` to `.env.local` and add your Supabase keys.
4. `npm run dev`

### 💡 Key Technical Decisions
* **UUID Validation Downgrade:** A programmatic analysis of the seed data revealed that the generated IDs violate strict RFC 4122 v4 standards (e.g., ID `b4c5d6e7-f8a9...` has an invalid variant bit). To prevent crashes, strict `.uuid()` validation was defensively downgraded to `z.string()`.
* **RLS Disabled:** Row Level Security has been intentionally disabled to ensure frictionless local testing for the reviewer.

### 📄 Pagination Testing
The provided seed data for June contains exactly 53 transactions. Since the `ITEMS_PER_PAGE` limit is set to 50, selecting **June > All Statuses** in the dashboard will natively demonstrate the Server-Side Pagination (rendering 2 distinct pages) without requiring you to manually insert extra rows.

### 🧪 Fuzzy Match Reviewer Test
To test the custom typo-correction algorithm, run the following SQL script directly in your database, then filter the dashboard by **June > Unmatched**:

```sql
INSERT INTO bank_transactions (doc_key, entry_date, amount, sender_name, sender_inn, status)
VALUES ('TYPO-TEST-001', '2026-06-15', 1200.00, 'შპს ეკო ტრანსპოტი', '000000000', 'unmatched');
```