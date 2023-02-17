import { test, expect } from 'vitest'
import Ping from '../src/Ping'

test('Test Ping The Backend, Should Always Return True', async () => {
    
    const IP: string = process.env.VITE_BACKEND_IP as string;
    const result = await Ping(IP)

    expect(result).toBe(true);
});