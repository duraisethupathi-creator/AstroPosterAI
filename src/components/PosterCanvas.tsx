import React, {forwardRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {BrandSnapshot} from '../types/brandProfile';

type Props = {
  width: number; title: string; badge?: string;
  sections: {key: string; label: string; text: string}[];
  brand?: BrandSnapshot; variant: number; font: number; background: number;
  onReady: (height: number) => void;
};
const accents = ['#E8C97D', '#F0BC76', '#C9B6FF', '#E5C18C', '#E4D7AE'];
const backgrounds = ['#141522', '#241725', '#13221E'];

// Only this native view is captured. No controls or navigation belong inside it.
export const PosterCanvas = forwardRef<View, Props>(function PosterCanvas({width, title, badge, sections, brand, variant, font, background, onReady}, ref) {
  const [fontSize, setFontSize] = useState(Math.min(18, Math.max(14, width / 23)));
  const accent = accents[variant];
  const padding = Math.max(14, Math.min(24, width * 0.055));
  const border = variant === 1 ? 3 : 1;
  const lineHeight = Math.ceil(fontSize * 1.65);
  const textStyle = {fontSize, lineHeight, fontFamily: font === 1 ? 'serif' : undefined,
    fontWeight: font === 2 ? '600' as const : '400' as const};
  const brandLines = brand ? [brand.businessName, brand.astrologerName, brand.phone, brand.whatsapp, brand.address, brand.website]
    .filter((value, index, values) => value.trim() && values.indexOf(value) === index) : [];
  return <View ref={ref} collapsable={false} style={[s.canvas, {width, padding, borderWidth: border,
    borderColor: accent, backgroundColor: backgrounds[background], borderRadius: variant === 4 ? 6 : 20}]}>
    <View onLayout={({nativeEvent: {layout}}) => {
      const height = layout.height + 2 * (padding + border);
      // Use real native text measurements (including Tamil shaping), never character counts.
      // At the readable floor, allow a taller canvas instead of truncating any section.
      if (height > width * 1.6 && fontSize > 12) setFontSize(value => Math.max(12, value - 1));
      else onReady(height);
    }}>
      {badge ? <Text allowFontScaling={false} style={[s.badge, {color: accent, fontSize: fontSize + 3, lineHeight: lineHeight + 6}]}>{badge}</Text> : null}
      <Text allowFontScaling={false} style={[s.title, {fontSize: fontSize + 7, lineHeight: Math.ceil((fontSize + 7) * 1.5),
        textAlign: variant === 3 ? 'center' : 'left'}]}>{title}</Text>
      {sections.map(section => <View key={section.key} style={{marginTop: Math.ceil(fontSize * 0.9)}}>
        <Text allowFontScaling={false} style={[s.label, {color: accent, fontSize, lineHeight}]}>{section.label}</Text>
        <Text allowFontScaling={false} textBreakStrategy="highQuality" android_hyphenationFrequency="normal"
          style={[s.body, textStyle]}>{section.text}</Text>
      </View>)}
      {brandLines.length ? <View style={[s.brand, {borderTopColor: accent}]}>
        {brandLines.map((line, index) => <Text key={index} allowFontScaling={false}
          style={[s.body, {color: accent, fontSize: 12, lineHeight: 20}]}>{line}</Text>)}
      </View> : null}
    </View>
  </View>;
});
const s = StyleSheet.create({
  canvas: {alignSelf: 'center'}, badge: {fontWeight: '700', includeFontPadding: true},
  title: {color: '#FFF7E7', fontWeight: '800', marginTop: 10, includeFontPadding: true},
  label: {fontWeight: '700', includeFontPadding: true}, body: {color: '#EBE7EF', includeFontPadding: true, flexShrink: 1},
  brand: {marginTop: 20, paddingTop: 12, borderTopWidth: 1},
});
