interface SiteSnapshot {
  targetUrl: string;
  pages: PageSnapshot[];
}

interface PageSnapshot {
  url: string;
  title: string;
  elements: ElementSnapshot[];
  text: string[];
}

interface ElementSnapshot {
  role?: string;
  name?: string;
  tag: string;
  selector?: string;
  value?: string;
  placeholder?: string;
  visible: boolean;
  enabled?: boolean;
}

// const buttons = await page.getByRole('button').all();

// const inputs = await page.locator('input').all();

// const links = await page.getByRole('link').all();
