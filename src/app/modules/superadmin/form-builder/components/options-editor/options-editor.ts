import { Component, Input } from '@angular/core';
import { FieldOption } from '../../../../doctor/modules/clinical-forms/models/clinical-forms.models';
import { move, newOption, toKey, uniqueKey } from '../../builder-utils';

/**
 * Edits a list of { value, label } rows in place. The stored value follows the label automatically
 * (camelCase) until it is edited by hand; values already used by a published version are fixed, because
 * saved answers refer to them.
 */
@Component({
  selector: 'app-fb-options-editor',
  standalone: false,
  templateUrl: './options-editor.html',
})
export class OptionsEditor {
  @Input({ required: true }) options!: FieldOption[];
  @Input() readOnly = false;
  /** Values present in the latest published version: their value cannot change. */
  @Input() fixedValues: ReadonlySet<string> = new Set();
  /** Wording for the list items, e.g. "option" or "item". */
  @Input() noun = 'option';
  /** Property that holds the stored value ("value" for options, "key" for checklist items). */
  @Input() valueProp: 'value' | 'key' = 'value';

  private readonly manual = new WeakSet<object>();

  valueOf(row: FieldOption): string {
    return (row as unknown as Record<string, string>)[this.valueProp];
  }

  isFixed(row: FieldOption): boolean {
    return this.fixedValues.has(this.valueOf(row));
  }

  setLabel(row: FieldOption, label: string): void {
    row.label = label;
    if (this.isFixed(row) || this.manual.has(row)) return;
    const others = this.options.filter((o) => o !== row).map((o) => this.valueOf(o));
    this.setValueRaw(row, uniqueKey(toKey(label, this.noun), others));
  }

  setValue(row: FieldOption, value: string): void {
    this.manual.add(row);
    this.setValueRaw(row, value.trim());
  }

  add(): void {
    const created = newOption(this.options.map((o) => ({ value: this.valueOf(o), label: o.label })), `${this.noun[0].toUpperCase()}${this.noun.slice(1)} ${this.options.length + 1}`);
    const row = (this.valueProp === 'key' ? { key: created.value, label: created.label } : created) as FieldOption;
    this.options.push(row);
  }

  remove(index: number): void {
    this.options.splice(index, 1);
  }

  move(index: number, delta: number): void {
    move(this.options, index, delta);
  }

  /** Paste one label per line to add many at once. */
  addMany(text: string): void {
    for (const line of text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
      const value = uniqueKey(toKey(line, this.noun), this.options.map((o) => this.valueOf(o)));
      this.options.push((this.valueProp === 'key' ? { key: value, label: line } : { value, label: line }) as FieldOption);
    }
  }

  duplicateValues(): Set<string> {
    const seen = new Set<string>();
    const dup = new Set<string>();
    for (const o of this.options) {
      const v = this.valueOf(o);
      if (seen.has(v)) dup.add(v);
      seen.add(v);
    }
    return dup;
  }

  private setValueRaw(row: FieldOption, value: string): void {
    (row as unknown as Record<string, string>)[this.valueProp] = value;
  }
}
