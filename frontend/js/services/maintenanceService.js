import supabaseClient from "../core/supabaseClient.js";

function normalizeRelation(value) {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function normalizeMaintenanceRecord(record) {
  if (!record) return record;

  const agreement = normalizeRelation(record.rental_agreements);
  const property = normalizeRelation(agreement?.properties);
  const owner = normalizeRelation(property?.owners);
  const tenant = normalizeRelation(agreement?.tenants);
  const tenantUser = normalizeRelation(tenant?.users);

  return {
    ...record,
    rental_agreements: agreement
      ? {
        ...agreement,
        properties: property
          ? {
            ...property,
            owners: owner
          }
          : property,
        tenants: tenant
          ? {
            ...tenant,
            users: tenantUser
          }
          : tenant
      }
      : agreement
  };
}

export async function listMaintenanceRequests() {
  const { data, error } = await supabaseClient
    .from("maintenance_requests")
    .select(
      "request_id,agreement_id,issue_type,description,request_date,status,cost_estimate,rental_agreements!maintenance_requests_agreement_id_fkey(property_id,tenant_id,properties!rental_agreements_property_id_fkey(address,city,owner_id,owners!properties_owner_id_fkey(user_id)),tenants!rental_agreements_tenant_id_fkey(user_id,users!tenants_user_id_fkey(name,email)))"
    )
    .order("request_id", { ascending: false });

  return {
    data: (data || []).map((item) => normalizeMaintenanceRecord(item)),
    error
  };
}

export async function createMaintenanceRequest(payload) {
  return supabaseClient
    .from("maintenance_requests")
    .insert([payload])
    .select()
    .single();
}

export async function updateMaintenanceRequest(requestId, payload) {
  return supabaseClient
    .from("maintenance_requests")
    .update(payload)
    .eq("request_id", requestId)
    .select()
    .single();
}
