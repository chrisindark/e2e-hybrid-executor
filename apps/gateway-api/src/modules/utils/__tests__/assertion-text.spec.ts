import { resolveExpectedText } from '../assertion-text';

describe('resolveExpectedText', () => {
  it('prefers expectedOutcome over value', () => {
    expect(
      resolveExpectedText({ expectedOutcome: 'Thank you', value: 'Jane' }),
    ).toBe('Thank you');
  });

  it('falls back to value only when expectedOutcome is nullish', () => {
    expect(resolveExpectedText({ value: 'Legacy text' })).toBe('Legacy text');
    expect(
      resolveExpectedText({ expectedOutcome: null, value: 'Legacy text' }),
    ).toBe('Legacy text');
  });

  it('never falls back to a bare value for a blank expectedOutcome', () => {
    expect(resolveExpectedText({ expectedOutcome: '', value: 'Jane' })).toBe(
      '',
    );
    expect(
      resolveExpectedText({ expectedOutcome: '   ', value: 'Jane' }).trim(),
    ).toBe('');
  });

  it('returns an empty string when neither field is set', () => {
    expect(resolveExpectedText({})).toBe('');
  });
});
