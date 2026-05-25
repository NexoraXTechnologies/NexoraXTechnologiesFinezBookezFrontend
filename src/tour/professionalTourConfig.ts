// src/tour/professionalTourConfig.js

export const professionalTourConfig = {
  "/professional": [
    {
      selector: "#professional-sidebar",
      title: "Navigation Menu",
      description:
        "Use this sidebar to access all sections of the professional dashboard.",
      position: "right",
    },
    {
      selector: "#professional-nav",
      title: "Top Bar",
      description:
        "This shows the current page title and gives access to profile actions.",
      position: "bottom",
    },
    {
      selector: ".profile",
      title: "Profile Card",
      description:
        "Here you can access your profile details and account-related options.",
      position: "bottom",
    },
  ],

  "/professional/documentmngt": [
    {
      selector: "#document-page-container",
      title: "Document Management Overview",
      description:
        "This is your main document management panel where you can view, search, upload, refresh and manage all documents.",
      position: "right",
    },
    {
      selector: "#document-summary-section",
      title: "Document Summary Overview",
      description:
        "This section displays a quick summary of all documents in the system.",
      position: "right",
    },
    {
      selector: "#summary-total-documents",
      title: "Total Documents",
      description:
        "Shows the total number of documents stored (active + deleted).",
      position: "bottom",
    },
    {
      selector: "#summary-active-documents",
      title: "Active Documents",
      description:
        "Shows the number of currently active documents available for use.",
      position: "bottom",
    },
    {
      selector: "#summary-deleted-documents",
      title: "Deleted Documents",
      description:
        "Shows how many documents were soft-deleted. These can be restored depending on admin controls.",
      position: "bottom",
    },
    {
      selector: "#document-search-input",
      title: "Search Documents",
      description:
        "You can search documents by owner ID or by name. Type something here and the results will update automatically.",
      position: "bottom",
    },
    {
      selector: "#document-upload-button",
      title: "Upload a Document",
      description:
        "Click here to upload a new document. Supported file types depend on your system settings.",
      position: "left",
    },
    {
      selector: "#task-refresh-button",
      title: "Refresh Document List",
      description:
        "Click to reload the latest Documents, useful when multiple users are updating tasks.",
      position: "left",
    },
    {
      selector: "#document-download-button",
      title: "Download a Document",
      description: "Click here to download a document.",
      position: "left",
    },
    {
      selector: "#document-delete-button",
      title: "Delete a Document",
      description:
        "Click here to remove a document. Deletion uses soft-delete and requires confirmation.",
      position: "left",
    },
    {
      selector: "#documentation-pagination",
      title: "Pagination Controls",
      description:
        "Use pagination to navigate through documents pages and adjust how many documents are displayed per page.",
      position: "top",
    },
  ],

  "/professional/taskmngt": [
    {
      selector: "#task-header",
      title: "Task Overview",
      description:
        "This section shows total tasks and provides controls for searching, refreshing, and adding new tasks.",
      position: "bottom",
    },
    {
      selector: "#task-search-input",
      title: "Search Tasks",
      description:
        "Search tasks by name or mobile. Results update automatically.",
      position: "bottom",
    },
    {
      selector: "#task-refresh-button",
      title: "Refresh Task List",
      description:
        "Click to reload the latest tasks, useful when multiple users are updating tasks.",
      position: "left",
    },
    {
      selector: "#task-add-button",
      title: "Add New Task",
      description:
        "Click here to create a new task with priority, due date, and assigned user.",
      position: "left",
    },
    {
      selector: "#task-edit-button",
      title: "Edit a Task",
      description:
        "Click here to edit task details, update priority, change due dates, or add remarks.",
      position: "left",
    },
    {
      selector: "#task-delete-button",
      title: "Delete a Task",
      description:
        "Click here to remove a task. Deletion uses soft-delete and requires confirmation.",
      position: "left",
    },
    {
      selector: "#task-pagination",
      title: "Pagination Controls",
      description:
        "Use pagination to navigate through task pages and adjust how many tasks are displayed per page.",
      position: "top",
    },
  ],

  "/professional/master/company": [
    {
      selector: "#company-header",
      title: "Company Master Overview",
      description:
        "This is the Company Master header, where you can refresh or update company details.",
      position: "bottom",
    },
    {
      selector: "#company-refresh-button",
      title: "Refresh Company Details",
      description:
        "Click to reload the latest company details from the server.",
      position: "left",
    },
    {
      selector: "#company-edit-button",
      title: "Create / Edit Company",
      description:
        "Click to create a new company record or edit existing company information.",
      position: "left",
    },
    {
      selector: "#company-details-box",
      title: "Company Details Overview",
      description:
        "This section displays all basic company information like name, email, mobile, address and bank details.",
      position: "top",
    },
    {
      selector: "#company-logo",
      title: "Company Logo",
      description:
        "This is the uploaded company logo. You can replace it when editing the company profile.",
      position: "right",
    },
    {
      selector: "#company-signature",
      title: "Authorized Signature",
      description:
        "This is the company signature used in PDFs and generated documents.",
      position: "right",
    },
  ],

  "/professional/master/account": [
    {
      selector: "#account-header",
      title: "Account Master Overview",
      description:
        "This section gives you access to search, refresh, and add new accounts.",
      position: "bottom",
    },
    {
      selector: "#account-summary",
      title: "Total Accounts",
      description:
        "This badge shows the total number of accounts in your system.",
      position: "bottom",
    },
    {
      selector: "#account-search-input",
      title: "Search Accounts",
      description:
        "Search accounts by name, mobile, email, or account code. Results update automatically.",
      position: "bottom",
    },
    {
      selector: "#account-refresh-button",
      title: "Refresh Accounts",
      description:
        "Click to reload the account list. Useful when multiple users are updating data.",
      position: "left",
    },
    {
      selector: "#account-add-button",
      title: "Add New Account",
      description:
        "Click here to create a new account with details like mobile, email, type, and more.",
      position: "left",
    },
    {
      selector: "#account-table-container",
      title: "Accounts Table",
      description:
        "All accounts appear here with details such as code, name, type, and contact information.",
      position: "top",
    },
    {
      selector: "#account-edit-button",
      title: "Edit Account",
      description:
        "Click here to edit account information, update contact details, or change account type.",
      position: "left",
    },
    {
      selector: "#account-delete-button",
      title: "Delete Account",
      description:
        "Click here to delete an account. A confirmation step will appear before deletion.",
      position: "left",
    },
    {
      selector: "#account-pagination",
      title: "Pagination Controls",
      description:
        "Use these buttons to navigate between pages of accounts and adjust the number of rows per page.",
      position: "top",
    },
  ],
  "/professional/master/product": [
    {
      selector: "#product-header",
      title: "Product Master Overview",
      description:
        "This section provides controls for searching, refreshing, and adding products.",
      position: "bottom",
    },
    {
      selector: "#product-summary",
      title: "Total Products",
      description:
        "This badge shows the total number of products available in your system.",
      position: "bottom",
    },
    {
      selector: "#product-search-input",
      title: "Search Products",
      description:
        "Search products by name, code, HSN, or description. Results update automatically.",
      position: "bottom",
    },
    {
      selector: "#product-refresh-button",
      title: "Refresh Product List",
      description:
        "Reloads the most recent product list. Helpful when data is updated by other users.",
      position: "left",
    },
    {
      selector: "#product-add-button",
      title: "Add New Product",
      description:
        "Click here to create a new product with details like code, HSN, and description.",
      position: "left",
    },
    {
      selector: "#product-table-container",
      title: "Products Table",
      description:
        "All products are displayed here with important details for easy management.",
      position: "top",
    },
    {
      selector: "#product-edit-button",
      title: "Edit Product",
      description:
        "Click here to update product details, such as name or HSN code.",
      position: "left",
    },
    {
      selector: "#product-delete-button",
      title: "Delete Product",
      description:
        "Click to delete a product. A confirmation step will appear before deletion.",
      position: "left",
    },
    {
      selector: "#product-pagination",
      title: "Pagination Controls",
      description:
        "Navigate between pages and choose how many products to display per page.",
      position: "top",
    },
  ],
  "/professional/users": [
    {
      selector: "#users-header",
      title: "User Management Overview",
      description:
        "Here you can search, refresh, and add new child users to your professional account.",
      position: "bottom",
    },
    {
      selector: "#users-search-input",
      title: "Search Users",
      description:
        "Search user records by name, email, mobile, Aadhar, or any matching field.",
      position: "bottom",
    },
    {
      selector: "#users-refresh-button",
      title: "Refresh User List",
      description:
        "Click to reload the latest user data. Useful if changes were recently made.",
      position: "left",
    },
    {
      selector: "#users-add-button",
      title: "Add Child User",
      description:
        "Click here to add a new child user under your professional account.",
      position: "left",
    },
    {
      selector: "#users-table-container",
      title: "User List Table",
      description:
        "All child users assigned under your professional account are displayed here.",
      position: "top",
    },
  ],
  "/professional/profile": [
    {
      selector: "#profile-section",
      title: "My Profile",
      description:
        "This section allows you to update your personal details including name, email, date of birth, PAN, and Aadhar.",
      position: "right",
    },
    {
      selector: "#profile-upload-button",
      title: "Upload Profile Photo",
      description: "Click here to upload or change your profile picture.",
      position: "left",
    },
    {
      selector: "#profile-update-button",
      title: "Save Changes",
      description: "Click this button to update and save your profile details.",
      position: "top",
    },
  ],
  "/professional/incometax/addtaxpayer": [
  {
    selector: "#taxpayer-total-box",
    title: "Total Taxpayers",
    description:
      "This box displays the total number of taxpayers fetched from the database.",
    position: "bottom",
  },
  {
    selector: "#taxpayer-toggle-inactive",
    title: "Active / Inactive Filter",
    description:
      "Click to switch between viewing Active and Inactive taxpayers.",
    position: "bottom",
  },
  {
    selector: "#taxpayer-search-input",
    title: "Search Taxpayers",
    description:
      "Search taxpayers by mobile number, email, or PAN. The list updates automatically.",
    position: "left",
  },
  {
    selector: "#taxpayer-refresh-button",
    title: "Refresh Taxpayer List",
    description:
      "Reload the list to see latest updates without changing filters.",
    position: "left",
  },
  {
    selector: "#taxpayer-add-button",
    title: "Add a Taxpayer",
    description:
      "Click here to open options for adding single, multiple, or existing taxpayers.",
    position: "left",
  },
  {
    selector: "#taxpayer-table",
    title: "Taxpayer List",
    description:
      "This table shows all taxpayers with PAN, Mobile, Email, and Name.",
    position: "top",
  },
  {
    selector: ".taxpayer-status-toggle",
    title: "Activate / Deactivate",
    description:
      "Use this switch to activate or deactivate the selected taxpayer.",
    position: "left",
  },
  {
    selector: ".taxpayer-view-btn",
    title: "View Details",
    description:
      "Click to view full taxpayer details including personal information.",
    position: "left",
  },
  {
    selector: ".taxpayer-edit-btn",
    title: "Edit Taxpayer",
    description:
      "Click to open the edit form and modify taxpayer details.",
    position: "left",
  },
  {
    selector: "#taxpayer-pagination",
    title: "Pagination Controls",
    description:
      "Use these buttons to navigate through the taxpayer list.",
    position: "top",
  }
],
"/professional/incometax/form26as": [
  {
    selector: "#form26as-title",
    title: "Form 26AS Dashboard",
    description:
      "This section displays Form 26AS data including TDS, TCS, Part-wise details, and uploaded statements.",
    position: "bottom",
  },
  {
    selector: "#form26as-fy-buttons",
    title: "Financial Year Selection",
    description:
      "Select a financial year to load Form 26AS for the chosen taxpayer.",
    position: "bottom",
  },
  {
    selector: "#form26as-pan-select",
    title: "Choose a Taxpayer PAN",
    description:
      "Select a taxpayer PAN to load previously synced Form 26AS or upload a new one.",
    position: "right",
  },
  {
    selector: "#form26as-upload-btn",
    title: "Upload 26AS PDF / ZIP",
    description:
      "Upload the Form 26AS file downloaded from the TRACES portal (PDF or ZIP). The system extracts and processes it automatically.",
    position: "left",
  },
  {
    selector: "#form26as-sync-btn",
    title: "Sync Latest Data",
    description:
      "Fetch the latest saved Form 26AS data from the backend for the selected PAN & FY.",
    position: "left",
  },
  {
    selector: "#form26as-summary-cards",
    title: "TDS & TCS Summary",
    description:
      "A quick overview showing total TDS/TCS credited, deducted, and deposited for the selected financial year.",
    position: "top",
  },
  {
    selector: "#form26as-part-tabs",
    title: "Part-wise Navigation",
    description:
      "Switch between PART-I to PART-X to view deductor details, salary information, TDS, TCS, tax payments, etc.",
    position: "top",
  },
  {
    selector: "#form26as-active-part-container",
    title: "Part Details",
    description:
      "Each part contains tables showing deductor summaries, transaction details, and tax entries as reported in Form 26AS.",
    position: "top",
  },
  {
    selector: ".form26as-entry-card",
    title: "Expandable Tables",
    description:
      "Click a card to expand and view detailed rows of information such as TAN, deducted amount, section, dates, and more.",
    position: "bottom",
  }
],
"/professional/incometax/ais": [
  {
    selector: "#ais-title",
    title: "Annual Information Statement",
    description:
      "This dashboard allows you to upload, sync, and analyze AIS data for any taxpayer.",
    position: "bottom"
  },
  {
    selector: "#ais-fy-selector",
    title: "Select Financial Year",
    description:
      "Choose a financial year to load or sync AIS data for the selected taxpayer.",
    position: "bottom"
  },
  {
    selector: "#ais-pan-select",
    title: "Select Taxpayer PAN",
    description:
      "Choose a taxpayer PAN to view or upload AIS details. Their DOB is used to unlock AIS files.",
    position: "right"
  },
  {
    selector: "#ais-upload-btn",
    title: "Upload AIS PDF",
    description:
      "Upload the AIS PDF downloaded from the Income Tax portal. The system decrypts and processes it automatically.",
    position: "left"
  },
  {
    selector: "#ais-sync-btn",
    title: "Sync Latest AIS Data",
    description:
      "Load previously saved AIS data from the backend for this PAN and financial year.",
    position: "left"
  },
  {
    selector: "#ais-summary-cards",
    title: "AIS Summary Overview",
    description:
      "This section shows total values for TDS/TCS, SFT information, tax payments, and demand/refund.",
    position: "top"
  },
  {
    selector: "#ais-tabs",
    title: "Category Tabs",
    description:
      "Switch between AIS sections such as TDS/TCS, SFT Information, Tax Payments, and Demand/Refund.",
    position: "top"
  },
  {
    selector: "#ais-item-list",
    title: "AIS Detailed Entries",
    description:
      "Each card contains summary information and expandable transaction details for the selected AIS category.",
    position: "top"
  },
  {
    selector: ".ais-entry-card",
    title: "Expandable Entry Card",
    description:
      "Click any card to expand and view detailed transaction rows such as quarters, TAN, amount deducted, and more.",
    position: "bottom"
  }
],
"/professional/incometax/tis": [
  {
    selector: "#tis-title",
    title: "Taxpayer Information Summary (TIS)",
    description:
      "This dashboard summarizes the taxpayer’s income categories, processed values, and accepted values.",
    position: "bottom"
  },
  {
    selector: "#tis-fy-selector",
    title: "Select Financial Year",
    description:
      "Choose the financial year to view or sync TIS data for the selected taxpayer.",
    position: "bottom"
  },
  {
    selector: "#tis-pan-select",
    title: "Select PAN",
    description:
      "Select the taxpayer PAN whose TIS details you want to view, sync, or upload.",
    position: "right"
  },
  {
    selector: "#tis-upload-btn",
    title: "Upload TIS PDF",
    description:
      "Upload the TIS PDF downloaded from the Income Tax portal. The file is decrypted automatically and processed.",
    position: "left"
  },
  {
    selector: "#tis-sync-btn",
    title: "Sync Latest TIS Data",
    description:
      "Fetch previously saved TIS data from the backend for this PAN and FY.",
    position: "left"
  },
  {
    selector: "#tis-summary-cards",
    title: "TIS Income Category Summary",
    description:
      "These cards show the total processed and accepted amounts for each income category such as Salary, Business, Capital Gain, etc.",
    position: "top"
  },
  {
    selector: "#tis-tabs",
    title: "Category Tabs",
    description:
      "Switch between income categories (Salary, Business, Other Source, Capital Gain, Taxes Paid, SFT).",
    position: "top"
  },
  {
    selector: "#tis-item-list",
    title: "Category Details",
    description:
      "Detailed entries for each TIS category appear here. Each entry shows processed, reported, and derived (accepted) values.",
    position: "top"
  },
  {
    selector: ".tis-entry-card",
    title: "TIS Entry Card",
    description:
      "Each card represents a summarized item. View category-wise reported, processed, and derived values.",
    position: "bottom"
  }
],
};
