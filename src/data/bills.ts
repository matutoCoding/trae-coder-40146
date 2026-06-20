import { Bill, BillStatus } from '@/types/bill';

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const formatShortDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const today = new Date();

export const mockBills: Bill[] = [
  {
    id: 'bill001',
    billNo: 'BD20240615001',
    bookingId: 'b0001',
    playerName: '张伟',
    playerPhone: '138****8888',
    items: [
      {
        id: 'item001',
        name: '凤凰飞镖机 2小时',
        quantity: 2,
        unitPrice: 60,
        amount: 120,
        type: 'booking',
        referenceId: 'b0001'
      }
    ],
    originalAmount: 120,
    discountAmount: 24,
    finalAmount: 96,
    discounts: [
      {
        couponId: 'c001',
        couponName: '新人8折券',
        discountType: 'discount',
        discountAmount: 24
      }
    ],
    status: 'paid',
    payTime: formatDate(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)),
    createTime: formatDate(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000))
  },
  {
    id: 'bill002',
    billNo: 'BD20240616002',
    bookingId: 'b0002',
    playerName: '李强',
    playerPhone: '139****6666',
    items: [
      {
        id: 'item002',
        name: '专业竞技机 4小时',
        quantity: 4,
        unitPrice: 100,
        amount: 400,
        type: 'booking',
        referenceId: 'b0002'
      },
      {
        id: 'item003',
        name: '饮料套餐',
        quantity: 2,
        unitPrice: 35,
        amount: 70,
        type: 'product'
      }
    ],
    originalAmount: 470,
    discountAmount: 70,
    finalAmount: 400,
    discounts: [
      {
        couponId: 'c002',
        couponName: '满200减50',
        discountType: 'fullReduce',
        discountAmount: 50
      },
      {
        couponId: 'c005',
        couponName: '满100减20',
        discountType: 'fullReduce',
        discountAmount: 20
      }
    ],
    status: 'paid',
    payTime: formatDate(new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000)),
    createTime: formatDate(new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000))
  },
  {
    id: 'bill003',
    billNo: 'BD20240617003',
    bookingId: 'b0003',
    playerName: '王芳',
    playerPhone: '137****2222',
    items: [
      {
        id: 'item004',
        name: '经典飞镖 2小时',
        quantity: 2,
        unitPrice: 50,
        amount: 100,
        type: 'booking',
        referenceId: 'b0003'
      }
    ],
    originalAmount: 100,
    discountAmount: 100,
    finalAmount: 0,
    discounts: [
      {
        couponId: 'c003',
        couponName: '100元抵扣券',
        discountType: 'deduct',
        discountAmount: 100
      }
    ],
    status: 'paid',
    payTime: formatDate(today),
    createTime: formatDate(today),
    remark: '使用全额抵扣券，实付0元'
  },
  {
    id: 'bill004',
    billNo: 'BD20240618004',
    bookingId: 'b0004',
    playerName: '张伟',
    playerPhone: '138****8888',
    items: [
      {
        id: 'item005',
        name: '凤凰飞镖机 2小时',
        quantity: 2,
        unitPrice: 60,
        amount: 120,
        type: 'booking',
        referenceId: 'b0004'
      }
    ],
    originalAmount: 120,
    discountAmount: 0,
    finalAmount: 120,
    discounts: [],
    status: 'unpaid',
    createTime: formatDate(today),
    remark: '待支付'
  },
  {
    id: 'bill005',
    billNo: 'BD20240610005',
    playerName: '陈明',
    playerPhone: '136****5555',
    items: [
      {
        id: 'item006',
        name: '娱乐飞镖 3小时',
        quantity: 3,
        unitPrice: 45,
        amount: 135,
        type: 'booking'
      }
    ],
    originalAmount: 135,
    discountAmount: 15,
    finalAmount: 120,
    discounts: [
      {
        couponId: 'c005',
        couponName: '满100减20',
        discountType: 'fullReduce',
        discountAmount: 15
      }
    ],
    status: 'refunded',
    payTime: formatDate(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)),
    createTime: formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)),
    remark: '用户取消预订，已全额退款'
  },
  {
    id: 'bill006',
    billNo: 'BD20240612006',
    playerName: '刘洋',
    playerPhone: '135****7777',
    items: [
      {
        id: 'item007',
        name: '豪华飞镖机 2小时',
        quantity: 2,
        unitPrice: 120,
        amount: 240,
        type: 'booking'
      },
      {
        id: 'item008',
        name: 'VIP服务',
        quantity: 1,
        unitPrice: 50,
        amount: 50,
        type: 'service'
      }
    ],
    originalAmount: 290,
    discountAmount: 50,
    finalAmount: 240,
    discounts: [
      {
        couponId: 'c002',
        couponName: '满200减50',
        discountType: 'fullReduce',
        discountAmount: 50
      }
    ],
    status: 'paid',
    payTime: formatDate(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)),
    createTime: formatDate(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000))
  }
];

export const getBillsByPlayer = (phone: string): Bill[] => {
  return mockBills.filter(b => b.playerPhone === phone);
};

export const getBillById = (id: string): Bill | undefined => {
  return mockBills.find(b => b.id === id);
};

export const getBillsByStatus = (status: BillStatus): Bill[] => {
  return mockBills.filter(b => b.status === status);
};
