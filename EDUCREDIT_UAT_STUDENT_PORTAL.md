# EduCredit Student Portal - UAT Test Cases

**User Acceptance Testing Documentation**  
**Application:** EduCredit e-Service Portal (Student Portal)  
**Version:** 1.0  
**Test Date:** January 26, 2026  
**Environment:** https://moe-ui-eservice.vercel.app/

---

## Table of Contents
1. [Test Credentials](#test-credentials)
2. [Authentication & Login](#authentication--login)
3. [Dashboard Functionality](#dashboard-functionality)
4. [Account Balance Features](#account-balance-features)
5. [Course Payment Features](#course-payment-features)
6. [Transaction History](#transaction-history)
7. [Profile Management](#profile-management)
8. [Navigation & Usability](#navigation--usability)
9. [Security & Access Control](#security--access-control)
10. [Responsive Design](#responsive-design)
11. [Accessibility Testing](#accessibility-testing)
12. [Test Summary](#test-summary)

---

## Test Credentials

| User Type | Username | Password | Notes |
|-----------|----------|----------|-------|
| Student | kain.tran | Any password | Demo environment |

---

## Authentication & Login

### TC-AUTH-001: Successful Login
**Priority:** High  
**Prerequisite:** User has valid credentials

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to https://moe-ui-eservice.vercel.app/ | Landing page displays | ☐ Pass ☐ Fail | |
| 2 | Click "Access e-Service Portal" button | Login page displays | ☐ Pass ☐ Fail | |
| 3 | Enter username: kain.tran | Username field accepts input | ☐ Pass ☐ Fail | |
| 4 | Enter any password | Password field masks input | ☐ Pass ☐ Fail | |
| 5 | Click "Login" button | System validates credentials | ☐ Pass ☐ Fail | |
| 6 | Wait for redirect | Dashboard displays with user data | ☐ Pass ☐ Fail | |
| 7 | Verify user name appears in header | "kain.tran" visible in navigation | ☐ Pass ☐ Fail | |

**Expected Outcome:** User successfully logs in and is redirected to dashboard

---

### TC-AUTH-002: Login with Empty Fields
**Priority:** Medium  
**Prerequisite:** User on login page

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to login page | Login form displays | ☐ Pass ☐ Fail | |
| 2 | Leave username field empty | Field remains empty | ☐ Pass ☐ Fail | |
| 3 | Leave password field empty | Field remains empty | ☐ Pass ☐ Fail | |
| 4 | Click "Login" button | Error message displays | ☐ Pass ☐ Fail | |
| 5 | Verify error message | "Please enter username and password" or similar | ☐ Pass ☐ Fail | |
| 6 | Verify no redirect occurs | User remains on login page | ☐ Pass ☐ Fail | |

**Expected Outcome:** System prevents login with empty credentials and shows appropriate error

---

### TC-AUTH-003: Password Field Security
**Priority:** High  
**Prerequisite:** User on login page

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to login page | Login form displays | ☐ Pass ☐ Fail | |
| 2 | Click in password field | Field becomes active | ☐ Pass ☐ Fail | |
| 3 | Type "TestPassword123" | Characters appear as dots/asterisks | ☐ Pass ☐ Fail | |
| 4 | Check if "Show Password" toggle exists | Toggle button visible | ☐ Pass ☐ Fail | |
| 5 | Click "Show Password" (if exists) | Password becomes visible | ☐ Pass ☐ Fail | |
| 6 | Click toggle again | Password becomes masked again | ☐ Pass ☐ Fail | |

**Expected Outcome:** Password field properly masks input for security

---

### TC-AUTH-004: Logout Functionality
**Priority:** High  
**Prerequisite:** User is logged in

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Login to system | Dashboard displays | ☐ Pass ☐ Fail | |
| 2 | Locate logout button (top right) | Logout button/icon visible | ☐ Pass ☐ Fail | |
| 3 | Click logout button | Confirmation prompt appears (optional) | ☐ Pass ☐ Fail | |
| 4 | Confirm logout | User redirected to login page | ☐ Pass ☐ Fail | |
| 5 | Try to access dashboard URL directly | Redirected to login page | ☐ Pass ☐ Fail | |
| 6 | Check browser back button | Cannot access logged-in pages | ☐ Pass ☐ Fail | |

**Expected Outcome:** User successfully logs out and session is terminated

---

## Dashboard Functionality

### TC-DASH-001: Dashboard Initial Load
**Priority:** High  
**Prerequisite:** User successfully logged in

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Login to system | Dashboard loads within 3 seconds | ☐ Pass ☐ Fail | |
| 2 | Verify EduCredit logo | Logo visible in top left | ☐ Pass ☐ Fail | |
| 3 | Verify navigation menu | All menu items visible | ☐ Pass ☐ Fail | |
| 4 | Verify user profile icon | Profile icon/name in top right | ☐ Pass ☐ Fail | |
| 5 | Verify notification bell | Notification icon visible | ☐ Pass ☐ Fail | |
| 6 | Check for loading errors | No console errors, all widgets load | ☐ Pass ☐ Fail | |

**Expected Outcome:** Dashboard loads completely with all components visible

---

### TC-DASH-002: Account Summary Card Display
**Priority:** High  
**Prerequisite:** User on dashboard

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | View top section of dashboard | Account Summary Card visible | ☐ Pass ☐ Fail | |
| 2 | Check current balance display | Balance shown in SGD format | ☐ Pass ☐ Fail | |
| 3 | Verify account status indicator | Status shows "Active" or "Inactive" | ☐ Pass ☐ Fail | |
| 4 | Check account holder name | User's name displayed correctly | ☐ Pass ☐ Fail | |
| 5 | Verify ID number | NRIC/FIN visible (masked if needed) | ☐ Pass ☐ Fail | |
| 6 | Check last top-up information | Date and amount displayed | ☐ Pass ☐ Fail | |
| 7 | Verify quick action buttons | "Make Payment" and other buttons visible | ☐ Pass ☐ Fail | |

**Expected Outcome:** Account summary displays all required information accurately

---

### TC-DASH-003: Quick Stats Widgets
**Priority:** High  
**Prerequisite:** User on dashboard

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Locate Quick Stats section | 4 widget cards visible | ☐ Pass ☐ Fail | |
| 2 | Check "Total Credits" widget | Shows current balance with icon | ☐ Pass ☐ Fail | |
| 3 | Check "Credits Used" widget | Shows total spent amount | ☐ Pass ☐ Fail | |
| 4 | Check "Pending Payments" widget | Shows pending transaction count | ☐ Pass ☐ Fail | |
| 5 | Check "Active Courses" widget | Shows enrolled courses count | ☐ Pass ☐ Fail | |
| 6 | Verify percentage indicators | Change % visible (green/red) | ☐ Pass ☐ Fail | |
| 7 | Verify icons | Each widget has appropriate icon | ☐ Pass ☐ Fail | |
| 8 | Hover over widgets | Hover effect visible | ☐ Pass ☐ Fail | |

**Expected Outcome:** All four stat widgets display correct data with visual indicators

---

### TC-DASH-004: Recent Transactions Display
**Priority:** Medium  
**Prerequisite:** User has transaction history

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Scroll to Recent Transactions section | Section visible on dashboard | ☐ Pass ☐ Fail | |
| 2 | Check transaction table | Shows last 5-10 transactions | ☐ Pass ☐ Fail | |
| 3 | Verify table columns | Date, Description, Type, Amount, Balance visible | ☐ Pass ☐ Fail | |
| 4 | Check transaction status badges | Color-coded badges (Completed/Pending/Failed) | ☐ Pass ☐ Fail | |
| 5 | Verify quick filter buttons | "All", "Credits", "Payments" buttons visible | ☐ Pass ☐ Fail | |
| 6 | Click "Credits" filter | Only credit transactions shown | ☐ Pass ☐ Fail | |
| 7 | Click "Payments" filter | Only payment transactions shown | ☐ Pass ☐ Fail | |
| 8 | Click "View All Transactions" link | Redirects to full transaction history page | ☐ Pass ☐ Fail | |

**Expected Outcome:** Recent transactions display correctly with functional filters

---

### TC-DASH-005: Course Enrollment Widget
**Priority:** Medium  
**Prerequisite:** User has enrolled courses

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Locate Course Enrollment widget | Widget visible on dashboard | ☐ Pass ☐ Fail | |
| 2 | Check course list | Active/upcoming courses displayed | ☐ Pass ☐ Fail | |
| 3 | Verify course details | Course name, institution, start date visible | ☐ Pass ☐ Fail | |
| 4 | Check enrollment status | Status indicator shown for each course | ☐ Pass ☐ Fail | |
| 5 | Verify payment status | Payment status visible (Paid/Pending) | ☐ Pass ☐ Fail | |
| 6 | Click "Browse Courses" link | Redirects to course catalog | ☐ Pass ☐ Fail | |

**Expected Outcome:** Course enrollment widget displays enrolled courses with status

---

### TC-DASH-006: Notifications Panel
**Priority:** Medium  
**Prerequisite:** System has notifications

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Locate notifications panel | Panel visible on dashboard | ☐ Pass ☐ Fail | |
| 2 | Check notification bell icon | Shows count badge if unread exist | ☐ Pass ☐ Fail | |
| 3 | Click notification bell | Dropdown/panel expands | ☐ Pass ☐ Fail | |
| 4 | Verify notification types | Announcements, deadlines, top-ups visible | ☐ Pass ☐ Fail | |
| 5 | Check notification content | Each notification has title and description | ☐ Pass ☐ Fail | |
| 6 | Click on a notification | Opens detailed view or relevant page | ☐ Pass ☐ Fail | |
| 7 | Mark notification as read | Read status updates | ☐ Pass ☐ Fail | |
| 8 | Check "View All" option | Opens full notifications page | ☐ Pass ☐ Fail | |

**Expected Outcome:** Notifications panel displays and manages notifications correctly

---

## Account Balance Features

### TC-BAL-001: View Current Balance
**Priority:** High  
**Prerequisite:** User logged in with account balance

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Click "Account Balance" from menu | Balance page loads | ☐ Pass ☐ Fail | |
| 2 | Verify current balance display | Large, prominent balance shown in SGD | ☐ Pass ☐ Fail | |
| 3 | Check balance breakdown section | Government, personal, employer credits shown | ☐ Pass ☐ Fail | |
| 4 | Verify lifetime credits | Total credits received displayed | ☐ Pass ☐ Fail | |
| 5 | Check credits utilized | Total amount spent displayed | ☐ Pass ☐ Fail | |
| 6 | Verify reserved amounts | Pending payment amounts shown | ☐ Pass ☐ Fail | |

**Expected Outcome:** Balance page displays comprehensive account balance information

---

### TC-BAL-002: Balance Visualization Charts
**Priority:** Medium  
**Prerequisite:** User has transaction history

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to Balance page | Page loads with charts | ☐ Pass ☐ Fail | |
| 2 | Check monthly spending chart | Bar chart displays with data | ☐ Pass ☐ Fail | |
| 3 | Verify chart labels | X-axis (months) and Y-axis (amount) labeled | ☐ Pass ☐ Fail | |
| 4 | Check credit vs debit pie chart | Pie chart shows proportion | ☐ Pass ☐ Fail | |
| 5 | Verify chart legend | Legend identifies each segment | ☐ Pass ☐ Fail | |
| 6 | Hover over chart elements | Tooltip shows detailed information | ☐ Pass ☐ Fail | |
| 7 | Check year-over-year graph | Comparison line graph visible | ☐ Pass ☐ Fail | |
| 8 | Verify category breakdown chart | Spending by category displayed | ☐ Pass ☐ Fail | |

**Expected Outcome:** All charts render correctly with accurate data visualization

---

### TC-BAL-003: Balance Alerts Configuration
**Priority:** Medium  
**Prerequisite:** User on balance page

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to Balance page | Page loads successfully | ☐ Pass ☐ Fail | |
| 2 | Locate "Alerts" or "Notifications" section | Section visible | ☐ Pass ☐ Fail | |
| 3 | Click "Set Low Balance Alert" | Modal/form opens | ☐ Pass ☐ Fail | |
| 4 | Enter threshold amount (e.g., 100) | System accepts numeric input | ☐ Pass ☐ Fail | |
| 5 | Select notification method (Email/SMS) | Options available and selectable | ☐ Pass ☐ Fail | |
| 6 | Click "Save" or "Set Alert" | Confirmation message appears | ☐ Pass ☐ Fail | |
| 7 | Verify alert is saved | Alert appears in alerts list | ☐ Pass ☐ Fail | |
| 8 | Test edit alert | Can modify threshold and method | ☐ Pass ☐ Fail | |
| 9 | Test delete alert | Alert can be removed | ☐ Pass ☐ Fail | |

**Expected Outcome:** User can set, edit, and delete balance alerts successfully

---

## Course Payment Features

### TC-PAY-001: Browse Course Catalog
**Priority:** High  
**Prerequisite:** User logged in

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Click "Pay Course Fees" from menu | Course catalog page loads | ☐ Pass ☐ Fail | |
| 2 | Verify course list display | Multiple courses shown in grid/list | ☐ Pass ☐ Fail | |
| 3 | Check course cards | Each shows name, provider, price, duration | ☐ Pass ☐ Fail | |
| 4 | Use search bar | Search functionality works | ☐ Pass ☐ Fail | |
| 5 | Test filter by price range | Courses filter correctly | ☐ Pass ☐ Fail | |
| 6 | Test filter by duration | Courses filter correctly | ☐ Pass ☐ Fail | |
| 7 | Test filter by location | Courses filter correctly | ☐ Pass ☐ Fail | |
| 8 | Test filter by start date | Courses filter correctly | ☐ Pass ☐ Fail | |
| 9 | Apply multiple filters | All filters work together | ☐ Pass ☐ Fail | |
| 10 | Clear all filters | All courses displayed again | ☐ Pass ☐ Fail | |

**Expected Outcome:** Course catalog displays and filters work correctly

---

### TC-PAY-002: View Course Details
**Priority:** High  
**Prerequisite:** User on course catalog page

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Click on a course card | Course detail page opens | ☐ Pass ☐ Fail | |
| 2 | Check course description | Full description visible | ☐ Pass ☐ Fail | |
| 3 | Verify course provider | Institution name displayed | ☐ Pass ☐ Fail | |
| 4 | Check course fees | Fee breakdown shown | ☐ Pass ☐ Fail | |
| 5 | Verify eligibility criteria | Eligibility requirements listed | ☐ Pass ☐ Fail | |
| 6 | Check duration information | Start date, end date, hours visible | ☐ Pass ☐ Fail | |
| 7 | View course syllabus | Syllabus/outline available | ☐ Pass ☐ Fail | |
| 8 | Check reviews section | User reviews and ratings visible | ☐ Pass ☐ Fail | |
| 9 | Verify "Enroll Now" button | Button clearly visible | ☐ Pass ☐ Fail | |
| 10 | Test "Add to Wishlist" | Course added to wishlist | ☐ Pass ☐ Fail | |

**Expected Outcome:** Course details page displays comprehensive information

---

### TC-PAY-003: Payment Process - Education Account
**Priority:** Critical  
**Prerequisite:** User has sufficient balance, course selected

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Click "Enroll Now" on course | Payment page loads | ☐ Pass ☐ Fail | |
| 2 | Review course summary | Course name, price visible | ☐ Pass ☐ Fail | |
| 3 | Check available balance | Current balance displayed | ☐ Pass ☐ Fail | |
| 4 | Select "Education Account" payment | Option selected, balance updated preview | ☐ Pass ☐ Fail | |
| 5 | Review payment summary | Total, balance after payment shown | ☐ Pass ☐ Fail | |
| 6 | Check terms and conditions | Checkbox and link to T&C visible | ☐ Pass ☐ Fail | |
| 7 | Accept T&C | Checkbox can be checked | ☐ Pass ☐ Fail | |
| 8 | Click "Confirm Payment" | Processing indicator appears | ☐ Pass ☐ Fail | |
| 9 | Wait for confirmation | Success message displays | ☐ Pass ☐ Fail | |
| 10 | Verify confirmation details | Transaction ID, receipt visible | ☐ Pass ☐ Fail | |
| 11 | Check email notification | Confirmation email received | ☐ Pass ☐ Fail | |
| 12 | Download receipt | PDF receipt downloads | ☐ Pass ☐ Fail | |

**Expected Outcome:** Payment completes successfully using education account balance

---

### TC-PAY-004: Payment Process - Insufficient Balance
**Priority:** High  
**Prerequisite:** Course fee exceeds account balance

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Select course with fee > balance | Course detail page opens | ☐ Pass ☐ Fail | |
| 2 | Click "Enroll Now" | Payment page loads | ☐ Pass ☐ Fail | |
| 3 | Select "Education Account" | System shows insufficient balance message | ☐ Pass ☐ Fail | |
| 4 | Check alternative payment options | Other methods (card, PayNow) available | ☐ Pass ☐ Fail | |
| 5 | Check split payment option | "Split Payment" option visible | ☐ Pass ☐ Fail | |
| 6 | Select split payment | Form shows balance + additional amount needed | ☐ Pass ☐ Fail | |
| 7 | Verify calculations | System correctly calculates amounts | ☐ Pass ☐ Fail | |

**Expected Outcome:** System handles insufficient balance gracefully with alternatives

---

### TC-PAY-005: Payment with Credit/Debit Card
**Priority:** High  
**Prerequisite:** User opts for card payment

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to payment page | Payment options displayed | ☐ Pass ☐ Fail | |
| 2 | Select "Credit/Debit Card" | Card input form appears | ☐ Pass ☐ Fail | |
| 3 | Enter card number | Field accepts 16 digits | ☐ Pass ☐ Fail | |
| 4 | Enter expiry date | MM/YY format validation | ☐ Pass ☐ Fail | |
| 5 | Enter CVV | 3-digit field, masked input | ☐ Pass ☐ Fail | |
| 6 | Enter cardholder name | Field accepts text | ☐ Pass ☐ Fail | |
| 7 | Check "Save card" option | Checkbox available | ☐ Pass ☐ Fail | |
| 8 | Click "Pay Now" | Processing indicator shows | ☐ Pass ☐ Fail | |
| 9 | Complete 3D Secure (if applicable) | Redirects to bank page | ☐ Pass ☐ Fail | |
| 10 | Return to site | Payment confirmation displays | ☐ Pass ☐ Fail | |

**Expected Outcome:** Card payment processes successfully with proper validation

---

### TC-PAY-006: Payment with PayNow
**Priority:** Medium  
**Prerequisite:** User opts for PayNow

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to payment page | Payment options displayed | ☐ Pass ☐ Fail | |
| 2 | Select "PayNow" | PayNow instructions appear | ☐ Pass ☐ Fail | |
| 3 | View QR code | QR code generated and displayed | ☐ Pass ☐ Fail | |
| 4 | Check payment details | Amount, reference number visible | ☐ Pass ☐ Fail | |
| 5 | Verify countdown timer | Timer shows for payment window | ☐ Pass ☐ Fail | |
| 6 | Check status updates | Page shows "Waiting for payment" status | ☐ Pass ☐ Fail | |
| 7 | (Simulate payment) | Status updates to "Payment received" | ☐ Pass ☐ Fail | |
| 8 | Verify confirmation | Success message and details shown | ☐ Pass ☐ Fail | |

**Expected Outcome:** PayNow payment flow works with QR code and status updates

---

### TC-PAY-007: Wishlist Functionality
**Priority:** Low  
**Prerequisite:** User browsing courses

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Browse course catalog | Multiple courses displayed | ☐ Pass ☐ Fail | |
| 2 | Click "Add to Wishlist" icon on course | Heart/bookmark icon fills | ☐ Pass ☐ Fail | |
| 3 | Navigate to "My Wishlist" | Wishlist page displays | ☐ Pass ☐ Fail | |
| 4 | Verify course appears | Added course visible in list | ☐ Pass ☐ Fail | |
| 5 | Add multiple courses | All courses appear in wishlist | ☐ Pass ☐ Fail | |
| 6 | Remove course from wishlist | Course removed successfully | ☐ Pass ☐ Fail | |
| 7 | Click course from wishlist | Opens course detail page | ☐ Pass ☐ Fail | |
| 8 | Enroll from wishlist | Can proceed to payment | ☐ Pass ☐ Fail | |

**Expected Outcome:** Wishlist allows users to save and manage course interests

---

## Transaction History

### TC-TRANS-001: View Transaction List
**Priority:** High  
**Prerequisite:** User has transaction history

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Click "Transactions" from menu | Transaction history page loads | ☐ Pass ☐ Fail | |
| 2 | Check table columns | Date, Type, Amount, Balance, Status visible | ☐ Pass ☐ Fail | |
| 3 | Verify all transactions display | Complete list shown (paginated if needed) | ☐ Pass ☐ Fail | |
| 4 | Check transaction types | Credits and debits color-coded | ☐ Pass ☐ Fail | |
| 5 | Verify status badges | Completed/Pending/Failed badges displayed | ☐ Pass ☐ Fail | |
| 6 | Check running balance | Balance column shows after each transaction | ☐ Pass ☐ Fail | |
| 7 | Test pagination (if applicable) | Can navigate through pages | ☐ Pass ☐ Fail | |

**Expected Outcome:** Transaction history displays complete and accurate list

---

### TC-TRANS-002: Filter Transactions by Date
**Priority:** High  
**Prerequisite:** User on transaction history page

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Locate date filter section | Date range picker visible | ☐ Pass ☐ Fail | |
| 2 | Click "Last 7 days" quick filter | Transactions filtered to last week | ☐ Pass ☐ Fail | |
| 3 | Click "This month" quick filter | Transactions filtered to current month | ☐ Pass ☐ Fail | |
| 4 | Click "This year" quick filter | Transactions filtered to current year | ☐ Pass ☐ Fail | |
| 5 | Click "Custom range" | Date picker opens | ☐ Pass ☐ Fail | |
| 6 | Select start date | Date selected in picker | ☐ Pass ☐ Fail | |
| 7 | Select end date | Date range set | ☐ Pass ☐ Fail | |
| 8 | Click "Apply" | Transactions filtered to date range | ☐ Pass ☐ Fail | |
| 9 | Verify results | Only transactions in range displayed | ☐ Pass ☐ Fail | |
| 10 | Click "Clear filters" | All transactions displayed again | ☐ Pass ☐ Fail | |

**Expected Outcome:** Date filtering works accurately for all options

---

### TC-TRANS-003: Filter by Transaction Type
**Priority:** Medium  
**Prerequisite:** User has mixed transaction types

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to transaction history | Full list displays | ☐ Pass ☐ Fail | |
| 2 | Locate type filter dropdown | Filter options visible | ☐ Pass ☐ Fail | |
| 3 | Select "Credits" filter | Only credit transactions shown | ☐ Pass ☐ Fail | |
| 4 | Verify credit transactions | All shown transactions are credits | ☐ Pass ☐ Fail | |
| 5 | Select "Debits" filter | Only debit transactions shown | ☐ Pass ☐ Fail | |
| 6 | Verify debit transactions | All shown transactions are debits | ☐ Pass ☐ Fail | |
| 7 | Select "All" filter | All transactions displayed | ☐ Pass ☐ Fail | |

**Expected Outcome:** Type filter correctly segregates transactions

---

### TC-TRANS-004: Search Transactions
**Priority:** Medium  
**Prerequisite:** User has transaction history

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to transaction history | Page loads with search bar | ☐ Pass ☐ Fail | |
| 2 | Enter course name in search | Matching transactions appear | ☐ Pass ☐ Fail | |
| 3 | Clear search, enter provider name | Matching transactions appear | ☐ Pass ☐ Fail | |
| 4 | Clear search, enter transaction ID | Specific transaction appears | ☐ Pass ☐ Fail | |
| 5 | Enter non-existent term | "No results found" message shows | ☐ Pass ☐ Fail | |
| 6 | Test partial search | Partial matches appear | ☐ Pass ☐ Fail | |
| 7 | Test case insensitive | Search works regardless of case | ☐ Pass ☐ Fail | |

**Expected Outcome:** Search functionality finds transactions accurately

---

### TC-TRANS-005: View Transaction Details
**Priority:** High  
**Prerequisite:** User has transactions

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to transaction history | Transactions listed | ☐ Pass ☐ Fail | |
| 2 | Click on a transaction row | Detail modal/page opens | ☐ Pass ☐ Fail | |
| 3 | Verify transaction ID | ID number visible | ☐ Pass ☐ Fail | |
| 4 | Check date and time | Full timestamp with timezone | ☐ Pass ☐ Fail | |
| 5 | Verify amount | Amount in SGD displayed | ☐ Pass ☐ Fail | |
| 6 | Check transaction type | Type and category shown | ☐ Pass ☐ Fail | |
| 7 | Verify course details (if payment) | Course name and provider visible | ☐ Pass ☐ Fail | |
| 8 | Check payment method | Method used displayed | ☐ Pass ☐ Fail | |
| 9 | Verify running balance | Balance after transaction shown | ☐ Pass ☐ Fail | |
| 10 | Check for notes/remarks | Any additional info visible | ☐ Pass ☐ Fail | |
| 11 | Test "Download Receipt" button | Receipt downloads as PDF | ☐ Pass ☐ Fail | |

**Expected Outcome:** Transaction details show comprehensive information

---

### TC-TRANS-006: Export Transaction History
**Priority:** Medium  
**Prerequisite:** User has transactions

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to transaction history | Page displays with export options | ☐ Pass ☐ Fail | |
| 2 | Click "Export" or "Download" button | Export options menu appears | ☐ Pass ☐ Fail | |
| 3 | Select "Export as PDF" | PDF generation starts | ☐ Pass ☐ Fail | |
| 4 | Verify PDF download | File downloads successfully | ☐ Pass ☐ Fail | |
| 5 | Open PDF file | Transactions formatted correctly | ☐ Pass ☐ Fail | |
| 6 | Select "Export as Excel" | Excel file downloads | ☐ Pass ☐ Fail | |
| 7 | Open Excel file | Data properly formatted in columns | ☐ Pass ☐ Fail | |
| 8 | Select "Export as CSV" | CSV file downloads | ☐ Pass ☐ Fail | |
| 9 | Open CSV file | Data comma-separated correctly | ☐ Pass ☐ Fail | |
| 10 | Test "Email Statement" | Email sent to registered address | ☐ Pass ☐ Fail | |

**Expected Outcome:** Export functionality works for all file formats

---

## Profile Management

### TC-PROF-001: View Profile Information
**Priority:** High  
**Prerequisite:** User logged in

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Click profile icon in header | Dropdown menu appears | ☐ Pass ☐ Fail | |
| 2 | Click "Profile Settings" | Profile page loads | ☐ Pass ☐ Fail | |
| 3 | Verify personal details section | Name, NRIC, DOB, gender visible | ☐ Pass ☐ Fail | |
| 4 | Check contact information | Phone, email, address displayed | ☐ Pass ☐ Fail | |
| 5 | Verify read-only fields | NRIC, DOB, nationality not editable | ☐ Pass ☐ Fail | |
| 6 | Check profile photo | Photo displayed or placeholder shown | ☐ Pass ☐ Fail | |

**Expected Outcome:** Profile information displays correctly with proper field states

---

### TC-PROF-002: Update Contact Information
**Priority:** High  
**Prerequisite:** User on profile settings page

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to Profile Settings | Page loads with contact section | ☐ Pass ☐ Fail | |
| 2 | Click "Edit" on mobile number | Field becomes editable | ☐ Pass ☐ Fail | |
| 3 | Enter new mobile number | System accepts 8-digit Singapore number | ☐ Pass ☐ Fail | |
| 4 | Click "Save" | OTP verification prompt appears | ☐ Pass ☐ Fail | |
| 5 | Enter OTP code | System validates OTP | ☐ Pass ☐ Fail | |
| 6 | Verify update | Success message displays | ☐ Pass ☐ Fail | |
| 7 | Check updated number | New number shown in profile | ☐ Pass ☐ Fail | |
| 8 | Repeat for email address | Email update with verification works | ☐ Pass ☐ Fail | |
| 9 | Update residential address | Address saved successfully | ☐ Pass ☐ Fail | |

**Expected Outcome:** Contact information updates with proper verification

---

### TC-PROF-003: Change Password
**Priority:** Critical  
**Prerequisite:** User on profile settings

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to Security Settings | Security section visible | ☐ Pass ☐ Fail | |
| 2 | Click "Change Password" | Password change form opens | ☐ Pass ☐ Fail | |
| 3 | Enter current password | Field accepts input | ☐ Pass ☐ Fail | |
| 4 | Enter new password | Field validates password strength | ☐ Pass ☐ Fail | |
| 5 | Check password requirements | Requirements shown (min length, complexity) | ☐ Pass ☐ Fail | |
| 6 | Enter weak password | Error message displays | ☐ Pass ☐ Fail | |
| 7 | Enter strong password | Validation passes | ☐ Pass ☐ Fail | |
| 8 | Re-enter new password | Confirmation field matches | ☐ Pass ☐ Fail | |
| 9 | Enter non-matching password | Error "Passwords don't match" shows | ☐ Pass ☐ Fail | |
| 10 | Correct and submit | Success message appears | ☐ Pass ☐ Fail | |
| 11 | Logout and login with new password | Login successful | ☐ Pass ☐ Fail | |

**Expected Outcome:** Password change works with proper validation and security

---

### TC-PROF-004: Enable Two-Factor Authentication
**Priority:** High  
**Prerequisite:** 2FA not yet enabled

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to Security Settings | 2FA section visible | ☐ Pass ☐ Fail | |
| 2 | Click "Enable 2FA" | Setup wizard/modal opens | ☐ Pass ☐ Fail | |
| 3 | Choose 2FA method (SMS/Authenticator) | Options available | ☐ Pass ☐ Fail | |
| 4 | Select SMS option | Phone number confirmation shown | ☐ Pass ☐ Fail | |
| 5 | Request verification code | Code sent to registered number | ☐ Pass ☐ Fail | |
| 6 | Enter verification code | Code validates | ☐ Pass ☐ Fail | |
| 7 | Complete setup | Success message and backup codes shown | ☐ Pass ☐ Fail | |
| 8 | Save backup codes | Option to download/print codes | ☐ Pass ☐ Fail | |
| 9 | Logout and login again | 2FA prompt appears after password | ☐ Pass ☐ Fail | |
| 10 | Enter 2FA code | Login completes successfully | ☐ Pass ☐ Fail | |

**Expected Outcome:** 2FA setup and login works correctly

---

### TC-PROF-005: Update Notification Preferences
**Priority:** Medium  
**Prerequisite:** User on profile settings

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to Notification Settings | Notification preferences section visible | ☐ Pass ☐ Fail | |
| 2 | View email notification options | List of notification types shown | ☐ Pass ☐ Fail | |
| 3 | Toggle "Transaction confirmations" | Switch turns on/off | ☐ Pass ☐ Fail | |
| 4 | Toggle "Top-up notifications" | Switch turns on/off | ☐ Pass ☐ Fail | |
| 5 | Toggle "Low balance alerts" | Switch turns on/off | ☐ Pass ☐ Fail | |
| 6 | Select notification frequency | Dropdown with Instant/Daily/Weekly options | ☐ Pass ☐ Fail | |
| 7 | Choose "Daily digest" | Selection saved | ☐ Pass ☐ Fail | |
| 8 | Click "Save Preferences" | Success message displays | ☐ Pass ☐ Fail | |
| 9 | Refresh page | Preferences persist | ☐ Pass ☐ Fail | |

**Expected Outcome:** Notification preferences update and save correctly

---

### TC-PROF-006: Upload Profile Photo
**Priority:** Low  
**Prerequisite:** User on profile settings

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to Profile Settings | Profile photo section visible | ☐ Pass ☐ Fail | |
| 2 | Click "Upload Photo" or photo area | File picker opens | ☐ Pass ☐ Fail | |
| 3 | Select invalid file (e.g., PDF) | Error message shows | ☐ Pass ☐ Fail | |
| 4 | Select valid image (JPG/PNG) | Image preview appears | ☐ Pass ☐ Fail | |
| 5 | Check file size limit | Large files (>5MB) rejected | ☐ Pass ☐ Fail | |
| 6 | Crop/adjust image (if available) | Crop tool works | ☐ Pass ☐ Fail | |
| 7 | Click "Save" or "Upload" | Upload progress shows | ☐ Pass ☐ Fail | |
| 8 | Verify upload completion | New photo displays in profile | ☐ Pass ☐ Fail | |
| 9 | Check photo in header | Photo updates in navigation | ☐ Pass ☐ Fail | |
| 10 | Test "Remove Photo" | Photo removed, placeholder shown | ☐ Pass ☐ Fail | |

**Expected Outcome:** Profile photo upload works with proper validation

---

## Navigation & Usability

### TC-NAV-001: Sidebar Navigation
**Priority:** High  
**Prerequisite:** User logged in

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | View sidebar menu | All menu items visible | ☐ Pass ☐ Fail | |
| 2 | Click "Dashboard" | Navigates to dashboard | ☐ Pass ☐ Fail | |
| 3 | Click "Account Balance" | Navigates to balance page | ☐ Pass ☐ Fail | |
| 4 | Click "Pay Course Fees" | Navigates to course catalog | ☐ Pass ☐ Fail | |
| 5 | Click "Transactions" | Navigates to transaction history | ☐ Pass ☐ Fail | |
| 6 | Click "My Courses" | Navigates to enrolled courses | ☐ Pass ☐ Fail | |
| 7 | Click "Profile Settings" | Navigates to profile page | ☐ Pass ☐ Fail | |
| 8 | Click "Help & Support" | Opens help center | ☐ Pass ☐ Fail | |
| 9 | Verify active state highlighting | Current page highlighted in menu | ☐ Pass ☐ Fail | |
| 10 | Test collapse sidebar (if available) | Sidebar collapses/expands | ☐ Pass ☐ Fail | |

**Expected Outcome:** All navigation links work and direct to correct pages

---

### TC-NAV-002: Breadcrumb Navigation
**Priority:** Medium  
**Prerequisite:** User on sub-page

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to transaction details | Breadcrumb appears | ☐ Pass ☐ Fail | |
| 2 | Verify breadcrumb trail | Shows: Home > Transactions > Details | ☐ Pass ☐ Fail | |
| 3 | Click "Transactions" in breadcrumb | Returns to transaction list | ☐ Pass ☐ Fail | |
| 4 | Click "Home" in breadcrumb | Returns to dashboard | ☐ Pass ☐ Fail | |
| 5 | Test on course details page | Breadcrumb shows full path | ☐ Pass ☐ Fail | |

**Expected Outcome:** Breadcrumbs provide accurate navigation trail

---

### TC-NAV-003: Global Search
**Priority:** Medium  
**Prerequisite:** User logged in

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Locate search bar in header | Search input visible | ☐ Pass ☐ Fail | |
| 2 | Click search bar | Input becomes active | ☐ Pass ☐ Fail | |
| 3 | Type course name | Autocomplete suggestions appear | ☐ Pass ☐ Fail | |
| 4 | Select suggestion | Navigates to course page | ☐ Pass ☐ Fail | |
| 5 | Search for transaction | Results include transactions | ☐ Pass ☐ Fail | |
| 6 | Search for help topic | Results include help articles | ☐ Pass ☐ Fail | |
| 7 | Enter non-existent term | "No results" message shows | ☐ Pass ☐ Fail | |
| 8 | Test keyboard shortcut (Ctrl+K) | Search activates | ☐ Pass ☐ Fail | |
| 9 | Test ESC key | Search closes | ☐ Pass ☐ Fail | |

**Expected Outcome:** Global search finds relevant content across portal

---

## Security & Access Control

### TC-SEC-001: Session Timeout
**Priority:** High  
**Prerequisite:** User logged in

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Login to system | Dashboard displays | ☐ Pass ☐ Fail | |
| 2 | Leave browser idle for configured time | System should timeout (typically 15-30 min) | ☐ Pass ☐ Fail | |
| 3 | Attempt to interact | Session expired message appears | ☐ Pass ☐ Fail | |
| 4 | Verify redirect to login | Login page displays | ☐ Pass ☐ Fail | |
| 5 | Check session data cleared | Previous data not accessible | ☐ Pass ☐ Fail | |

**Expected Outcome:** Session times out after inactivity period

---

### TC-SEC-002: Auto-logout Warning
**Priority:** Medium  
**Prerequisite:** User logged in

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Login to system | Dashboard displays | ☐ Pass ☐ Fail | |
| 2 | Wait until near timeout | Warning modal appears (e.g., 2 min before) | ☐ Pass ☐ Fail | |
| 3 | Check warning message | "Session expiring soon" message shown | ☐ Pass ☐ Fail | |
| 4 | Verify countdown timer | Timer counts down | ☐ Pass ☐ Fail | |
| 5 | Click "Continue Session" | Session extends, modal closes | ☐ Pass ☐ Fail | |
| 6 | Trigger warning again | Wait and let it expire | ☐ Pass ☐ Fail | |
| 7 | Don't click continue | Auto-logout occurs | ☐ Pass ☐ Fail | |

**Expected Outcome:** User receives warning before auto-logout

---

### TC-SEC-003: Concurrent Session Handling
**Priority:** Medium  
**Prerequisite:** User account

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Login on Browser A | Dashboard displays | ☐ Pass ☐ Fail | |
| 2 | Open Browser B (or incognito) | Login page visible | ☐ Pass ☐ Fail | |
| 3 | Login with same credentials | Dashboard displays in Browser B | ☐ Pass ☐ Fail | |
| 4 | Return to Browser A | Session still active OR warning appears | ☐ Pass ☐ Fail | |
| 5 | Attempt action in Browser A | Action completes OR session invalid message | ☐ Pass ☐ Fail | |

**Expected Outcome:** System handles multiple sessions per policy

---

### TC-SEC-004: Login History
**Priority:** Medium  
**Prerequisite:** User with login history

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to Security Settings | Security page loads | ☐ Pass ☐ Fail | |
| 2 | Locate "Login History" section | Section visible | ☐ Pass ☐ Fail | |
| 3 | View login attempts | List of recent logins shown | ☐ Pass ☐ Fail | |
| 4 | Check login details | Date, time, IP address, location visible | ☐ Pass ☐ Fail | |
| 5 | Verify device information | Device/browser type shown | ☐ Pass ☐ Fail | |
| 6 | Check successful vs failed | Status indicated for each attempt | ☐ Pass ☐ Fail | |
| 7 | Test "Report suspicious activity" | Reporting mechanism available | ☐ Pass ☐ Fail | |

**Expected Outcome:** Login history provides comprehensive activity log

---

## Responsive Design

### TC-RESP-001: Mobile View (Portrait)
**Priority:** High  
**Prerequisite:** Access to mobile device or browser dev tools

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Open portal on mobile (portrait) | Site loads and is readable | ☐ Pass ☐ Fail | |
| 2 | Check navigation menu | Hamburger menu appears | ☐ Pass ☐ Fail | |
| 3 | Tap hamburger menu | Menu expands/slides in | ☐ Pass ☐ Fail | |
| 4 | View dashboard widgets | Widgets stack vertically | ☐ Pass ☐ Fail | |
| 5 | Check text readability | Text size appropriate, no horizontal scroll | ☐ Pass ☐ Fail | |
| 6 | Test button sizes | Buttons are touch-friendly (44x44px min) | ☐ Pass ☐ Fail | |
| 7 | Verify forms | Form fields easy to tap and fill | ☐ Pass ☐ Fail | |
| 8 | Check tables | Tables scrollable or responsive | ☐ Pass ☐ Fail | |
| 9 | Test payment flow | Can complete payment on mobile | ☐ Pass ☐ Fail | |

**Expected Outcome:** Portal fully functional on mobile portrait view

---

### TC-RESP-002: Tablet View
**Priority:** Medium  
**Prerequisite:** Access to tablet or browser dev tools

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Open portal on tablet | Site loads optimally | ☐ Pass ☐ Fail | |
| 2 | Check layout adaptation | Layout adjusts for tablet screen | ☐ Pass ☐ Fail | |
| 3 | Verify sidebar behavior | Sidebar may be persistent or collapsible | ☐ Pass ☐ Fail | |
| 4 | Test touch interactions | All touch gestures work | ☐ Pass ☐ Fail | |
| 5 | Rotate device | Layout adapts to landscape/portrait | ☐ Pass ☐ Fail | |
| 6 | Check dashboard grid | Widgets arrange appropriately | ☐ Pass ☐ Fail | |
| 7 | Test all main features | Core functionality works on tablet | ☐ Pass ☐ Fail | |

**Expected Outcome:** Portal provides optimal tablet experience

---

### TC-RESP-003: Desktop View - Various Resolutions
**Priority:** High  
**Prerequisite:** Desktop browser

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | View at 1920x1080 | Layout fills screen appropriately | ☐ Pass ☐ Fail | |
| 2 | View at 1366x768 | All content visible, no cut-off | ☐ Pass ☐ Fail | |
| 3 | View at 1280x720 | Layout remains functional | ☐ Pass ☐ Fail | |
| 4 | Test responsive breakpoints | Layout changes smoothly | ☐ Pass ☐ Fail | |
| 5 | Verify max-width containers | Content centered on ultra-wide screens | ☐ Pass ☐ Fail | |

**Expected Outcome:** Portal works across common desktop resolutions

---

## Accessibility Testing

### TC-ACCESS-001: Keyboard Navigation
**Priority:** High  
**Prerequisite:** Desktop browser

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to login page | Page loads | ☐ Pass ☐ Fail | |
| 2 | Press Tab key | Focus moves to username field | ☐ Pass ☐ Fail | |
| 3 | Press Tab again | Focus moves to password field | ☐ Pass ☐ Fail | |
| 4 | Press Tab again | Focus moves to login button | ☐ Pass ☐ Fail | |
| 5 | Press Enter on button | Login action triggers | ☐ Pass ☐ Fail | |
| 6 | After login, use Tab to navigate | Can access all interactive elements | ☐ Pass ☐ Fail | |
| 7 | Test Shift+Tab | Focus moves backward | ☐ Pass ☐ Fail | |
| 8 | Verify focus indicators | Visible outline/highlight on focused elements | ☐ Pass ☐ Fail | |
| 9 | Test dropdown menus | Arrow keys navigate menu items | ☐ Pass ☐ Fail | |
| 10 | Test ESC key | Closes modals/dropdowns | ☐ Pass ☐ Fail | |

**Expected Outcome:** All functionality accessible via keyboard

---

### TC-ACCESS-002: Screen Reader Compatibility
**Priority:** High  
**Prerequisite:** Screen reader software (NVDA, JAWS, VoiceOver)

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Enable screen reader | Screen reader active | ☐ Pass ☐ Fail | |
| 2 | Navigate to login page | Page structure announced | ☐ Pass ☐ Fail | |
| 3 | Tab to username field | "Username, edit text" announced | ☐ Pass ☐ Fail | |
| 4 | Tab to password field | "Password, edit text" announced | ☐ Pass ☐ Fail | |
| 5 | Navigate dashboard | All widgets have descriptive labels | ☐ Pass ☐ Fail | |
| 6 | Check images | Alt text provided for all images | ☐ Pass ☐ Fail | |
| 7 | Check buttons | Button purposes clearly announced | ☐ Pass ☐ Fail | |
| 8 | Test forms | Form labels properly associated | ☐ Pass ☐ Fail | |
| 9 | Check error messages | Errors announced when they occur | ☐ Pass ☐ Fail | |
| 10 | Verify headings | Heading hierarchy logical (H1, H2, H3) | ☐ Pass ☐ Fail | |

**Expected Outcome:** Portal fully compatible with screen readers

---

### TC-ACCESS-003: Color Contrast
**Priority:** Medium  
**Prerequisite:** Browser with accessibility tools

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Use contrast checker tool | Tool ready | ☐ Pass ☐ Fail | |
| 2 | Check body text on background | Contrast ratio ≥ 4.5:1 (AA standard) | ☐ Pass ☐ Fail | |
| 3 | Check headings | Contrast ratio ≥ 4.5:1 | ☐ Pass ☐ Fail | |
| 4 | Check button text | Contrast ratio ≥ 4.5:1 | ☐ Pass ☐ Fail | |
| 5 | Check link colors | Distinguishable from body text | ☐ Pass ☐ Fail | |
| 6 | Check error messages | High contrast, clearly visible | ☐ Pass ☐ Fail | |
| 7 | Test high contrast mode | Enable OS high contrast, site remains usable | ☐ Pass ☐ Fail | |
| 8 | Check focus indicators | Contrast ratio ≥ 3:1 | ☐ Pass ☐ Fail | |

**Expected Outcome:** Color contrast meets WCAG AA standards

---

### TC-ACCESS-004: Text Scaling
**Priority:** Medium  
**Prerequisite:** Desktop browser

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Set browser zoom to 100% | Site displays normally | ☐ Pass ☐ Fail | |
| 2 | Increase zoom to 150% | Content scales, remains readable | ☐ Pass ☐ Fail | |
| 3 | Increase zoom to 200% | Layout adapts, no content cut off | ☐ Pass ☐ Fail | |
| 4 | Check horizontal scrolling | Minimal or no horizontal scroll needed | ☐ Pass ☐ Fail | |
| 5 | Test font size setting (if available) | User can adjust font size | ☐ Pass ☐ Fail | |
| 6 | Verify all text scales | No fixed pixel fonts that don't scale | ☐ Pass ☐ Fail | |

**Expected Outcome:** Content remains accessible at various zoom levels

---

## Test Summary

### Test Coverage Summary

| Category | Total Tests | Pass | Fail | Not Tested | Coverage % |
|----------|-------------|------|------|------------|------------|
| Authentication & Login | 4 | | | | |
| Dashboard Functionality | 6 | | | | |
| Account Balance | 3 | | | | |
| Course Payment | 7 | | | | |
| Transaction History | 6 | | | | |
| Profile Management | 6 | | | | |
| Navigation & Usability | 3 | | | | |
| Security & Access Control | 4 | | | | |
| Responsive Design | 3 | | | | |
| Accessibility | 4 | | | | |
| **TOTAL** | **46** | | | | |

---

### Defect Log

| Defect ID | Test Case | Severity | Description | Status | Notes |
|-----------|-----------|----------|-------------|--------|-------|
| | | | | | |

**Severity Levels:**
- Critical: System crash, data loss, security breach
- High: Major functionality broken, no workaround
- Medium: Functionality impaired, workaround exists
- Low: Minor issue, cosmetic, or edge case

---

### Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | | | |
| Product Owner | | | |
| Developer Lead | | | |
| Business Analyst | | | |

---

### Notes & Recommendations

**General Observations:**
- [ ] Overall performance acceptable
- [ ] User experience intuitive
- [ ] Error handling appropriate
- [ ] Security measures adequate

**Recommendations:**
1. 
2. 
3. 

**Known Limitations:**
- Demo environment with limited data
- Some features may not be fully functional in test environment

---

*UAT Completed: [Date]*  
*Next Review: [Date]*  
*Version: 1.0*
