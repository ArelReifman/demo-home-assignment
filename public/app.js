const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const clearButton = document.getElementById("clear-button");
const importButton = document.getElementById("import-button");
const importResult = document.getElementById("import-result");
const importSummary = document.getElementById("import-summary");
const importErrors = document.getElementById("import-errors");
const statusText = document.getElementById("status");
const contactsTable = document.getElementById("contacts-table");

async function requestJson(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error("the server is not reachable");
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `server returned ${response.status}`);
  }
  return body;
}

function fillTable(table, rows) {
  const tbody = table.querySelector("tbody");
  tbody.replaceChildren();
  for (const cells of rows) {
    const tr = document.createElement("tr");
    for (const value of cells) {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

function showStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.className = isError ? "error" : "";
}

async function loadContacts() {
  const search = searchInput.value.trim();
  showStatus("Loading contacts...");
  contactsTable.hidden = true;

  try {
    const contacts = await requestJson(`/contacts?search=${encodeURIComponent(search)}`);
    if (contacts.length === 0) {
      showStatus(search ? `No contacts match "${search}".` : "No contacts yet. Click Import contacts.");
      return;
    }
    fillTable(
      contactsTable,
      contacts.map((c) => [c.full_name, c.email, c.phone, c.company, c.created_at]),
    );
    contactsTable.hidden = false;
    showStatus(`${contacts.length} contact${contacts.length === 1 ? "" : "s"}`);
  } catch (error) {
    showStatus(`Could not load contacts: ${error.message}`, true);
  }
}

async function runImport() {
  importButton.disabled = true;
  importButton.textContent = "Importing...";
  importResult.hidden = false;
  importSummary.className = "";
  importSummary.textContent = "Importing contacts...";
  importErrors.hidden = true;

  try {
    const result = await requestJson("/import", { method: "POST" });
    importSummary.textContent = `Imported ${result.imported}, skipped ${result.skipped}.`;
    fillTable(
      importErrors,
      result.errors.map((e) => [e.row, e.reason]),
    );
    importErrors.hidden = result.errors.length === 0;
    await loadContacts();
  } catch (error) {
    importSummary.className = "error";
    importSummary.textContent = `Import failed: ${error.message}`;
  } finally {
    importButton.disabled = false;
    importButton.textContent = "Import contacts";
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadContacts();
});

clearButton.addEventListener("click", () => {
  searchInput.value = "";
  loadContacts();
});

importButton.addEventListener("click", runImport);

loadContacts();
