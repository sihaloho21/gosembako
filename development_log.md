# Paket Sembako - Development Log

## Feature: Tukar Poin (Point Exchange) Settings

I have implemented the "Tukar Poin" management feature in the admin panel. This allows administrators to manage products that can be redeemed using points.

### Changes Made:
1.  **Admin UI (`admin/index.html`)**:
    *   Added "Tukar Poin" to the sidebar navigation.
    *   Created a new section for listing point exchange products.
    *   Added a modal for adding and editing point exchange products.
2.  **Admin Logic (`admin/js/admin-script.js`)**:
    *   Implemented `fetchTukarPoin()` to retrieve data from SheetDB.
    *   Implemented `renderTukarPoinTable()` to display products.
    *   Implemented CRUD operations (Create, Read, Update, Delete) for point exchange products.
    *   Integrated with SheetDB using the `tukar_poin` sheet name.
3.  **Styling (`admin/css/admin-style.css`)**:
    *   Added active state styling for the "Tukar Poin" sidebar item.

### Requirements for SheetDB:
To make this feature work, you need to add a new sheet named **`tukar_poin`** in your Google Spreadsheet with the following columns:
*   `id` (Unique identifier)
*   `judul` (Product title)
*   `poin` (Points required)
*   `gambar` (Image URL)
*   `deskripsi` (Product description)

### How to Use:
1.  Open the Admin Dashboard.
2.  Click on the **"Tukar Poin"** menu in the sidebar.
3.  Use the **"Tambah Produk Tukar"** button to add new items.
4.  Use the **Edit** (blue) and **Delete** (red) buttons to manage existing items.
