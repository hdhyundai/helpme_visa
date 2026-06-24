export type VisaType = "E-9" | "E-7";

export type ReqType = 
  | "chk_alien_reg" 
  | "chk_extension" 
  | "chk_change_work" 
  | "chk_reentry" 
  | "chk_reissue" 
  | "chk_change_status";

export type SubmitterType = "self" | "spouse" | "parents";

export type OwnershipType = "own_self" | "own_rent" | "own_other";

export type HousingType = "type_dorm" | "type_private" | "type_hotel";

export interface FormData {
  visaType: VisaType;
  reqType: ReqType;
  val_change_status: string;
  submitter: SubmitterType;
  i_surname: string;
  i_givenname: string;
  i_dob: string;
  i_gender: "M" | "F";
  i_nation: string;
  i_arc: string;
  i_passport: string;
  i_pass_issue: string;
  i_pass_exp: string;
  i_spouse: string;
  i_parents: string;
  i_address_kr: string;
  i_cellphone: string;
  i_phone: string;
  i_address_home: string;
  i_home_phone: string;
  i_email: string;
  i_cname: string;
  i_cregno: string;
  i_rep_name: string;
  i_rep_id: string;
  i_rep_gender: "M" | "F";
  i_caddr: string;
  i_cphone: string;
  i_new_cname: string;
  i_new_cregno: string;
  i_new_cphone: string;
  r_own: OwnershipType;
  r_type: HousingType;
  i_dorm_start: string;
  i_job: string;
  i_income: string;
  i_reentry_period: string;
  i_refund_bank: string;
  i_refund_acc: string;
  i_guar_start: string;
  i_guar_end: string;
}

export interface EmployeeDBItem extends FormData {
  lastUpdated: string;
}

export interface VerificationIssue {
  fieldId: keyof FormData | string;
  category: string;
  description: string;
  recommendation: string;
}

export interface VerificationResponse {
  status: "PASS" | "FAIL";
  issues: VerificationIssue[];
}
