# Bank Reconciliation Engine (V2: Enterprise Scalability)

🇬🇪 [ქართული ვერსია](#ქართული-ვერსია) | 🇬🇧 [English Version](#english-version)

---

## 🇬🇪 ქართული ვერსია

**🚀 შენიშვნა შემფასებლებისთვის: თქვენ იმყოფებით V2 განშტოებაზე.** ეს განშტოება წარმოადგენს სისტემის Enterprise ვერსიას. განსხვავებით `main` განშტოებისგან (სადაც კალკულაციები ხდება ბრაუზერში), აქ იმპლემენტირებულია **Server-Side Pagination (.range())** და სტატისტიკის დამთვლელი **PostgreSQL RPCs**. ეს არქიტექტურა უზრუნველყოფს სისტემის შეუფერხებელ მუშაობას 50,000+ ტრანზაქციაზე.

### 🛠️ გაშვების ინსტრუქცია (Local Setup)

1. `npm install`
2. **გაუშვით SQL ფაილები Supabase-ში (აუცილებლად ამ თანმიმდევრობით):**
   * `sql/seed_schema.sql` 
   * `sql/seed_transactions.sql`
   * `sql/match_function.sql`
   * **`sql/04_stats_rpc.sql` (V2 სერვერული კალკულაციებისთვის)**
3. დააკოპირეთ `.env.example`, დაარქვით `.env.local` და ჩასვით თქვენი Supabase გასაღებები.
4. `npm run dev`

### 💡 მნიშვნელოვანი დეტალები
* **UUID ინტეგრაცია:** მოწოდებულ სატესტო მონაცემებში არსებული იდენტიფიკატორები (მაგ: `b4c5d6e7-f8a9...`) არღვევენ RFC 4122 v4 სტანდარტს (Variant bit-ის შეცდომა). აპლიკაციის გათიშვის თავიდან ასაცილებლად, Zod ვალიდაცია მორგებულია `z.string()`-ზე.
* **RLS გამორთულია:** თქვენთვის ლოკალური ტესტირების გასამარტივებლად, RLS გამიზნულად გამორთულია.

### 🧪 Fuzzy Match ტესტი
ალგორითმის (Levenshtein distance) დასატესტად, გაუშვით ეს სკრიპტი ბაზაში და Dashboard-ზე გაფილტრეთ **June > Unmatched**:

```sql
INSERT INTO bank_transactions (doc_key, entry_date, amount, sender_name, sender_inn, status)
VALUES ('TYPO-TEST-001', '2026-06-15', 1200.00, 'შპს ეკო ტრანსპოტი', '000000000', 'unmatched');