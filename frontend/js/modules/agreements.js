import { requireUser } from "../core/auth.js";
import { getTenants } from "../services/userService.js";
import { listProperties } from "../services/propertyService.js";
import { createAgreement, listAgreements, updateAgreementStatus } from "../services/agreementService.js";
import { formatCurrency, formatDate } from "../utils/helpers.js";

const user = requireUser(["admin", "owner", "tenant"]);
if (!user) throw new Error("Unauthorized");

const adminForm = document.getElementById("agreementForm");
const propertySelect = document.getElementById("propertyId");
const tenantSelect = document.getElementById("tenantId");
const agreementTableBody = document.getElementById("agreementTableBody");
function canCreateAgreement() {
  return user.role === "admin";
}

if (!canCreateAgreement()) {
  adminForm.style.display = "none";
}

async function loadSelectOptions() {
  if (!canCreateAgreement()) return;

  const [{ data: properties, error: propertyError }, { data: tenants, error: tenantError }] = await Promise.all([
    listProperties({ status: "Available" }),
    getTenants()
  ]);

  if (propertyError || tenantError) {
    console.error(propertyError || tenantError);
    alert("Failed to load agreement options");
    return;
  }

  propertySelect.innerHTML = `<option value="">Select Property</option>${(properties || [])
    .map((property) => `<option value="${property.property_id}">#${property.property_id} - ${property.title || property.address}, ${property.city}</option>`)
    .join("")}`;

  tenantSelect.innerHTML = `<option value="">Select Tenant</option>${(tenants || [])
    .map((tenant) => `<option value="${tenant.tenant_id}">#${tenant.tenant_id} - ${tenant.users?.name || "-"}</option>`)
    .join("")}`;
}

function filterByRole(agreements) {
  if (user.role === "admin") return agreements;

  if (user.role === "owner") {
    return agreements.filter((agreement) => agreement.properties?.owners?.user_id === user.user_id);
  }

  return agreements.filter((agreement) => agreement.tenants?.user_id === user.user_id);
}

async function loadAgreementList() {
  const { data, error } = await listAgreements();
  if (error) {
    console.error(error);
    alert("Failed to fetch agreements");
    return;
  }

  const agreements = filterByRole(data || []);

  agreementTableBody.innerHTML = agreements.length
    ? agreements
      .map(
        (agreement) => `
        <tr>
          <td>${agreement.agreement_id}</td>
          <td>${agreement.properties?.address || "-"}</td>
          <td>${agreement.tenants?.users?.name || "-"}</td>
          <td>${formatDate(agreement.start_date)} to ${formatDate(agreement.end_date)}</td>
          <td>${formatCurrency(agreement.monthly_rent)}</td>
          <td>${agreement.agreement_status || "-"}</td>
          <td>${user.role === "admin" ? `<button class="btn btn-secondary statusBtn" data-id="${agreement.agreement_id}">Mark Completed</button>` : "-"}</td>
        </tr>
      `
      )
      .join("")
    : "<tr><td colspan='7'>No agreements found.</td></tr>";
}

agreementTableBody.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  if (!target.classList.contains("statusBtn")) return;

  const id = Number(target.dataset.id);
  if (!id) return;

  const { error } = await updateAgreementStatus(id, "Completed");
  if (error) {
    console.error(error);
    alert("Failed to update status");
    return;
  }

  loadAgreementList();
});

adminForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    property_id: Number(propertySelect.value),
    tenant_id: Number(tenantSelect.value),
    start_date: document.getElementById("startDate").value,
    end_date: document.getElementById("endDate").value,
    deposit_amount: Number(document.getElementById("depositAmount").value || 0),
    monthly_rent: Number(document.getElementById("monthlyRent").value || 0),
    police_verified: document.getElementById("policeVerified").checked,
    agreement_status: document.getElementById("agreementStatus").value
  };

  const { error } = await createAgreement(payload);

  if (error) {
    console.error(error);
    alert("Failed to create agreement");
    return;
  }

  alert("Agreement created");
  adminForm.reset();
  loadAgreementList();
});

loadSelectOptions();
loadAgreementList();
