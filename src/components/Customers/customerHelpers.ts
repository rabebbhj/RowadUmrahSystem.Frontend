import type { CustomerDetail } from "../../api/customers";

export type CustomerFormState = {
  name: string;
  civilId: string;
  passportNumber: string;
  phoneNumber: string;
  email: string;
  address: string;
  travelerId: string;
  isActive: boolean;
};

export type CustomerStatusFilter = "all" | "active" | "inactive";

export function createEmptyCustomerForm(): CustomerFormState {
  return {
    name: "",
    civilId: "",
    passportNumber: "",
    phoneNumber: "",
    email: "",
    address: "",
    travelerId: "",
    isActive: true
  };
}

export function mapCustomerToForm(customer: Pick<CustomerDetail, "name" | "civilId" | "passportNumber" | "phoneNumber" | "email" | "address" | "travelerId" | "isActive">): CustomerFormState {
  return {
    name: customer.name,
    civilId: customer.civilId,
    passportNumber: customer.passportNumber,
    phoneNumber: customer.phoneNumber,
    email: customer.email,
    address: customer.address,
    travelerId: customer.travelerId ? String(customer.travelerId) : "",
    isActive: customer.isActive
  };
}

export function customerStatusText(isActive: boolean) {
  return isActive ? "فعال" : "معطل";
}

export function customerStatusClass(isActive: boolean) {
  return isActive ? "pill success" : "pill danger";
}
