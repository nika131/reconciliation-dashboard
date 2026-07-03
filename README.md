# Bank Reconciliation Engine / საბანკო ტრანზაქციების შედარება

🇬🇪 [ქართული ვერსია](#ქართული-ვერსია) | 🇬🇧 [English Version](#english-version)

---

## 🇬🇪 ქართული ვერსია

### პროექტის მიმოხილვა

> **🚀 შენიშვნა შემფასებლებისთვის: V2 Scalability Branch (მასშტაბირებადი არქიტექტურა)**
> მოცემული `main` განშტოება (Branch) წარმოადგენს მკაცრ MVP-ს, რომელიც 100%-ით ფარავს დავალების ყველა მოთხოვნასა და ბონუსს. თუმცა, რეალურ პროექტებში მონაცემების ათიათასობით ჩანაწერზე გაზრდის შემთხვევაში, Client-side ფილტრაცია და კალკულაციები UI-ს შეანელებს.
> Enterprise-სტანდარტების სადემონსტრაციოდ, დამატებით ავაწყვე ალტერნატიული არქიტექტურა **`v2-server-aggregation`** ბრანჩზე. მასში იმპლემენტირებულია Server-Side Pagination (`.range()`), მონაცემთა ბაზის დონეზე ძებნა და გლობალური სტატისტიკის დამთვლელი მშობლიური PostgreSQL RPC-ები. ვინაიდან ეს სცდებოდა დავალების მოთხოვნებს, სისტემის ეს ვერსია გატანილია დამოუკიდებელ Branch-ზე.

ეს პროექტი წარმოადგენს საბანკო ტრანზაქციების შედარებას (Reconciliation) N-Tier არქიტექტურაზე აწყობილ სისტემას (Next.js, React, Supabase/PostgreSQL, TanStack Query). 

პროექტზე მუშაობისას ჩემი მთავარი მიზანი იყო სისტემის Production-ready სტანდარტებით აწყობა. ძირითადი მოთხოვნების გარდა, წარმატებით არის იმპლემენტირებული **ოთხივე ბონუს დავალება**. ქვემოთ დეტალურად ვხსნი იმ არქიტექტურულ და პრაქტიკულ გადაწყვეტილებებს, რომლებიც დამუშავების პროცესში მივიღე.

### არქიტექტურული გადაწყვეტილებები

#### 1. State Management & კლიენტის მხარეს ფილტრაცია
სისტემა არჩეული თვის მონაცემებს (Transactions, Companies, Contracts) **მხოლოდ ერთხელ** ითხოვს და ინახავს TanStack Query-ს ცენტრალურ ქეშში. 
* **რატომ?** Dashboard შედგება ორი ნაწილისგან: `SummaryBoard` (სჭირდება 100%-იანი მონაცემები ჯამებისთვის) და `TransactionTable` (სჭირდება გაფილტრული მონაცემები). ყოველ Search-ზე ბაზაში ახალი მოთხოვნის გაგზავნა გამოიწვევდა ზედმეტ (Redundant) დატვირთვას. In-memory ფილტრაციით მივიღეთ UI-ს მყისიერი რეაგირება.

#### 2. სერვერ-საიდ ავტომატური შედარება (RPC Bonus)
ავტომატური შედარება სრულად გატანილია PostgreSQL-ის დონეზე (`match_bank_transactions` Stored Procedure). 
* **Edge Case:** მოთხოვნის შესაბამისად, ავტომატური შედარება ეყრდნობა **ექსკლუზიურად `sender_inn = tax_id`** დამთხვევას. `sender_name` იგნორირებულია, რაც სრულყოფილად აგვარებს ერთი კომპანიის მიერ სხვადასხვა სახელით (მაგ. ფილიალის მითითებით) გადმორიცხული თანხების Edge Case-ს.

#### 3. ნულოვანი დამოკიდებულების Fuzzy Matching (Levenshtein Bonus)
შეუსაბამო ტრანზაქციებისთვის კომპანიის შეთავაზების ფუნქცია აწყობილია მესამე მხარის ბიბლიოთეკების (მაგ. `fuse.js`) გარეშე. დავწერე **Levenshtein Distance**-ის მატრიცული ალგორითმი.
* **ნორმალიზაცია:** ალგორითმი აშორებს იურიდიულ პრეფიქსებს (შპს, სს), პუნქტუაციას და სივრცეებს.
* **ზღვარი (Threshold):** დარეგულირებულია `0.60`-ზე. ემპირიულმა ტესტირებამ აჩვენა, რომ ეს ზღვარი წარმატებით აიგნორებს საერთო ქართულ სუფიქსებს (მაგ. "ტრანსპორტი", "ლოჯისტიკა") და იჭერს მხოლოდ რეალურ ბეჭდვით შეცდომებს.

#### 4. Optimistic UI & გლობალური Loading/Error სტატუსები
* **Optimistic Updates:** TanStack Query-ს `setQueriesData`-ს დახმარებით, შედარების სტატუსები UI-ში მყისიერად აისახება (მკაცრი TypeScript ტიპიზაციით, `any`-ს გარეშე).
* **გლობალური სტატუსები:** მოთხოვნების ჩატვირთვა იმართება `GlobalNetworkIndicator`-ით, ხოლო Error-ები დაჭერილია ცენტრალურად `QueryCache`-ისა და `MutationCache`-ის დონეზე (სრულად ფარავს დავალების Error/Loading მოთხოვნას).

#### 5. ინკლუზიური თარიღების ლოგიკა კონტრაქტებისთვის
კონტრაქტების აქტიურობა მოწმდება ინკლუზიური საზღვრებით (`start_date <= endOfMonth` & `end_date >= startOfMonth`). 
* **Edge Cases:** ეს იდეალურად ფარავს სატესტო მონაცემებში არსებულ რთულ შემთხვევებს. მაგალითად, `Rustavi Trans`-ის მეორე კონტრაქტი სრულდება ზუსტად თვის პირველ რიცხვში (`2026-04-01`), სისტემა მას ლოგიკურად მაინც აპრილის თვეში აქტიურად თვლის. ასევე სწორად მუშავდება შუა თვეში (`Safe Transport` - `05-15`) შეჩერებული კონტრაქტები. თუ კონტრაქტის სტატუსია `paused/ended`, მაგრამ `end_date` აკლია, დამატებულია Defensive შემოწმება.

#### 6. CSV ექსპორტი (Bonus)
მონაცემთა ექსპორტი იყენებს `\uFEFF` (UTF-8 BOM), რათა ქართული შრიფტი Microsoft Excel-ში უშეცდომოდ გაიხსნას და დაცულია RFC 4180 სტანდარტი.

### დათმობები და პრაქტიკული გადაწყვეტილებები (Trade-offs)

* **UUID ვალიდაციის ადაპტაცია (Critical Fix):** ბაზასთან ინტეგრაციისას Zod-მა დააბრუნა `invalid_format` ქრაში. სკრიპტულმა ანალიზმა აჩვენა, რომ მოწოდებულ Seed ფაილებში არსებული UUID-ები არღვევს მკაცრ **RFC 4122 v4** სტანდარტს (კერძოდ, Variant Bit არასწორია). 
  * მაგალითად: Seed ბაზაში არსებული ID `b4c5d6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e` მე-4 ბლოკს იწყებს `1`-ით, როცა სტანდარტით აუცილებელია იყოს `8, 9, a` ან `b`.
  * ანალოგიურად, ID `a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d` იწყება `0`-ით.
  კლიენტის აპლიკაციის ქრაშის თავიდან ასაცილებლად და კორუმპირებულ მონაცემებთან სამუშაოდ, Zod სქემებში `z.uuid()` ლოგიკურად ჩანაცვლდა `z.string()`-ით.
* **RLS (Row Level Security) გამორთულია:** ვინაიდან ეს არის სატესტო დავალება (Take-home assignment), მონაცემთა ბაზაზე RLS გამიზნულად გამორთულია. ეს გადაწყვეტილება მიღებულია შემფასებლისთვის ლოკალური ტესტირების გასამარტივებლად, რათა არ გახდეს საჭირო დამატებითი Policy სკრიპტების გაშვება და ავტორიზაციის (Auth) სიმულაცია API-ის შესამოწმებლად.
* **Manual Override:** Fuzzy Match-ის ზუსტი შეთავაზების მიუხედავად, UI-ში სამუდამოდ შენარჩუნებულია ხელით არჩევის (Manual Select) Dropdown-ი.

---

## 🛠️ გაშვების ინსტრუქცია (Local Setup)

1. **დააინსტალირეთ დამოკიდებულებები:**

        npm install

2. **მონაცემთა ბაზის კონფიგურაცია (Supabase SQL Editor):**
   მიმდევრობით გაუშვით შემდეგი ფაილები, რათა აეწყოს ბაზა და RPC ფუნქციები:
   * `sql/seed_schema.sql` (ქმნის ცხრილებს და შეაქვს კომპანიები/კონტრაქტები).
   * `sql/seed_transactions.sql` (შეაქვს 89 საბანკო ტრანზაქცია).
   * `sql/match_function.sql` (ქმნის `match_bank_transactions()` ფუნქციას Auto-Matching-სთვის).

3. **გარემოს ცვლადები:**
   დააკოპირეთ `.env.example` ფაილი, დაარქვით `.env.local` და ჩასვით თქვენი Supabase გასაღებები.

4. **გაუშვით სერვერი:**

        npm run dev

### 🧪 Fuzzy Match ტესტირების გზამკვლევი (Reviewer Guide)
მოწოდებულ საწყის (Seed) მონაცემებში არსებული 12 შეუსაბამო ტრანზაქცია ეკუთვნის ბაზისთვის სრულიად უცნობ კომპანიებს. ალგორითმი მათემატიკურად სწორად უარყოფს მათ. ტიპოგრაფიული შეცდომების (Typos) დასატესტად, გაუშვით ეს მცირე SQL სკრიპტი:

    INSERT INTO bank_transactions (doc_key, entry_date, amount, sender_name, sender_inn, status)
    VALUES (
      'TYPO-TEST-001', '2026-06-15', 1200.00, 
      'შპს ეკკკო ტარნსპოტი (ფილიალი)', -- "შპს ეკო ტრანსპორტი"-ს ტიპო
      '000000000', 'unmatched'
    );

*(Dashboard-ზე გაფილტრეთ **June** > **Unmatched**. ეკრანზე გამოჩნდება სისტემის მიერ გენერირებული ყვითელი შეთავაზების ღილაკი).*

---

## 🇬🇧 English Version

### Project Overview

> **🚀 Note for Reviewers: The V2 Scalability Branch**
> This `main` branch represents the strict MVP, fulfilling 100% of the core requirements and bonuses exactly as requested. However, in a production environment, client-side `.filter()` and `.reduce()` operations will bottleneck the main UI thread if the dataset scales to tens of thousands of rows. 
> To demonstrate enterprise-grade architecture, I built a highly scalable system on the **`v2-server-aggregation`** branch. It features Server-Side Pagination (`.range()`), Database-level Search Filtering, and native PostgreSQL RPCs to handle global statistics computations safely. Because this exceeded the explicit scope of the assignment, it is kept on a separate branch for your review.

An N-Tier banking reconciliation engine built with Next.js, React, Supabase (PostgreSQL), and TanStack Query. My objective was to build a highly optimized, type-safe, production-ready system. **All four bonus requirements** have been explicitly implemented.

### Architectural Decisions

#### 1. Single Source of Truth & Client-Side Filtering
The system fetches the current month's data **exactly once** and caches it globally. The analytics board requires 100% of the data to calculate totals, while the grid requires a filtered subset. In-memory client-side filtering ensures instant UI response times without redundant database hits.

#### 2. Server-Side Auto-Matching (RPC Bonus)
The core auto-matching logic operates directly on the database via a PostgreSQL stored procedure.
* **Edge Case Handling:** Per requirements, auto-matching relies **strictly on `sender_inn = tax_id`**. The `sender_name` is completely ignored during auto-matching, which flawlessly resolves edge cases where the same company sends payments using varying names/branches.

#### 3. Zero-Dependency Fuzzy Matching (Levenshtein Bonus)
Implemented a custom Dynamic Programming Levenshtein distance engine without relying on external libraries.
* **Normalization:** Strips Georgian corporate prefixes, punctuation, and whitespace.
* **Threshold Tuning:** Set to `0.60`. Testing confirmed this avoids false positives caused by highly common Georgian logistics suffixes while reliably catching severe typos.

#### 4. Optimistic UI & Global States
* **Optimistic Updates:** By leveraging TanStack Query's `setQueriesData`, user actions update the UI optimistically using strict TypeScript discriminated unions.
* **Global States:** Centralized error boundaries within `QueryCache`/`MutationCache` and a `GlobalNetworkIndicator` efficiently fulfill the assignment's loading/error state requirement.

#### 5. Inclusive Date Range Math
The contract overlap logic uses inclusive mathematical bounds (`start_date <= endOfMonth`). 
* **Edge Cases:** Resolves ambiguous scenarios natively. For example, `Rustavi Trans` has a contract ending exactly on `2026-04-01`. Inclusive bounds ensure it is rightfully counted as active for April. Added a defensive check for `paused/ended` contracts missing an `end_date`.

#### 6. Robust CSV Export Engine (Bonus)
The exporter automatically injects a UTF-8 BOM (`\uFEFF`) to ensure native Georgian Mkhedruli rendering in Microsoft Excel, explicitly adhering to RFC 4180 standards.

### Concessions & Trade-offs

* **Relaxed UUID Schema Validation (Critical Fix):** During live integration testing, Zod threw fatal `invalid_format` errors. A programmatic analysis of the provided seed data revealed that the generated IDs violate strict **RFC 4122 v4** standards (specifically the variant bit in the 4th block). 
  * For example, in the seed ID `b4c5d6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e`, the variant bit is `1` (it must be `8, 9, a`, or `b`). 
  * Similarly, the seed ID `a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d` starts with a `0`.
  To prevent application crashes on corrupted source data, strict `z.string().uuid()` validation was defensively downgraded to `z.string()`.
* **RLS Disabled for Reviewer Convenience:** Row Level Security (RLS) on the Supabase instance has been intentionally disabled. Because this is a take-home assignment, this ensures frictionless local testing for the reviewer. It prevents the need to run secondary policy scripts or simulate Authentication tokens just to fetch the dashboard data.
* **Manual Override Retention:** The manual `<select>` override dropdown is permanently retained in the UI to prevent algorithmic lock-in, even when a high-confidence fuzzy match is found.

### 🛠️ Local Setup

1. Run `npm install`
2. **Set up the database (Supabase SQL Editor, in order):**
   * Run `sql/seed_schema.sql` (creates tables, seeds companies & contracts)
   * Run `sql/seed_transactions.sql` (seeds 89 bank transactions)
   * Run `sql/match_function.sql` (creates the `match_bank_transactions()` RPC)
3. Copy `.env.example` to `.env.local` and add your Supabase keys.
4. Run `npm run dev`

### 🧪 Reviewer Testing Guide: Fuzzy Match
The 12 unmatched transactions in the provided seed data belong to completely unknown entities. To test the engine's typo-correction capabilities, please run the following SQL script:

    INSERT INTO bank_transactions (doc_key, entry_date, amount, sender_name, sender_inn, status)
    VALUES (
      'TYPO-TEST-001', '2026-06-15', 1200.00, 
      'შპს ეკკკო ტარნსპოტი (ფილიალი)', -- Typo of "შპს ეკო ტრანსპორტი"
      '000000000', 'unmatched'
    );

*(Filter the dashboard by **June** > **Unmatched** to see the algorithmic amber suggestion button appear).*