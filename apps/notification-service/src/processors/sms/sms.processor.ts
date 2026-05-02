export const smsProcessor = {
  send: async (data: any) => {
    console.log('SMS sent to', data.to);
  },
};
