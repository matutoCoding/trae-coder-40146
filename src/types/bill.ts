export type BillStatus = 'unpaid' | 'paid' | 'refunded';

export interface BillItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type: 'booking' | 'product' | 'service';
  referenceId?: string;
}

export interface DiscountDetail {
  couponId: string;
  couponName: string;
  discountType: string;
  discountAmount: number;
}

export interface Bill {
  id: string;
  billNo: string;
  bookingId?: string;
  playerName: string;
  playerPhone: string;
  items: BillItem[];
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  discounts: DiscountDetail[];
  status: BillStatus;
  payTime?: string;
  createTime: string;
  remark?: string;
}

export const BILL_STATUS_LABEL: Record<BillStatus, string> = {
  unpaid: '待支付',
  paid: '已支付',
  refunded: '已退款'
};
