export default defineAppConfig({
  pages: [
    'pages/machines/index',
    'pages/booking/index',
    'pages/coupons/index',
    'pages/bill/index',
    'pages/machine-detail/index',
    'pages/booking-detail/index',
    'pages/bill-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '飞镖竞技吧',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F5F6FA'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#FF6B35',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/machines/index',
        text: '镖机排期'
      },
      {
        pagePath: 'pages/booking/index',
        text: '周期预订'
      },
      {
        pagePath: 'pages/coupons/index',
        text: '优惠中心'
      },
      {
        pagePath: 'pages/bill/index',
        text: '账单排行'
      }
    ]
  }
})
