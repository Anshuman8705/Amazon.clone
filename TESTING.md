# Manual test script

Start with a clean database so the numbers below match: run `npm run seed`, then `npm run dev`, and open http://localhost:5173. Keep the browser console open (F12) and watch for red errors throughout. Each row is one check with the result you should see.

Test details for forms: password `secret123`, any address, postal code `431601`, card `4242 4242 4242 4242`, expiry `12/40`, security code `123`.

| # | Where | Do this | Expect |
|---|-------|---------|--------|
| 1 | Terminal | `npm run dev` | Two coloured logs: `api` says "API listening on http://localhost:4000", `web` prints the Vite address. |
| 2 | Browser | Open http://localhost:4000/api/health | `{"ok":true,...}`. The API answers directly. |
| 3 | Browser | Open http://localhost:4000/api/products?category=pets | JSON array of the three pet products with `rating`, `stock` and `discount` fields. |
| 4 | Home | Load http://localhost:5173 | Three-slide hero with arrows, eight tiles with photos (one is "Sign in for the best experience" when signed out), then Deals, Best sellers and Under $25 rows. Cart badge 0. Tiles briefly show grey placeholders while the API responds. |
| 5 | Terminal | Stop the API (Ctrl+C) and refresh the home page | A red box: "Cannot reach the server. Is the API running?" with a Try again button. Restart the API, click Try again, page recovers. |
| 6 | Header | Search `carafe` | One result, heading `Results for "carafe"`. The network tab shows a request to `/api/products?q=carafe`. |
| 7 | Header | Choose "Toys & Games" in the dropdown, search with an empty box | Only toys listed. |
| 8 | Listing | On All products tick two departments, pick "Under $25", click 4 stars & up, tick Free delivery only | Results narrow each time; the request URL in the network tab gains `category=`, `maxPrice=`, `minRating=`, `prime=1`. |
| 9 | Listing | Sort by "Biggest discount" | The gift bundle (46% off) is first. |
| 10 | Nav | Today's Deals | Only products 25% off or more, each with a red badge. |
| 11 | Product | Open `/product/2` | "Only 6 left in stock" in red; the quantity dropdown stops at 6; 9,210 ratings. |
| 12 | Product | Quantity 2, Add to cart | Badge 2, toast with View cart link. |
| 13 | Product | Scroll to Customer reviews | "No written reviews yet" and a prompt to sign in to write one. |
| 14 | Product | Open `/product/9999` | 404 page. |
| 15 | Cart | Refresh the page | The two items are still there (guest cart lives in the browser). |
| 16 | Cart | Press plus until it stops | Plus disables at 6 because that's the stock. |
| 17 | Checkout | Blank submit | Every field shows a message, focus lands on Full name. |
| 18 | Checkout | Card `4242 4242 4242 4241` | "That card number fails the checksum". |
| 19 | Checkout | Expiry `01/20` | "That card has expired". |
| 20 | Checkout | Fill everything correctly as a guest and submit | Green "Order placed, thank you", order number `402-.......-.......`, card ending 4242. Badge 0. |
| 21 | Product | Open `/product/2` again | "Only 4 left in stock". The order really reduced stock on the server. |
| 22 | Orders | Click Returns & Orders | Guest notice at the top, the order listed. Click its number to reopen the confirmation. |
| 23 | Product | On `/product/6` add 1 to cart (as a guest) | Badge 1. |
| 24 | Sign in | Hello, sign in, then "Create an account". Register with your name, an email, `secret123` | Back on home, header says "Hello, <first name>". Badge still 1: the guest cart merged into the new account. |
| 25 | Sign in | Register again with the same email (sign out first) | "Already registered. Sign in instead." under the email field. |
| 26 | Sign in | Sign in with the wrong password | "Email or password is incorrect". |
| 27 | Product | Signed in, on `/product/7`, choose 1 star, title "Split in half", a sentence of review, Submit | "Review saved". The review appears with your name and "(you)", the ratings count goes from 6,017 to 6,018, and the form title becomes "Update your review". |
| 28 | Product | Submit the review form with 5 stars and new text | The existing review is replaced, not duplicated. |
| 29 | Product | Submit a review with a 3-letter body | "Write at least a sentence" from the server. |
| 30 | Cart | Add two more items, then refresh | Badge unchanged. Reload does not double the cart. |
| 31 | Second browser | Open the site in a private window or another browser, sign in with the same account | The same cart appears. Change a quantity there, refresh the first browser: it matches. |
| 32 | Checkout | Signed in, open `/checkout` directly | Name and email are prefilled from the account. Place the order. |
| 33 | Orders | Returns & Orders | The order is listed with no guest notice. Sign out and back in on the other browser: the same order is there. |
| 34 | Terminal | Stop the API with Ctrl+C and start it again with `npm run dev:api` | Sign in again: cart and orders are all still there. The data is in `server/data/store.db`, not in memory. |
| 35 | Terminal | `npm run seed` | Prints "Database reset. 20 products loaded." Stock is back to seed values, and accounts, orders and reviews are gone. |
| 36 | Terminal | `npm test` | 4 files, 44 tests passing. |
| 37 | Terminal | `npm run build` then `npm start`, open http://localhost:4000 | The whole site runs from one process. Deep links like `/category/pets` load on refresh. |
| 38 | Any | Tab through a page | Visible focus ring on every control. |
| 39 | Any | Phone width | Header becomes the phone layout: logo row with Sign in and cart, full-width search, "Deliver to" strip, scrolling department chips. On a listing page a Filters button opens a bottom sheet. Nothing overflows sideways. |
| 39a | Any | Click the ☰ All button (desktop department bar, or the phone header) | A side menu slides in with Shop by department, Programs & features, Help & settings. Escape or the X closes it. |
| 40 | Header | Type `ket` in the search box | A suggestions dropdown appears under the box with the kettlebell and a price; clicking it opens the product. |
| 41 | Product | Click the heart on a product card while signed out | Sent to sign in. Sign in, come back, click it: the heart turns red. |
| 42 | Header | Account & Lists menu, then Your wishlist | The product is listed with Add to cart and Remove. |
| 43 | Account | Account & Lists, then Your account. Change the name and save | Header greeting updates immediately. |
| 44 | Account | Change password with the wrong current password | "Current password is incorrect". With the right one, "Password changed"; sign out and back in with the new password. |
| 45 | Account | Add an address | It appears in the list marked Default. Add a second one ticking "Make this my default": the badge moves. |
| 46 | Checkout | Open checkout signed in | Name, street, city, state and postal code are prefilled from the default address; the "Use a saved address" dropdown switches between them. |
| 47 | Orders | Place an order, then Returns & Orders | Status badge reads Confirmed and there is a Cancel order link. |
| 48 | Orders | Cancel the order (confirm the prompt) | Badge reads Cancelled, the link disappears, and the product's stock is back to what it was. |
| 49 | Admin | Sign out, sign in as `admin@example.com` / `admin123` | "Store admin" appears at the right of the department bar and in the account menu. |
| 50 | Admin | Open `/admin` | Dashboard with revenue, order, customer and low-stock counts, and the recent orders list. |
| 51 | Admin | Orders, change an order's status to Shipped | Green confirmation line; the badge updates. Open the same order as the customer: it shows Shipped and no Cancel link. |
| 52 | Admin | Orders, set an order to Cancelled | Stock for its items goes back up; the status dropdown is then disabled for that order. |
| 53 | Admin | Products, change a stock number and click away | It saves on blur; refresh and the value persists. Numbers of 5 or fewer show in red. |
| 54 | Admin | Add product with a title, brand, prices and stock, one bullet per line | Appears in the products table; search for it in the store as a customer and it's there with the correct discount badge. |
| 55 | Admin | Edit that product, untick "Visible in the store" | It shows as Archived in the table and no longer appears in the store or via its URL. |
| 56 | Admin | Delete a product that has been ordered (e.g. one from an earlier row) | Message says it was archived, because it appears in an order. Delete a product that has never been ordered: it is removed outright. |
| 57 | Admin | Customers | Every registered account with join date, order count and total spend. |
| 58 | Any | As a customer, open `/admin` directly | Polite message that the area is for administrators, no data shown. |

If a row fails, note the number and what you saw. For anything involving stock or counts, remember that earlier rows change the numbers, which is the point: they're real.
