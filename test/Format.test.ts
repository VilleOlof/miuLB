import { test, expect } from 'vitest'
import { FormatUsername, FormatPlatform } from '../src/main';
import { FormatString, FormatTime } from '../src/DataHandler';

test('Test FormatUsername, Should Return The Exact Same Username (VilleOlof)', () => {

    const username = "VilleOlof"
    const result = FormatUsername(username)

    expect(result).toBe("VilleOlof");
});

test('Test FormatUsername, Should Return A Shortened Version (ThisIsAPrettyLongName)', () => {

    const username = "ThisIsAPrettyLongName"
    const result = FormatUsername(username)

    expect(result).toBe("ThisIsAPrettyLon...");
});

test('Test FormatPlatform, Should Return The Exact Same Platform (Global)', () => {
    
    const platform = "Global"
    const result = FormatPlatform(platform)

    expect(result).toBe("Global");
});

test('Test FormatPlatform, Should Return "Shhh" Since The Platform Is Not Valid', () => {

    const platform = "Steam_mayhem"
    const result = FormatPlatform(platform)

    expect(result).toBe("Shhh");
});

test('Test FormatString, Should Return A Combined String Using "{Number}" With Specified Args', () => {

    const str_template = 'Hello {0}, This is a {1} test';

    const result = FormatString(str_template, 'World', 'useful');

    expect(result).toBe('Hello World, This is a useful test');
});

test('Test FormatTime, Should Return A Shortened And Better Formatted Time String', () => {
    
    const seconds = 123.456;

    const result = FormatTime(seconds);

    expect(result).toBe('2:03.456');
});