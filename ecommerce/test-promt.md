Please use Playwright Skills to run a full end-to-end test pass on my e-commerce project and evaluate these 4 core CRUD features:

1. CREATE
   - Register a new user
   - Add a new shipping address
   - Place an order

2. READ
   - Browse the product list
   - View order history and order details

3. UPDATE
   - Update the quantity of an item in the cart

4. DELETE
   - Remove an item from the cart

Do not only check whether the front end looks correct. For each feature, validate all of the following layers:

- Front-end interaction
- Network request success
- Back-end behavior
- Database state changes

For each feature, please structure the test report using this exact format:

[Feature Name]
[Test Goal]
[Preconditions]
[Test Steps]
[Expected Front-End Result]
[Expected Back-End Result]
[Database Verification Method]
[Success Criteria]
[Actual Result]
[Pass/Fail]
[Failure Reason]
[Suggested Fix]

Detailed success criteria for each feature:

A. CREATE
Test at least these 3 create flows:
- Register a new user
- Add a new shipping address
- Place an order

A CREATE test is successful only if:
- The form submission succeeds with no 4xx or 5xx errors
- The UI shows the correct success behavior or redirect
- The Network panel shows a successful request
- The back-end logs show no unhandled exception
- The database contains the newly created records

Database checks:
- Registration: a new row is created in users
- New address: a new row is created in user_addresses
- Place order: new rows are created in orders, order_items, and payments; cart_items are cleared; inventory is correctly reduced

B. READ
Test at least these read flows:
- Browse products
- View order history and order details

A READ test is successful only if:
- The page loads successfully with no 500 errors
- The displayed data is correct and complete
- Search/filter/detail data matches the database
- The Network requests succeed
- The back-end logs show no unhandled exception

Database checks:
- Product list data matches products and related tables
- Order history and order detail data match orders, order_items, and payments
- Displayed quantities, prices, and statuses match database values

C. UPDATE
Test:
- Change the quantity of an item in the cart from its original value to another valid value

An UPDATE test is successful only if:
- The cart quantity updates correctly in the UI
- The subtotal and total update correctly
- The Network request succeeds
- The back-end logs show no unhandled exception
- The corresponding cart_items.quantity value is permanently updated in the database
- After page refresh, the updated quantity is still correct

Database checks:
- Query cart_items before the update
- Query cart_items after the update
- Confirm the stored quantity really changed

D. DELETE
Test:
- Remove an item from the cart

A DELETE test is successful only if:
- The item disappears from the UI
- The cart total and item count update correctly
- The Network request succeeds
- The back-end logs show no unhandled exception
- The corresponding row is removed from cart_items in the database
- After page refresh, the item is still gone

Database checks:
- Query cart_items before deletion to confirm the row exists
- Query cart_items after deletion to confirm the row no longer exists

Additional requirements:
- For every feature, clearly say whether it passed or failed
- If a test fails, do not only say "failed" — identify whether the problem is in the front end, request layer, back end, template rendering, or database layer
- For every successful test, provide concrete evidence: UI behavior, Network status, logs, and database changes
- Where useful, capture evidence such as:
  - before-action screenshot
  - after-action screenshot
  - Network request details
  - before/after database verification

At the end, provide a final summary:
- Which CRUD features fully passed
- Which features partially passed
- Which features failed
- The most likely root cause for each failed feature
- A recommended fix priority order

Important:
A feature should only be marked as PASSED if the front end works, the request succeeds, the back end does not throw errors, and the database state is correct.
Do not mark a feature as passed based only on visible front-end behavior.