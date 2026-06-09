import { render as reactEmailRender } from '@react-email/components';
import type { ReactElement } from 'react';

export async function render(component: ReactElement): Promise<string> {
  return reactEmailRender(component);
}
