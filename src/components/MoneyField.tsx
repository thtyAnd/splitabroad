import { useEffect, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { formatAmount, parseAmount, symbolFor, type CurrencyCode } from '@/lib/money';

import { Field } from './Field';

type Props = {
  label?: string;
  value: number;
  onChange: (next: number) => void;
  currency: CurrencyCode;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A money input that lets you actually type.
 *
 * Rendering `value.toFixed(2)` straight back into the field fights the user —
 * typing "3" reformats to "3.00" and the caret jumps. So the raw text is local,
 * and the formatted value is only pushed back in when the amount changes from
 * somewhere else (Split equally, or switching to item-based shares).
 */
export function MoneyField({
  label,
  value,
  onChange,
  currency,
  placeholder = '0.00',
  style,
}: Props) {
  const [text, setText] = useState(() => (value ? formatAmount(value, currency) : ''));
  /** The last amount this field itself produced, to tell self- from outside-edits. */
  const own = useRef(value);

  useEffect(() => {
    if (value === own.current) return;
    own.current = value;
    setText(value ? formatAmount(value, currency) : '');
  }, [value, currency]);

  return (
    <Field
      label={label}
      value={text}
      onChangeText={(next) => {
        setText(next);
        const parsed = parseAmount(next);
        own.current = parsed;
        onChange(parsed);
      }}
      placeholder={placeholder}
      keyboardType="decimal-pad"
      mono
      prefix={symbolFor(currency)}
      style={style}
    />
  );
}
