import { Timestamp } from "firebase/firestore";

export interface Room {
  id: string;
  host_uid: string;
  host_name: string;
  room_name: string;
  bank: string;
  account: string;
  share_token: string;
  is_active: boolean;
  expires_at: Timestamp;
  created_at: Timestamp;
}

export interface MenuItem {
  id: string;
  room_id: string;
  name: string;
  price: number;
  qty: number;
  is_shared: boolean;
}

export interface Participant {
  id: string;
  room_id: string;
  name: string;
  claimed: boolean;
}

export interface Assignment {
  id: string;
  participant_id: string;
  menu_item_id: string;
}

export type ProofStatus = "pending" | "confirmed" | "rejected";

export interface PaymentProof {
  id: string;
  participant_id: string;
  participant_name: string;
  image_url: string; // R2 object key
  status: ProofStatus;
  rejected_reason?: string;
  submitted_at: Timestamp;
  reviewed_at?: Timestamp;
}
