import QRCode from 'react-native-qrcode-svg';
import { StyleSheet, View } from 'react-native';

import { radius } from '@/theme/tokens';

/** QR codes need a light quiet zone to scan reliably, hence the white plate. */
export function PayQr({ value, size = 130 }: { value: string; size?: number }) {
  return (
    <View style={[styles.plate, { borderRadius: radius.input }]}>
      <QRCode value={value} size={size} backgroundColor="#FFFFFF" color="#05070F" />
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    backgroundColor: '#FFFFFF',
    padding: 9,
    alignSelf: 'center',
  },
});
