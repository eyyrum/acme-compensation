import { parseEmployeeQuery, buildEmployeeHref } from './search-params';

describe('parseEmployeeQuery', () => {
  it('applies defaults when no params are present', () => {
    const query = parseEmployeeQuery({});
    expect(query).toMatchObject({ page: 1, pageSize: 25, sortBy: 'fullName', sortDir: 'asc' });
  });

  it('coerces numeric params from strings', () => {
    const query = parseEmployeeQuery({ page: '3', departmentId: '7' });
    expect(query.page).toBe(3);
    expect(query.departmentId).toBe(7);
  });

  it('uppercases country codes so ?countryCode=in works', () => {
    expect(parseEmployeeQuery({ countryCode: 'in' }).countryCode).toBe('IN');
  });

  it('falls back to defaults for a hand-edited invalid URL', () => {
    // A user editing the address bar should not see a crash.
    const query = parseEmployeeQuery({ sortBy: 'nonsense', page: '-4' });
    expect(query.sortBy).toBe('fullName');
    expect(query.page).toBe(1);
  });

  it('takes the first value when a param is repeated', () => {
    expect(parseEmployeeQuery({ countryCode: ['US', 'GB'] }).countryCode).toBe('US');
  });
});

describe('buildEmployeeHref', () => {
  it('omits defaults to keep shared links readable', () => {
    expect(buildEmployeeHref({ page: 1, pageSize: 25, sortBy: 'fullName', sortDir: 'asc' }))
      .toBe('/employees');
  });

  it('includes only non-default values', () => {
    const href = buildEmployeeHref({ page: 3, countryCode: 'IN', sortBy: 'salaryUsd', sortDir: 'desc' });
    expect(href).toContain('page=3');
    expect(href).toContain('countryCode=IN');
    expect(href).toContain('sortBy=salaryUsd');
    expect(href).not.toContain('pageSize');
  });
});