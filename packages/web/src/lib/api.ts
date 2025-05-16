import { hcWithType } from '../../../api/src/hc';

export const client = hcWithType(import.meta.env.VITE_API_URL);
