import { describe, expect, it } from 'vitest';
import {
  primaryNavigationLinks,
  resolveNavigationHref
} from '../components/navigationConfig';

describe('navigationConfig', () => {
  it('contains the expected public navbar destinations', () => {
    const labels = primaryNavigationLinks.map((item) => item.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        'Home',
        'About Us',
        'Learn',
        'Projects',
        'Roadmap',
        'Pricing',
        'Resources',
        'Contact Us'
      ])
    );
  });

  it('uses auth destination when user is authenticated and authTo exists', () => {
    const learnItem = primaryNavigationLinks.find((item) => item.label === 'Learn');
    expect(learnItem).toBeDefined();
    expect(resolveNavigationHref(learnItem!, false)).toBe('/#learn');
    expect(resolveNavigationHref(learnItem!, true)).toBe('/courses');
  });
});
