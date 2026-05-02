export const pushProcessor = {
  send: async (data: any) => {
    console.log('Push sent to', data.to);
  },
};
