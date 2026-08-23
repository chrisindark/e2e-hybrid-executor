export const metadata = {
  title: 'Hybrid Test Execution',
  description: 'Capture, run, recover, promote - a hybrid test execution prototype',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, background: '#0b0d12', color: '#e7e9ee' }}>
        {children}
      </body>
    </html>
  );
}
