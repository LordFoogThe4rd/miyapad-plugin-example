import { formatIsoDate } from './util';

const rawLoads = await miyapad.storage.get('loads');
const loads = typeof rawLoads === 'number' ? rawLoads + 1 : 1;
await miyapad.storage.set('loads', loads);

miyapad.hooks.prompt.push(prompt => prompt.replaceAll('{{date}}', formatIsoDate()));
