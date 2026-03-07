import supabaseClient from "../core/supabaseClient.js";

export async function listAgreements() {
  return supabaseClient
    .from("rental_agreements")
    .select(
      "agreement_id,property_id,tenant_id,start_date,end_date,deposit_amount,monthly_rent,police_verified,agreement_status,properties(address,city,property_type,owner_id,owners(user_id,users(name,email))),tenants(user_id,users(name,email))"
    )
    .order("agreement_id", { ascending: false });
}

export async function createAgreement(payload) {
  return supabaseClient
    .from("rental_agreements")
    .insert([payload])
    .select()
    .single();
}

export async function updateAgreement(agreementId, payload) {
  return supabaseClient
    .from("rental_agreements")
    .update(payload)
    .eq("agreement_id", agreementId)
    .select()
    .single();
}

export async function updateAgreementStatus(agreementId, agreementStatus) {
  return supabaseClient
    .from("rental_agreements")
    .update({ agreement_status: agreementStatus })
    .eq("agreement_id", agreementId);
}

export async function deleteAgreement(agreementId) {
  return supabaseClient
    .from("rental_agreements")
    .delete()
    .eq("agreement_id", agreementId);
}
