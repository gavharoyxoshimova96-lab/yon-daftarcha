import React, { useState } from 'react';
import { Platform, Pressable } from 'react-native';
import { TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

import { formatDisplayDate, parseDateString, toDateString } from '@/utils/date';

interface DatePickerInputProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  style?: object;
  clearable?: boolean;
}

export function DatePickerInput({ label, value, onChange, style, clearable }: DatePickerInputProps) {
  const [show, setShow] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <TextInput
        label={label}
        value={value}
        onChangeText={onChange}
        mode="outlined"
        style={style}
        left={<TextInput.Icon icon="calendar" />}
        placeholder="YYYY-MM-DD"
      />
    );
  }

  const handleChange = (event: { type: string }, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'dismissed') {
      setShow(false);
      return;
    }
    if (selected) {
      onChange(toDateString(selected));
      if (Platform.OS === 'ios') setShow(false);
    }
  };

  return (
    <>
      <Pressable onPress={() => setShow(true)}>
        <TextInput
          label={label}
          value={value ? formatDisplayDate(value) : ''}
          mode="outlined"
          style={style}
          editable={false}
          pointerEvents="none"
          left={<TextInput.Icon icon="calendar" />}
          right={
            clearable && value ? (
              <TextInput.Icon icon="close" onPress={() => onChange('')} />
            ) : undefined
          }
        />
      </Pressable>
      {show && (
        <DateTimePicker
          value={value ? parseDateString(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </>
  );
}
