import { testDefinition } from '../testing/test-definition';
import { FormDefinition } from '../models/clinical-forms.models';
import {
  conditionReferences,
  fieldCapabilities,
  overlayErrorKey,
  parseOverlay,
  sectionDisableBlocker,
  serializeOverlay,
} from './hospital-form-overlay';

function definition(): FormDefinition {
  const d = testDefinition();
  d.sections.push({ key: 'extras', title: 'Extras', order: 4, fields: [{ key: 'notes', type: 'textarea', label: 'Notes' }] });
  return d;
}

describe('hospital form overlay helpers', () => {
  const section = (d: FormDefinition, key: string) => d.sections.find((s) => s.key === key)!;
  const field = (d: FormDefinition, s: string, f: string) => section(d, s).fields.find((x) => x.key === f)!;

  it('round-trips a stored overlay and drops empty entries', () => {
    const stored = JSON.stringify({
      schemaVersion: 1, appliesToTemplateVersion: 3,
      sections: { extras: { enabled: false }, intake: { title: null } },
      fields: { 'intake.phone': { hidden: true }, 'intake.email': {} },
      consents: [{ consentType: 'physio-general', consentVersion: 'H-1', text: 'Hospital text' }],
    });
    const json = serializeOverlay(parseOverlay(stored));
    expect(JSON.parse(json!)).toEqual({
      schemaVersion: 1, appliesToTemplateVersion: 3,
      sections: { extras: { enabled: false } },
      fields: { 'intake.phone': { hidden: true } },
      consents: [{ consentType: 'physio-general', consentVersion: 'H-1', text: 'Hospital text' }],
    });
  });

  it('serializes "no changes" as null so the server clears the overlay', () => {
    expect(serializeOverlay(parseOverlay(null))).toBeNull();
    expect(serializeOverlay(parseOverlay('{"schemaVersion":1,"sections":{"a":{}}}'))).toBeNull();
  });

  it('keeps overrides the editor does not know about (they are preserved, not silently dropped)', () => {
    const json = serializeOverlay(parseOverlay('{"schemaVersion":1,"fields":{"old.removed":{"label":"Legacy"}}}'));
    expect(JSON.parse(json!).fields['old.removed']).toEqual({ label: 'Legacy' });
  });

  it('only allows disabling sections without mandatory or locked content', () => {
    const d = definition();
    expect(sectionDisableBlocker(section(d, 'intake'))).toContain('Main complaint');
    expect(sectionDisableBlocker(section(d, 'assessment'))).toContain('History');
    expect(sectionDisableBlocker(section(d, 'extras'))).toBeNull();
  });

  it('mirrors the server rules for hiding, requiring and hiding options', () => {
    const d = definition();
    const refs = conditionReferences(d);
    expect(refs.has('intake.sport')).toBeTrue();       // used by sportName's condition
    expect(refs.has('intake.kneeSide')).toBeTrue();
    expect(refs.has('intake.gender')).toBeFalse();     // patient conditions do not count

    const caps = (s: string, f: string) => fieldCapabilities(d, section(d, s), field(d, s, f), refs);
    expect(caps('intake', 'phone').hideBlocker).toBeNull();
    expect(caps('intake', 'complaint').hideBlocker).toContain('Mandatory');
    expect(caps('intake', 'sport').hideBlocker).toContain('depend');
    expect(caps('intake', 'sportName').hideBlocker).toContain('Mandatory'); // conditionally required
    expect(caps('intake', 'name').requireBlocker).toContain('patient record');
    expect(caps('intake', 'sportName').requireBlocker).toContain('conditions');
    expect(caps('intake', 'complaint').alreadyRequired).toBeTrue();

    expect(caps('assessment', 'severity').hideableOptions.map((o) => o.value)).toEqual(['mild', 'severe']);
    expect(caps('assessment', 'tooth').hideableOptions.length).toBe(52);          // built-in FDI set
    expect(caps('assessment', 'history').hideableOptions.map((o) => o.value)).toEqual(['surgery', 'fracture', 'senior']);
    expect(caps('intake', 'complaint').hideableOptions).toEqual([]);
  });

  it('maps server validation paths to editor controls', () => {
    const overlay = parseOverlay('{"schemaVersion":1,"consents":[{"consentType":"physio-general","consentVersion":"1.0","text":"x"}]}');
    expect(overlayErrorKey('$.sections.extras.enabled', overlay)).toBe('section:extras:enabled');
    expect(overlayErrorKey('$.fields.intake.phone.hidden', overlay)).toBe('field:intake.phone:hidden');
    expect(overlayErrorKey('$.fields.intake.phone', overlay)).toBe('field:intake.phone');
    expect(overlayErrorKey('$.consents[0].consentVersion', overlay)).toBe('consent:physio-general:consentVersion');
    expect(overlayErrorKey('$.sections', overlay)).toBe('general');
    expect(overlayErrorKey('sections[0].fields[1]', overlay)).toBe('general');
  });
});
