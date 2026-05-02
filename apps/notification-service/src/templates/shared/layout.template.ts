export const baseEmailLayout = (
  content: string,
  tenant?: { name: string; logo?: string },
) => {
  return `
    <html>
      <body style="font-family: Arial; background:#f5f5f5; padding:20px;">
        <div style="max-width:600px; margin:auto; background:white; padding:20px;">
          ${content}
          <hr />
          <p style="font-size:12px; color:gray;">
            <h2>${tenant?.name || 'Gym SaaS'}</h2>
          </p>
        </div>
      </body>
    </html>
  `;
};
